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

      // start timeout unless it's 0
      if (timeout !== 0) {
        this.scanningTimeout = setTimeout(async () => {
          // scan should stop by itself but need to change state locally
          await this.stopScanning()
        }, timeout)
      }

      // send scan command
      try {
        await xbit.sendStartBluetoothScanningCommand({
          timeout,
          active: 1
        })
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
      if (!event) {
        this.connected = null
        this.selected = null
      } else if (this.disconnectingState?.deviceAddress === event.params.deviceAddress) {
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
    },
    processAd (event) {
      // if (event.id !== this.scanSessionId) return

      // const ad = event.params.data
      // check if device already exists
      let device = this.devices.find(device => device.address === event.params.deviceAddress)
      if (!device) {
        const newDevice = new DiscoveredDevice(event.params)
        this.devices.push(newDevice)
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
        // TODO
        // if device.address !== this.connectingState.deviceAddress
        // reject
        return this.connectingState.promise
      }

      // if device is a string, find the device
      if (typeof device === 'string') {
        device = this.devices.find(d => d.address === device)
      }

      // if no device is pass, use the selected device
      if (!device && this.selectedDevice) {
        device = this.selectedDevice
      } else if (!device) {
        return Promise.reject(new Error('No device selected'))
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
        
        // create a promise to handle the bleConnect event
        // that should be coming
        this.connectingState.promise = new Promise((resolve, reject) => {
          // timeout if no bleConnect event is received
          this.connectingState.timeout = setTimeout(() => {
            this.connectingState.reject(new Error('Connect Device Timeout'))
          }, 7500)

          this.connectingState.resolve = resolve
          this.connectingState.reject = (error) => {
            // wrap the reject so we can do some other things
            // like clear the timeout
            // and send a toast
            clearTimeout(this.connectingState.timeout)
            this.connectingState = null
            this.selected = null
   
            xbit.sendToast({
              message: error?.message || error || 'Unable to connect',
              type: 'error'
            })    
            reject(new Error('Connection failed'))
          }
        })

        // store the promise so that if connectDevice is called during this
        // this connection attemp, we can return it again
        return this.connectingState.promise
      } catch (error) {
        xbit.sendToast({
          message: error.message || error || 'Unable to connect',
          type: 'error'
        })
        return Promise.reject()
      }  
    },
    // method to disconnect from a ble device
    async disconnectDevice () {
      try {
        await xbit.sendBluetoothDisconnectCommand()
        this.disconnectingState = {
          deviceAddress: this.selected
        }

        this.disconnectingState.promise = new Promise((resolve, reject) => {
          this.disconnectingState.timeout = setTimeout(() => {
            this.connectingState.reject(new Error('Disconnect Device Timeout'))
          }, 7500)  
          this.disconnectingState.resolve = resolve
          this.connectingState.reject = (error = null) => {
            // wrap the reject so we can do some other things
            // like clear the timeout
            // and send a toast
            clearTimeout(this.connectingState.timeout)
            this.connectingState = null
            this.selected = null
   
            xbit.sendToast({
              message: error?.message || error || 'Unable to disconnect',
              type: 'error'
            })    
            reject(new Error('Disconnection failed'))
          }
        })
        return this.disconnectingState.promise
      } catch (error) {
        if (error !== 'NOCONN') {
          xbit.sendToast({
            message: error.message || error || 'Unable to disconnect',
            type: 'error'
          })  
          return Promise.reject()
        }
        return Promise.resolve()
      }  
    }
  }
})
