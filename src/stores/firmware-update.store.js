import { MCUManager, constants } from '@/assets/mcumgr'

const states = [
  {
    name: 'detectSmp',
    ready: false, // this state has initialized
    done: false, // this state has completed and may be advanced
    actionText: 'Detect SMP',
    infoText: 'Request GATT SMP service to determine if device is SMP capable.',
  },
  {
    name: 'readImageState',
    ready: false, // this state has initialized
    done: false, // this state has completed and may be advanced
    actionText: 'Read Image State',
    infoText: 'Read Image State to determine firmware status.',
  },
  {
    name: 'uploadImageState',
    ready: true, // no initialization required
    done: false,
    actionText: 'Upload Image',
    infoText: 'Select a firmware file to upload to slot 2.',
  },
  {
    name: 'readyImageState',
    ready: false,
    done: false,
    actionText: 'Test Image',
    infoText: 'Slot 2 has an valid image. Click "Test Image" to test it or upload a different image.',
  },
  {
    name: 'invalidImageState',
    ready: false,
    done: false,
    actionText: 'Erase Image',
    infoText: 'Slot 2 has an invalid image. Click "Erase Image" to erase it or upload a different image',
  },
  {
    name: 'validImageState',
    ready: false,
    done: false,
    actionText: 'Confirm Image',
    infoText: 'Slot 2 has an valid image. Click "Confirm Image" to confirm it or wait and the device will swap images back.',
  },
  {
    name: 'finishedState',
    ready: false,
    done: false,
    actionText: 'Disconnect',
    infoText: 'Firmware has been updated. Click "Disconnect" to disconnect from the device.',
  }
]

export const useFirmwareUpdateStore = defineStore({
  id: 'firmwareUpdateStore',
  state: () => {
    return {
      mcumgr: new MCUManager(),
      state: 0,
      readingImageState: false,
    }
  },
  getters: {
    currentState (state) {
      return states[state.state]
    }
  },
  actions: {
    setState (id) {
      this.currentState.ready = false
      this.state = id
      this.currentState.ready = true
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
        return this.setState(2)
      }

      if (this.images.length === 2) {
        if (!this.images[1].bootable) {
          return this.setState(4)
        }
        if (this.images[1].pending === false) {
          // send test command
          await this.imageTest()
          // read the image state
          await this.readImageState()
        }
        return this.setState(3)
      }

      if (this.readingImageState) {
        clearTimeout(this.readingImageState.timeout)
        this.readingImageState.resolve()
        this.readingImageState = null
      }
    },
    async readImageState () {
      const data = this.mcumgr.cmdImageTest(this.images[1].hash)
      // after upload a version, send this command to test it
      await xbit.sendBleWriteCommand({
        data,
        uuid: this.smpCharId,
        deviceId: this.devicesStore.connected
      })

      // read the image state
      readingImageState = {}
      const aPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('readImageState Timeout'))
        }, 7500)

        this.readingImageState.resolve = resolve
        this.readingImageState.reject = reject
        this.readingImageState.timeout = timeout
      })
      this.readingImageState.promise = aPromise
      return aPromise
    },
    imageUpload () {
      this.currentState.done = false

      this.mcumgr.onImageUploadNext(async({ packet }) => {
        return await xbit.sendBleWriteCommand({
          data: packet,
          uuid: this.GUID_SMP,
          deviceId: this.devicesStore.connected
        })
      })
  
      this.mcumgr.onImageUploadProgress(({ percentage }) => {
        this.currentState.infoText = 'Uploading... ' + percentage + '%'
        // TODO update progress bar
      })
  
      this.mcumgr.onImageUploadFinished(async () => {
        await this.readImageState()
        this.currentState.done = true
        // clear selected file
        this.deselectFile()
  
        this.progressInfo = 'Upload complete. Marking image as pending...'
        await this.imageTest()
        this.progressInfo = 'Upload complete. Resetting to swap to new image....'
        this.reset()
      })
  
      this.mcumgr.cmdUpload(this.selectedFileData, 1)

    },
  }
})