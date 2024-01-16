import { MCUManager, constants } from '@/assets/mcumgr'
import { useDevicesStore } from './devices-store'
import { defineStore } from 'pinia'
import { xbit } from '@bennybtl/xbit-lib'

let selectedFileData = null
const states = [
  {
    name: 'detectSmp',
    ready: true, // no initialization required. Can send the detect command
    busy: false, // this state is busy
    actionText: 'Detect SMP',
    progressText: 'Detecting SMP service...',
    infoText: 'Request GATT SMP service to determine if device is SMP capable.',
  },
  {
    name: 'readImageState',
    ready: false, // Can send the read image state command
    busy: false,
    actionText: 'Read Image State',
    progressText: 'Reading Image State...',
    infoText: 'Read Image State to determine firmware status.',
  },
  {
    name: 'uploadImageState',
    ready: false, // requires user to select an image
    busy: false,
    actionText: 'Upload Image',
    progressText: '',
    infoText: 'Select a firmware update image to upload to slot 2.',
  },
  {
    name: 'readyImageState',
    ready: false,
    busy: false,
    actionText: 'Test Image',
    infoText: 'Slot 2 has a valid image. Click "Test Image" to test it or upload a different image.',
  },
  {
    name: 'resetState',
    ready: false,
    busy: false,
    actionText: 'Reset Device',
    infoText: 'Press the Reset Device button to update to the new firmware image',
    progressText: 'The device is resetting and swapping firmware images. It will attempt to boot the new image and if not successful, will revert to the previous image. This may take up to 2 minutes.',
  },
  {
    name: 'invalidImageState',
    ready: false,
    busy: false,
    actionText: 'Erase Image',
    infoText: 'Slot 2 has a invalid image. Click "Erase Image" to erase it or upload a different image',
  },
  {
    name: 'validImageState',
    ready: false,
    busy: false,
    actionText: 'Confirm Image',
    infoText: 'Slot 1 has a valid image. Click "Confirm Image" to confirm it or wait and the device will swap images back.',
  },
  {
    name: 'finishedState',
    ready: true,
    busy: false,
    actionText: 'Disconnect',
    infoText: 'Firmware has been updated. Click "Disconnect" to disconnect from the device.',
  },
  {},
  {},
  {
    name: 'initState',
    ready: true,
    busy: false,
    actionText: '',
    infoText: '',
  }
]

