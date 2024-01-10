<template>
  <h3 class="pl-4 p-2 mb-2 text-white btn-gradient-1">
    <span class="p-2">
      Connected to {{ xbit.formatAddress(devicesStore.connected)}}
    </span>
    <!-- <button class="float-right p-2 rounded" @click="showAdvanced = !showAdvanced">
      <i class="fa-solid fa-glasses"></i>
    </button> -->
  </h3>
  <div class="grow max-w-md pl-4">
    <div class="flex flex-row w-full">
      <div class="p-2 m-2 text-white bg-canvas-slate-700 grow">
        <label class="bg-canvas-slate-600 text-white p-2 rounded cursor-pointer block text-center" for="fileInput" @click="filePicker">
          <i class="fa-solid fa-file-code"></i> Select File to Upload to {{ xbit.formatAddress(devicesStore.connected)}}
        </label>
        <input type="file" id="fileInput" @change="selectFile" class="hidden">
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
        <div>File Name: {{ selectedFile.name }}</div>
        <div>File Last Modified: {{ xbit.toDate(selectedFile.lastModified) }}</div>
        <div>File Size: {{ selectedFile.size }}</div>
      </div>
    </Transition> 
    <div class="text-white m-2 p-2 bg-canvas-sky-700" v-if="!progressText">
      <div class="mb-1">
        <i class="fas fa-info-circle"></i> Uploading a file will overwrite the existing file with the same name on the device.
      </div>
      <div v-if="targetFile">File will be uploaded to:</div>
      <div v-if="targetFile" class="flex">
        <div class="p-1">{{ targetPath }}/</div>
        <div class="grow">
          <input type="text" v-model="targetFile" class="bg-canvas-slate-600 text-white p-1 rounded" style="width: 100%">
        </div>
      </div>
    </div>
    <div class="text-white m-2 p-2 bg-canvas-sky-700" v-if="progressText">
      <i class="fa-solid fa-spinner fa-spin" v-show="uploading"></i>
      {{ progressText }}
    </div>
    <div class="text-white m-2 p-2 bg-canvas-pink-300" v-if="errorText">
      {{ errorText }}
    </div>
  </div>

  <div class="action-button btn-gradient-1" style="justify-self: flex-end;">
    <button @click="uploadFile()" :disabled="!selectedFile || uploading"
      class="bg-canvas-slate-800 p-4 w-full h-full"
      :class="{
        'text-white cursor-pointer': selectedFile,
        'text-gray-600 cursor-not-allowed': !selectedFile
      }">
      Upload File
    </button>
  </div>
</template>
<script>
import { defineComponent } from 'vue'
import { xbit } from '@bennybtl/xbit-lib'
import { useDevicesStore } from '@/stores/devices-store'
import { useFirmwareUpdateStore } from '@/stores/firmware-update.store'

let selectedFileData = null
export default defineComponent({
  name: 'UploadFileView',
  setup () {
    return {
      devicesStore: useDevicesStore(),
      firmwareUpdateStore: useFirmwareUpdateStore(),
      xbit
    }
  },
  data () {
    return {
      jsonDataListener: null,
      selectedFile: null,
      progressText: null,
      uploading: false,
      errorText: null,
      targetFile: '',
      targetPath: ''
    }
  },
  async mounted () {
    // this code is duplicated in firmwareUpdateStore.detectSmp()
    const dictionaryResponse = await xbit.sendBleGetGattDictionaryCommand({
      deviceAddress: this.devicesStore.connected
    })

    let smpCharId = null
    for (const service of dictionaryResponse.services) {
      if (service.serviceUuid.toUpperCase() === this.firmwareUpdateStore.GUID_SERVICE_SMP) {
        for (const characteristic of service.characteristics) {
          if (characteristic.characteristicUuid.toUpperCase() === this.firmwareUpdateStore.GUID_SMP) {
            smpCharId = this.firmwareUpdateStore.GUID_SMP
            break;
          }
        }
      }
    }

    if (!smpCharId) {
      return Promise.reject(new Error('SMP not found'))
    }

    await this.xbit.sendBleNotifyEnableCommand({
      uuid: smpCharId,
      deviceAddress: this.devicesStore.connected
    })

    this.jsonDataListener = (event) => {
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
  },
  methods: {
    async selectFile (event) {
      this.progressText = 'Loading File...'
      const file = await event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          selectedFileData = new Uint8Array(e.target.result)
          this.selectedFile = {
            name: file.name,
            size: file.size,
            path: file.path,
            lastModified: file.lastModified
          }
          this.targetFile = this.selectedFile.name
          this.targetPath = '/lfs1/scripts'

          // TODO 
          // sanitize file name, update UI with the target file name
          // no special characters

          // regex sanitize file name to be only letters, numbers, dashes and underscores
          this.targetFile = this.targetFile.replace(/\s/g, '-')
          this.targetFile = this.targetFile.replace(/[^a-zA-Z0-9-_.]/g, '')
          // remove trailing slash(es)
          this.targetPath = this.targetPath.replace(/\/+$/, '')
          this.progressText = null
        }
        reader.readAsArrayBuffer(file)
      }
    },
    deselectFile () {
      this.selectedFile = null
      selectedFileData = null
      this.progressText = null
    },
    uploadFile () {
      this.uploading = true

      this.firmwareUpdateStore.mcumgr.onFileUploadProgress(({ percentage }) => {
        this.progressText = '\rUploading... ' + percentage + '%'
      })

      this.firmwareUpdateStore.mcumgr.onFileUploadNext(async ({ packet }) => {
        return await this.xbit.sendBleWriteCommand({
          data: packet,
          uuid: this.firmwareUpdateStore.smpCharId,
          deviceAddress: this.devicesStore.connected
        })
      })

      this.firmwareUpdateStore.mcumgr.onFileUploadFinished(() => {
        this.progressText = 'File upload complete'
        this.uploading = false
        setTimeout(() => {
          this.deselectFile()
        }, 5000)
      })
 
      // TODO prefill the target path allowing the user to change it
      const fullPath = this.targetPath + '/' + this.targetFile

      this.firmwareUpdateStore.mcumgr.cmdUploadFile(selectedFileData, fullPath)
    }
  },
  async beforeRouteLeave (to) {
  }
})
</script>