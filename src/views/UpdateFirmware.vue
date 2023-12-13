
<template>
  <div class="grow">
    <h3 class="m-2 text-white">
      <span class="p-2">
        Connected to {{ devicesStore.connected || '?'}}
      </span>
      <button class="float-right p-2 rounded" @click="showAdvanced = !showAdvanced">
        <i class="fa-solid fa-glasses"></i>
      </button>
    </h3>
    <div class="m-2" v-show="showAdvanced">
      <button class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25" :disabled="settingUpSmp" @click="setupSmp">
        <i class="fa-solid fa-arrows-rotate"
         :class="{
          'fa-spin': settingUpSmp,
         }"></i>
        Detect SMP
      </button>
      <button class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25" :disabled="readingImageState" @click="readImageState">
        <i class="fa-solid fa-arrows-rotate"
         :class="{
          'fa-spin': readingImageState,
         }"></i>
        Read Image State
      </button>
      <button class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25" @click="imageTest" :disabled="testButtonDisabled || testingImageState">
        <i class="fa-solid fa-arrows-rotate"
         :class="{
          'fa-spin': testingImageState,
         }"></i>
        Test Image
      </button>
      <button class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25" @click="imageConfirm" :disabled="confirmButtonDisabled || confirmingImageState">
        Image Confirm
      </button>
      <button class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25" @click="imageErase" :disabled="eraseButtonDisabled || erasingImage">
        Image Erase
      </button>
      <button class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25" @click="reset" :disabled="resetting">
        <i class="fa-solid fa-arrows-rotate"
         :class="{
          'fa-spin': resetting,
         }"></i>
        Reset
      </button>
    </div>
    <div class="flex flex-row w-full">
      <div v-for="image in images" :key="image.slot" class="p-2 m-2 text-white bg-canvas-slate-700 grow">
        <h3><i class="fa-solid fa-microchip py-2 my-2"></i> Slot {{ image.slot + 1 }} 
          <button v-if="image.slot === 1 && !uploading && !image.empty" class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25 float-right" @click="imageErase" :disabled="eraseButtonDisabled || erasingImage">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </h3>
        <div class="whitespace-nowrap">Version: {{ image.version }}</div>
        <div v-if="!image.empty">
          <div>Pending <i :class="{
            'fa-solid fa-circle-check': image.pending,
            'fa-regular fa-circle': !image.pending
            }"></i>
          </div>
          <div>Confirmed <i :class="{
            'fa-solid fa-circle-check': image.confirmed,
            'fa-regular fa-circle': !image.confirmed
            }"></i></div>
          <div>Bootable <i :class="{
            'fa-solid fa-circle-check': image.bootable,
            'fa-regular fa-circle': !image.bootable
            }"></i></div>
        </div>
        <div v-if="image.slot === 1" class="mt-2">
          <button v-if="!image.pending && !image.empty" class="bg-canvas-slate-600 text-white p-2 mb-2 rounded cursor-pointer block w-full text-center disabled:opacity-25" @click="imageTest" :disabled="testButtonDisabled || testingImageState">
            Set Pending
          </button>
          <label class="bg-canvas-slate-600 text-white p-2 rounded cursor-pointer block text-center" for="fileInput" @click="filePicker"><i class="fa-solid fa-file-code"></i> Image</label>
          <input type="file" id="fileInput" @change="selectFile" class="hidden" accept=".bin">
        </div>
      </div>
    </div>
    <Transition name="fade" mode="out-in">
      <div v-if="selectedFile" class="bg-canvas-slate-700 text-white p-2 m-2">
        <h3>
          <i class="fa-solid fa-microchip py-2 my-2"></i> 
          Selected File
          <button @click="deselectFile()" class="float-right text-canvas-slate-500 hover:text-white">
            <i class="fas fa-times"></i>
          </button>
        </h3>
        <div>Version: {{ selectedFile.version }}</div>
        <div>File Name: {{ selectedFile.name }}</div>
        <!-- <div>File Path: {{ selectedFile.path }}</div> -->
        <div>File Last Modified: {{ xbit.toDate(selectedFile.lastModified) }}</div>
        <div>Image Size: {{ selectedFile.imageSize }}</div>
      </div>
    </Transition>
    <div class="text-white m-2 p-2 bg-canvas-sky-700" v-if="progressInfo">
      <i v-if="uploading" class="fa-solid fa-spinner fa-spin"></i>
      {{ progressInfo }}
    </div>
  </div>
  <div class="action-button btn-gradient-1">
    <button @click="firmwareAction()"
      class="bg-canvas-slate-800 text-white p-4 w-full h-full disabled:opacity-25"
      :disabled="updateFirmwareActionDisabled()">
      {{ updateFirmwareAction }}
    </button>
  </div>

