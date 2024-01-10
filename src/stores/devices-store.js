import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { xbit, DiscoveredDevice} from '@bennybtl/xbit-lib'

export const useDevicesStore = defineStore({
  id: 'devicesStore',
  state: () => {
    return {
      devices: [],
      connected: null,
      selected: null,
      // scanSessionId: null,
      connectingState: null,
      disconnectingState: null
    }
  },
  getters: {
    connectedDevice: (state) => {
      return state.devices.find(device => device.address === state.connected)
    },
    selectedDevice: (state) => {
      return state.devices.find(device => device.address === state.selected)
    },
    selectedDeviceAddress: (state) => {
      return state.selectedDevice?.address
    },
    sortedDevices: (state) => {
      return state.devices.sort((a, b) => {
        return a.isCanvas ? -1 : 1
      })
    },
    connecting: (state) => {
      return state.connectingState !== null
    }
  },
  actions: {
    clear () {
      this.devices.length = 0
    },
    async stopScanning () {
      if (this.scanningTimeout === null) return null
      // stop timeout
      clearTimeout(this.scanningTimeout)
      try {
        await xbit.sendStopBluetoothScanningCommand()
        this.scanningTimeout = null
        return this.scanningTimeout
      } catch (error) {
        if (error === 'usbDevice is undefined') {
          error = 'No Xbit USB Device selected and connected.'
        }
        xbit.sendToast({
          type: 'error',
          message: error,
          options: {
            timeout: 10000
          }
        })
        return true
      }
    },
    async startScanning (timeout = 5000) {
      if (this.scanningTimeout) {
        return this.stopScanning()
      }
      this.clear() 

      // start timeout
      this.scanningTimeout = setTimeout(async () => {
        // stop scan
        this.stopScanning()
      }, timeout)

      // send scan command
      try {
        const command = await xbit.sendStartBluetoothScanningCommand()
        // this.scanSessionId = command?.i || command?.id || null
      } catch (error) {
        clearTimeout(this.scanningTimeout)
        this.scanningTimeout = null
        if (error === 'usbDevice is undefined') {
          error = 'No Xbit USB Device selected and connected.'
        }
        xbit.sendToast({
          type: 'error',
          message: error,
          options: {
            timeout: 10000
          }
        })
      }
    },
    processConnect (event) {
      if (this.connectingState?.deviceAddress === event.params.deviceAddress) {
        this.connected = event.params.deviceAddress
        clearTimeout(this.connectingState.timeout)
        this.connectingState.resolve(this.connected)
        this.connectingState = null
      }
    },
    processDisconnect (event) {
      if (this.disconnectingState?.deviceAddress === event.params.deviceAddress) {
        clearTimeout(this.disconnectingState.timeout)
        this.disconnectingState.resolve(this.connected)
        this.disconnectingState = null
        this.connected = null
        this.selected = null
      } else if (this.connected === event.params.deviceAddress) {
        this.connected = null
        this.selected = null
      } else {
        // ignore ?
      }

      if (this.connectingState?.deviceAddress === event.params.deviceAddress) {
        clearTimeout(this.connectingState.timeout)
        this.connectingState.reject(new Error('Connection failed'))
        this.connectingState = null
        this.selected = null
      }
    },
    processAd (event) {
      // if (event.id !== this.scanSessionId) return

      // const ad = event.params.data
      // check if device already exists
      let device = this.devices.find(device => device.address === event.params.deviceAddress)
      if (!device) {
        this.devices.push(new DiscoveredDevice(event.params))
      } else {
        device.update(event.params)
      }
    },
    selectDevice (device) {
      if (device.address === this.selected) {
        this.selected = null
        return
      }
      this.selected = device.address
    },
    // pass a device or address or nothing
    // if nothing, use selected device
    //
    // returns the connected device if successful
    // returns null if unsuccessful
    async connectDevice (device = null) {
      if (this.connectingState) {
        return this.connectingState.promise
      }
      if (!device) {
        device = this.selectedDevice
      }

      if (typeof device === 'string') {
        device = this.devices.find(d => d.address === device)
      }

      try {
        // this command returns immediately if successful
        // but it's not yet actually connected
        await xbit.sendBluetoothConnectCommand({
          deviceAddress: device.address
        })
        // now in connecting state while waiting for the connection
        this.connectingState = {
          deviceAddress: this.selected
        }
        const aPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('connectDevice Timeout'))
          }, 7500)

          this.connectingState.resolve = resolve
          this.connectingState.reject = reject
          this.connectingState.timeout = timeout
        })
        this.connectingState.promise = aPromise
        return aPromise
      } catch (error) {
        return Promise.reject(error)
      }  
    },
    async disconnectDevice (device = null) {
      try {
        const result = await xbit.sendBluetoothDisconnectCommand()
        // if the device is not connected, return
        if (result.e === 'NOCONN') {
          return Promise.resolve()
        }
        this.disconnectingState = {
          deviceAddress: this.selected
        }
        const aPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout'))
          }, 5000)

          this.disconnectingState.resolve = resolve
          this.disconnectingState.reject = reject
          this.disconnectingState.timeout = timeout
        })
        this.disconnectingState.promise = aPromise
        return aPromise
      } catch (error) {
        xbit.sendToast({
          message: error.message,
          type: 'error'
        })
        return this.connected
      }  
    }
  }
})
