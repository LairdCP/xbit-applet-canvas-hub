import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { xbit, DiscoveredDevice} from '@bennybtl/xbit-lib'

export const useDevicesStore = defineStore({
  id: 'devicesStore',
  state: () => {
    return {
      devices: [],
      connected: null,
      selected: null
      // scanSessionId: null,
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
    connecting: () => {
      return xbit.connectingState !== null
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
        await xbit.bluetoothConnect({
          deviceAddress: device.address
        })
        this.connected = device.address
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
        await xbit.bluetoothDisconnect()
        this.connected = null
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