export const useFirmwareUpdateStore = defineStore({
  id: 'firmwareUpdateStore',
  state: () => {
    return {
      mcumgr: new MCUManager(),
      state: 10,
      states: JSON.parse(JSON.stringify(states)),
      images: [],
      selectedFile: null,
      readingImageState: false,
      pendingVersion: null,
      errorText: null,
      smpCharId: 'DA2E7828-FBCE-4E01-AE9E-261174997C48',
      GUID_SMP: 'DA2E7828-FBCE-4E01-AE9E-261174997C48',
      GUID_SERVICE_SMP: '8D53DC1D-1DB7-4CD3-868B-8A527460AA84',
      timer2: 0,
      kBPerSecondLog: [1.5]
    }
  },
  getters: {
    kBPerSecond: (state) => {
      return state.kBPerSecondLog.reduce((a, b) => a + b, 0) / state.kBPerSecondLog.length
    },
    currentState (state) {
      return state.states[state.state]
    },
    nextState (state) {
      return state.states[state.state + 1]
    },
    reading (state) {
      return state.states[1].busy
    },
    uploading (state) {
      return state.states[2].busy
    },
    resetting (state) {
      return state.states[4].busy
    },
    erasing (state) {
      return state.states[5].busy
    }
  },
  actions: {
    setState (id) {
      this.state = id
      // when changing to state 2, reset the upload info text
      this.errorText = null
      if (id === 2) {
        this.currentState.infoText = 'Select a firmware file to upload to slot 2.'
        this.deselectFile()
      }
    },
    resetStateMachine () {
      this.state = 10
      this.states = JSON.parse(JSON.stringify(states))
    },
    processNotification (event) {
      if (event.params.uuid.toLowerCase() === this.smpCharId.toLowerCase()) {
        this.mcumgr._notification(event.params.data)
      }
    },
    async processReadStateResponse (data) {
      if (data.images) {
        this.images = data.images
      } else {
        return
      }

      if (this.readingImageState) {
        clearTimeout(this.readingImageState.timeout)
        this.readingImageState.resolve()
        this.readingImageState = null
      }
      this.states[1].busy = false
      this.states[1].ready = true

      // if slot 2 is empty, set state to uploadImageState
      if (this.images.length === 1) {
        this.images.push({
          slot: 1,
          empty: true,
          version: 'Empty',
          pending: false,
          confirmed: false,
          bootable: false
        })
        // switch to upload state
        this.setState(2)
        if (this.pendingVersion) {
          this.pendingVersion = null
          // alert that the image failed and was automatically deleted
          this.errorText = 'The image failed to boot and was automatically deleted by the firmware.'
        }
        return
      }

      if (this.images.length === 2) {
        if (!this.images[1].bootable) {
          // switch to invalid state
          return this.setState(5)
        } else if (this.images[0].version === this.pendingVersion || 
          !this.images[0].confirmed) {
          if (this.images[0].confirmed) {
            // switch to finished state
            return this.setState(7)
          } else {
            // running the new version, switch to confirm
            this.states[6].ready = true
            return this.setState(6)
          }
        }
        if (this.images[1].pending === false) {
          // switch to test state to mark as pending
          this.states[3].ready = true
          return this.setState(3)
        } else {
          // switch to reset state and indicate ready
          this.pendingVersion = this.images[1].version
          this.states[4].ready = true
          return this.setState(4)
        }
      }

      // unknown image state
      this.errorText = 'The image slots are an unknown size: ' + this.images.length
    },
    async imageTest () {
      const devicesStore = useDevicesStore()
      if (
        this.images.length > 1 &&
        this.images[1].pending === false &&
        this.state === 3
      ) {
        this.currentState.busy = true
        try {
          await xbit.sendBleWriteCommand({
            data: this.mcumgr.cmdImageTest(this.images[1].hash),
            uuid: this.smpCharId,
            deviceAddress: devicesStore.connected
          })
          this.states[4].ready = true
          return this.setState(4)
        } catch (error) {
          console.error(error)
        } finally {
          this.currentState.busy = false
        }
      }
    },
    async detectSmp () {
      if (this.state !== 0) return
      const devicesStore = useDevicesStore()
      this.currentState.busy = true

      const dictionaryResponse = await xbit.sendBleGetGattDictionaryCommand({
        deviceAddress: devicesStore.connected
      })

      try {
        this.smpCharId = null
        for (const service of dictionaryResponse.services) {
          if (service.serviceUuid.toUpperCase() === this.GUID_SERVICE_SMP) {
            for (const characteristic of service.characteristics) {
              if (characteristic.characteristicUuid.toUpperCase() === this.GUID_SMP) {
                this.smpCharId = this.GUID_SMP
                break;
              }
            }
          }
        }
      } catch (error) {
        this.smpCharId = 'DA2E7828-FBCE-4E01-AE9E-261174997C48'
        return Promise.reject(new Error('Failed to parse GATT dictionary'))
      }

      if (!this.smpCharId) {
        this.smpCharId = 'DA2E7828-FBCE-4E01-AE9E-261174997C48'
        return Promise.reject(new Error('SMP not found'))
      }

      await xbit.sendBleNotifyEnableCommand({
        uuid: this.smpCharId,
        deviceAddress: devicesStore.connected
      })

      this.currentState.busy = false
      this.nextState.ready = true
    },
    async readImageState () {
      if (this.state !== 1) return
      this.states[1].busy = true

      const devicesStore = useDevicesStore()
      const sent = await xbit.sendBleWriteCommand({
        data: this.mcumgr.cmdImageState(),
        uuid: this.smpCharId,
        deviceAddress: devicesStore.connected
      })

      if (!sent) {
        this.states[1].busy = false
        throw new Error('Failed to send command')
      }
      this.readingImageState = {}
      const aPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.states[1].busy = false
          reject(new Error('readImageState Timeout'))
        }, 5000)

        this.readingImageState.resolve = resolve
        this.readingImageState.reject = reject
        this.readingImageState.timeout = timeout
      })
      this.readingImageState.promise = aPromise
      return aPromise
    },
    imageUpload () {
      if (this.state !== 2) return
      const devicesStore = useDevicesStore()
      this.currentState.busy = true
      this.pendingVersion = null
      this.onNextTime = Date.now()

      this.mcumgr.onImageUploadNext(async({ packet }) => {
        clearTimeout(this.nextPacketTimeout)
        this.nextPacketTimeout = setTimeout(() => {
          // display error
          this.errorText = 'Upload failed. Timeout receiving next packet notification. Please try again.'

          setTimeout(() => {
            this.errorText = null
            try {
              devicesStore.disconnectDevice()
            } catch (error) {
              console.error(error)
            }
          }, 7500)
        }, 1000)

        const timeTaken = Date.now() - this.timer2
        this.timer2 = Date.now()
        this.kBPerSecondLog.push((this.mcumgr._mtu / 1024) / (timeTaken / 1000))
        if (this.kBPerSecondLog.length > 30) {
          this.kBPerSecondLog.shift()
        }
        console.log(this.kBPerSecondLog)
        await xbit.sendBleWriteCommand({
          data: packet,
          uuid: this.GUID_SMP,
          deviceAddress: devicesStore.connected
        })
      })
  
      this.mcumgr.onImageUploadProgress(({ percentage }) => {
        this.currentState.progressText = `Uploading... ${percentage}% (${this.kBPerSecond.toFixed(2)} kB/s)`
        // TODO update progress bar
      })
  
      this.mcumgr.onImageUploadFinished(async () => {
        clearTimeout(this.nextPacketTimeout)
        this.currentState.busy = false 
        this.currentState.infoText = 'Upload complete.'
        // set to readState to update image list
        this.deselectFile()
        this.setState(1)
      })
  
      this.mcumgr.cmdUpload(selectedFileData, 1)
    },
    async imageErase () {
      const devicesStore = useDevicesStore()
      this.states[5].busy = true
      // after confirm, send this command to apply it
      await xbit.sendBleWriteCommand({
        data: this.mcumgr.cmdImageErase(),
        uuid: this.smpCharId,
        deviceAddress: devicesStore.connected
      })
      this.states[5].busy = false
      this.setState(1)
    },
    async imageConfirm () {
      const devicesStore = useDevicesStore()
      if (this.images.length > 0 && this.images[0].confirmed === false) {
        const data = this.mcumgr.cmdImageConfirm(this.images[0].hash)

        // after confirm, send this command to apply it
        await xbit.sendBleWriteCommand({
          data,
          uuid: this.smpCharId,
          deviceAddress: devicesStore.connected
        })
        this.setState(7)
      }
    },
    async selectFile (event) {
      if (this.state !== 2) {
        this.setState(2)
      }

      this.currentState.busy = true
      this.currentState.progressText = 'Reading file...'
      const onLoad = async (fileResult) => {
        try {
          const info = await this.mcumgr.imageInfo(fileResult)
          this.selectedFile.imageSize = info.imageSize
          this.selectedFile.version = info.version
          selectedFileData = fileResult
          this.currentState.infoText = 'Firmware selected. Click "Upload Image" to begin.'
          this.currentState.actionText = 'Upload Image'
          this.currentState.busy = false
          this.currentState.ready = true
        } catch (error) {
          // TODO invalid file?
        }
      }
      const file = await event.target.files[0]
      if (file) {
        this.selectedFile = {
          name: file.name,
          size: file.size,
          path: file.path,
          lastModified: file.lastModified
        }

        if (!file.imageData) {
          // read the file data
          const reader = new FileReader()
          reader.onload = async (e) => {
            const fileResult = new Uint8Array(e.target.result)
            onLoad(fileResult)
          }
          reader.readAsArrayBuffer(file)
        } else {
          onLoad(file.imageData)
        }
      }
    },
    deselectFile () {
      this.selectedFile = null
      selectedFileData = null
      // this.setState(1)
    }
  }
})