</template>

<script>
import { defineComponent } from 'vue'
import { xbit } from '@bennybtl/xbit-lib'
import { useDevicesStore } from '@/stores/devices-store'
import { MCUManager, constants } from '@/assets/mcumgr'

// create a variable to hold the firmware data
// we don't need to store this in the component data as it's huge
let selectedFileData = null

export default defineComponent({
  name: 'HomeView',
  setup () {
    const GUID_SMP = 'DA2E7828-FBCE-4E01-AE9E-261174997C48'
    const mcumgr = new MCUManager()
    return {
      xbit,
      mcumgr,
      GUID_SMP,
      devicesStore: useDevicesStore()
    }
  },
  data () {
    return {
      images: [],
      selectedFile: false,
      pendingFile: false,

      showAdvanced: false,
      jsonDataListener: null,
      progressInfo: '',
      updateFirmwareAction: 'Update Firmware',

      settingUpSmp: false,
      readingImageState: false,
      testingImageState: false,
      confirmingImageState: false,
      erasingImage: false,
      resetting: false,
      uploading: false,

      testButtonDisabled: true,
      confirmButtonDisabled: true,
      eraseButtonDisabled: false,
    }
  },
  async mounted () {

    if (!this.devicesStore.connected) {
      this.$router.push({ name: 'home' })
    }

    this.mcumgr.onMessage(async ({ op, group, id, data, length }) => {
      switch (group) {
        case constants.MGMT_GROUP_ID_OS:
          switch (id) {
            case constants.OS_MGMT_ID_ECHO:
              alert(data.r)
              break
            case constants.OS_MGMT_ID_TASKSTAT:
              console.table(data.tasks)
              break
            case constants.OS_MGMT_ID_MPSTAT:
              console.log(data)
              break
          }
          break
        case constants.MGMT_GROUP_ID_IMAGE:
          switch (id) {
            case constants.IMG_MGMT_ID_STATE:
              this.readingImageState = false
              this.testingImageState = false
              this.confirmingImageState = false

              this.images = data.images
              this.testButtonDisabled = !(data.images.length > 1 && data.images[1].pending === false)
              this.confirmButtonDisabled = !(data.images.length > 0 && data.images[0].confirmed === false)
              if (this.images.length === 1) {
                this.progressInfo = 'Select a firmware file to upload to slot 2'
                this.updateFirmwareAction = 'Upload Image'
                this.images.push({
                  slot: 1,
                  empty: true,
                  version: 'Empty',
                  pending: false,
                  confirmed: false,
                  bootable: false
                })
              } else if (data.images.length === 2 && data.images[1].bootable)  {
                this.progressInfo = 'Slot 2 has an image. Click "Test Image" to test it or upload a different image.'
                this.updateFirmwareAction = 'Test Image'
              } else {
                this.progressInfo = 'Slot 2 has an invalid image. Click "Erase Image" to erase it or upload a different image.'
              }
              break
          }
          break
        default:
          console.log('Unknown group')
          break
      }

    })

    this.mcumgr.onImageUploadNext(async({ packet }) => {
      return await xbit.sendBleWriteCommand({
        data: packet,
        uuid: this.GUID_SMP,
        deviceId: this.devicesStore.connected
      })
    })

    this.mcumgr.onImageUploadProgress(({ percentage }) => {
      this.progressInfo = 'Uploading... ' + percentage + '%'
      // TODO update progress bar
    })

    this.mcumgr.onImageUploadFinished(async () => {
      this.uploading = false
      this.progressInfo = 'Upload complete'
      await this.readImageState()

      // clear selected file
      this.deselectFile()

      this.progressInfo = 'Upload complete. Marking image as pending...'
      await this.imageTest()
      this.progressInfo = 'Upload complete. Resetting to swap to new image....'
      this.reset()
    })

    this.jsonDataListener = (event) => {
      console.log('UpdateFirmware.vue jsonDataListener', event)
  
      if (event.method === 'bluetoothNotificationReceived' &&
        event.params.uuid.toLowerCase() === this.smpCharId.toLowerCase()) {
        this.mcumgr._notification(event.params.data)
      }

      // Mobile app responds to file picker with this event
      if (event.method === 'filePickerSelected') {
        const event = {
          target: {
            files: [
              {
                name: event.params.name,
                size: event.params.imageData.length,
                path: '',
                lastModified: Date.now()
              }
            ]
          }
        }
        this.selectFile(event)
      }
    }
    xbit.addEventListener('bluetoothNotificationReceived', this.jsonDataListener)
    xbit.addEventListener('filePickerSelected', this.jsonDataListener)

    // watch for device to disconnect and go back to home
    this.$watch('devicesStore.connected', async (val) => {
      if (this.resetting) return
      if (!val) {
        // set notification error
        xbit.sendToast({
          type: 'error',
          message: 'Disconnected'
        })
        // if persist connection is enabled, try to reconnect
        if (this.persistConnection) {
          await this.devicesStore.connectDevice(this.devicesStore.selected)
        } else {
          // try to reconnect
          this.$router.push({ name: 'home' })
        }
      } else {
        // set notification success
        xbit.sendClearToast()
      }
    })

    try {
      await this.setupSmp()
    } catch (e) {
    // if no SMP found, display error
      return console.log('error setting up SMP', e)
    }
    await this.readImageState()
  },
  async beforeRouteLeave () {
    xbit.removeEventListener('jsonData', this.jsonDataListener)
    if (this.uploading) {
      xbit.sendToast({
        type: 'error',
        message: 'Uploading in progress, please wait.'
      })
      return false
    }
    if (this.devicesStore.connected) {
      // disconnect from the device
      const connected = await this.devicesStore.disconnectDevice()
      // else there was a problem disconnecting. what to do?
      if (connected !== null) {
        // display error
      }
    }
  },
  methods: {
    updateFirmwareActionDisabled () {
      if (this.pendingFile && !this.uploading) return false
      if (this.pendingFile || this.selectedFile) return false
      return true
    },
    async readImageState () {
      this.progressInfo = 'Reading image state...'
      this.readingImageState = true
      // read the current version from the device
      return await xbit.sendBleWriteCommand({
        data: this.mcumgr.cmdImageState(),
        uuid: this.smpCharId,
        deviceId: this.devicesStore.connected
      })
    },
    async imageTest () {
      if (this.images.length > 1 && this.images[1].pending === false) {
        const data = this.mcumgr.cmdImageTest(this.images[1].hash)
        // after upload a version, send this command to test it
        return await xbit.sendBleWriteCommand({
          data,
          uuid: this.smpCharId,
          deviceId: this.devicesStore.connected
        })
      }
    },
    async imageConfirm () {
      if (this.images.length > 0 && this.images[0].confirmed === false) {
        const data = this.mcumgr.cmdImageConfirm(this.images[0].hash)

        // after confirm, send this command to apply it
        return await xbit.sendBleWriteCommand({
          data,
          uuid: this.smpCharId,
          deviceId: this.devicesStore.connected
        })
      }
    },
    async imageErase () {
      this.erasingImage = true
      // after confirm, send this command to apply it
      await xbit.sendBleWriteCommand({
        data: this.mcumgr.cmdImageErase(),
        uuid: this.smpCharId,
        deviceId: this.devicesStore.connected
      })
      this.erasingImage = false
      await this.readImageState()
    },
    async reset () {
      xbit.sendToast({
        message: 'Resetting... Please wait.',
        options: { autoClose: false }
      })

      this.resetting = true
      this.progressInfo = 'The device is resetting and swapping firmware images. It will attempt to boot the new image, and if not successful, will revert to the previous image. This may take up to 2 minutes.'
      this.updateFirmwareAction = 'Resetting...'

      await xbit.sendBleWriteCommand({
        data: this.mcumgr.cmdReset(),
        uuid: this.smpCharId,
        deviceId: this.devicesStore.connected
      })
      await this.devicesStore.startScanning(120 * 1000)

      return new Promise((resolve, reject) => {
        // watch devices for the device to come back
        const timeout = setTimeout(async () => {
          await this.devicesStore.stopScanning(device)
          this.resetting = false
          this.progressInfo = ''
          this.updateFirmwareAction = ''
          // TODO Reset timed out. What to do?
          reject()
        }, 120 * 1000)

        const watchDevicesInterval = setInterval(async () => {
          for (const device of this.devicesStore.devices) {
            if (device.address === this.devicesStore.selected) {
              clearInterval(watchDevicesInterval)
              clearTimeout(timeout)

              this.resetting = false
              this.progressInfo = ''
              this.updateFirmwareAction = ''
              try {
                await this.devicesStore.stopScanning(device)
                await this.devicesStore.connectDevice(device)
                await this.setupSmp()
                await this.readImageState()
                if (data.images.length > 1) {
                  if (data.images[0].version === this.selectedFile.version) {
                    // send confirm
                      this.progressInfo = 'New image booted. Confirming image...'
                      await this.imageConfirm()
                    }
                  } else if (data.images[1].version === this.selectedFile.version) {
                    // send confirm
                    this.progressInfo = 'New image was not booted successfully.'
                    this.deselectFile()
                }
              } catch (e) {
                console.log('error resetting', e)
              }
              resolve()
              break
            }
          }
        }, 1000)
      })
    },
    async setupSmp () {
      this.settingUpSmp = true
      const dictionaryResponse = await xbit.sendBleGetGattDictionaryCommand({
        deviceId: this.devicesStore.connected
      })

      this.smpCharId = null
      for (const service in dictionaryResponse.j) {
        if (dictionaryResponse.j[service].UUID.toUpperCase() === '8D53DC1D-1DB7-4CD3-868B-8A527460AA84') {
          for (const characteristic in dictionaryResponse.j[service]) {
            if (/^Characteristic/.test(characteristic) &&
              dictionaryResponse.j[service][characteristic].UUID) {
              if (dictionaryResponse.j[service][characteristic].UUID.toUpperCase() === this.GUID_SMP) {
                this.smpCharId = this.GUID_SMP
                break;
              }
            }
          }
        }
      }

      if (!this.smpCharId) {
        return Promise.reject(new Error('SMP not found'))
      }

      // Skip this as it's not supported on mobile
      // await xbit.sendBleSetGattNameCommand({
      //   uuid: this.smpCharId,
      //   name: 'smp',
      //   deviceId: this.devicesStore.connected
      // })
      // this.smpCharId = 'smp'

      await xbit.sendBleNotifyEnableCommand({
        uuid: this.smpCharId,
        deviceId: this.devicesStore.connected
      })
      this.settingUpSmp = false
    },
    async selectFile (event) {
      const onLoad = async (fileResult) => {
        try {
          const info = await this.mcumgr.imageInfo(fileResult)
          this.selectedFile.imageSize = info.imageSize
          this.selectedFile.version = info.version
          selectedFileData = fileResult
          this.progressInfo = 'Firmware selected. Click "Upload Image" to begin.'
          this.updateFirmwareAction = 'Upload Image'
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
    filePicker() {
      console.log('opening filepicker on mobile')
      xbit.sendFilePickerCommand({
        accept: '.bin'
      })
    },
    deselectFile() {
      selectedFileData = null
      this.selectedFile = false
      try {
        // reset the file input
        this.$refs.fileInput.value = ''
      } catch (e) {
        // console.log('error resetting file input', e)
      }
      this.updateFirmwareAction = 'Upload Image'
    },
    // main action button at the bottom of the screen
    // triggers this function
    async firmwareAction () {
      // if already have a pending file, reset
      if (!selectedFileData && this.pendingFile) {
        return this.reset()
      }

      // if no file selected, do nothing
      if (!selectedFileData) return

      // otherwise, start the upload
      this.mcumgr.cmdUpload(selectedFileData, 1)
      this.uploading = true
    }
  }
})
</script>
