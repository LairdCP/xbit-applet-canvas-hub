
<template>
  <h3 class="pl-4 p-2 mb-2 text-white btn-gradient-1">
    <span class="p-2">
      <span v-if="devicesStore.connected">Connected to {{ xbit.formatAddress(devicesStore.connected) }}</span>
      <span v-else>Scanning For Device {{ this.timeRemaining }}</span>
    </span>
  </h3>
  <div class="flex flex-col" style="flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; max-width: 48rem;">
    <div class="flex max-[575px]:flex-col">
      <div v-for="image in firmwareUpdateStore.images" :key="image.slot" class="p-2 m-2 text-white bg-canvas-slate-700 grow">
        <h3><i class="fa-solid fa-microchip py-2 my-2"></i> Slot {{ image.slot + 1 }} 
          <button v-if="image.slot === 1 && !uploading && !image.empty"
            class="bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25 float-right"
            @click="firmwareUpdateStore.imageErase" :disabled="firmwareUpdateStore.states[5].busy">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </h3>
        <div v-if="firmwareUpdateStore.erasing || firmwareUpdateStore.reading">
          <i class="fa-solid fa-arrows-rotate fa-spin"></i>
        </div>
        <div v-else-if="!image.empty">
          <div class="whitespace-nowrap">Version: {{ image.version }}</div>
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
          <!-- <button 
            v-if="!image.pending && !image.empty"
            class="bg-canvas-slate-600 text-white p-2 mb-2 rounded cursor-pointer block w-full text-center disabled:opacity-25"
            @click="firmwareUpdateStore.imageTest">
            Set Pending
          </button> -->
          <label class="bg-canvas-slate-600 text-white p-2 rounded cursor-pointer block text-center" for="fileInput" @click="filePicker">
            <i class="fa-solid fa-file-code"></i> Select Update Image To Upload
          </label>
          <input type="file" id="fileInput" @change="firmwareUpdateStore.selectFile" class="hidden" accept=".bin">
        </div>
      </div>
    </div>
    <Transition name="fade" mode="out-in">
      <div v-if="firmwareUpdateStore.selectedFile" class="bg-canvas-slate-700 text-white p-2 m-2">
        <h3>
          <i class="fa-solid fa-microchip py-2 my-2"></i> 
          Selected File
          <button @click="deselectFile()" class="float-right text-canvas-slate-500 hover:text-white">
            <i class="fas fa-times"></i>
          </button>
        </h3>
        <div>Version: {{ firmwareUpdateStore.selectedFile.version }}</div>
        <div>File Name: {{ firmwareUpdateStore.selectedFile.name }}</div>
        <!-- <div>File Path: {{ selectedFile.path }}</div> -->
        <div>File Last Modified: {{ xbit.toDate(firmwareUpdateStore.selectedFile.lastModified) }}</div>
        <div>Image Size: {{ firmwareUpdateStore.selectedFile.imageSize }}</div>
      </div>
    </Transition>
    <div class="text-white m-2 p-2 bg-canvas-sky-700" v-if="firmwareUpdateStore.currentState.progressText && firmwareUpdateStore.currentState.busy">
      <i class="fa-solid fa-spinner fa-spin"></i>
      {{ firmwareUpdateStore.currentState.progressText }}
    </div>
    <div class="text-white m-2 p-2 bg-canvas-sky-700" v-else>
      {{ firmwareUpdateStore.currentState.infoText }}
    </div>
    <div class="text-white m-2 p-2 bg-canvas-pink-300" v-if="firmwareUpdateStore.errorText">
      {{ firmwareUpdateStore.errorText }}
    </div>

    <!-- <div class="text-white">
      {{ firmwareUpdateStore.currentState }}
    </div> -->
  </div>
  <div class="action-button btn-gradient-1">
    <button @click="stateAction()"
      class="bg-canvas-slate-800 text-white p-4 w-full h-full disabled:opacity-25 cursor-pointer"
      :disabled="firmwareUpdateStore.currentState.busy || !firmwareUpdateStore.currentState.ready"
      >
      {{ firmwareUpdateStore.currentState.actionText }}
    </button>
  </div>

</template>

<script>
import { defineComponent } from 'vue'
import { xbit } from '@bennybtl/xbit-lib'
import { useDevicesStore } from '@/stores/devices-store'
import { constants } from '@/assets/mcumgr'
import { useFirmwareUpdateStore } from '@/stores/firmware-update.store'

// create a variable to hold the firmware data
// we don't need to store this in the component data as it's huge
let selectedFileData = null

export default defineComponent({
  name: 'UpdateFirmwareView',
  setup () {
    const GUID_SMP = 'DA2E7828-FBCE-4E01-AE9E-261174997C48'
    return {
      xbit,
      firmwareUpdateStore: useFirmwareUpdateStore(),
      GUID_SMP,
      devicesStore: useDevicesStore()
    }
  },
  data () {
    return {
      images: [],
      selectedFile: false,
      pendingFile: false,

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
      timeRemaining: 0,
    }
  },
  async mounted () {
    if (!this.devicesStore.connected) {
      this.$router.replace({ name: 'scan' })
    }

    this.firmwareUpdateStore.mcumgr.onMessage(async ({ op, group, id, data, length }) => {
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
                this.firmwareUpdateStore.processReadStateResponse(data)
            }
          }  
      })

    this.jsonDataListener = (e) => {
      // Mobile app responds to file picker with this event
      if (e.method === "filePickerSelected") {
        // convert the base64 string to a byte array
        var binaryString = atob(e.params.imageData);
        var bytes = new Uint8Array(binaryString.length);
        for (var i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        const a = {
          target: {
            files: [
              {
                name: e.params.name,
                size: e.params.imageData.length,
                imageData: bytes,
                path: '',
                lastModified: Date.now()
              }
            ]
          }
        }
        this.firmwareUpdateStore.selectFile(a)
      }
    }
    xbit.addEventListener('bluetoothNotificationReceived', this.jsonDataListener)
    xbit.addEventListener('filePickerSelected', this.jsonDataListener)

    // watch for device to disconnect and go back to scan
    this.$watch('devicesStore.connected', async (val) => {
      if (!val) {
        // if resetting
        if (this.firmwareUpdateStore.resetting) return
        if (!this.firmwareUpdateStore.uploading) this.firmwareUpdateStore.deselectFile()

        // set notification error
        xbit.sendToast({
          type: 'error',
          message: 'Disconnected'
        })

        this.mfirmwareUpdateStore.mcumgr.reset()
        this.$router.push({ name: 'scan' })
      } else {
        // set notification success
        xbit.sendClearToast()
      }
    })

    // auto-advance the state machine
    this.$watch('firmwareUpdateStore.state', async (val) => {
      if (val === 0) {
        // advance to next state
        setTimeout(() => {
          this.stateAction()
        }, 100)
      } else if (val === 1) {
        setTimeout(() => {
          this.stateAction()
        }, 100)
      }
    })
    this.firmwareUpdateStore.setState(0)
  },
  async beforeRouteLeave () {
    xbit.removeEventListener('jsonData', this.jsonDataListener)

    if (this.firmwareUpdateStore.uploading) {
      xbit.sendToast({
        type: 'error',
        message: 'Uploading in progress, please wait.'
      })
      return false
    }

    // reset the state machine for next time
    this.firmwareUpdateStore.resetStateMachine()
  },
  methods: {
    async stateAction() {
      if (this.firmwareUpdateStore.state === 0) {
        try {
          // detect if smp capable device
          await this.firmwareUpdateStore.detectSmp()
          this.nextState()
        } catch (e) {
          console.log('error detecting  SMP', e)
        }
      } else if (this.firmwareUpdateStore.state === 1) {
        try {
          await this.firmwareUpdateStore.readImageState()
          // next state is set based on the image state
          // to 2, 3, 4 or 5
        } catch (e) {
          console.error('error reading image state', e)
        }

      } else if (this.firmwareUpdateStore.state === 2) {
        this.firmwareUpdateStore.imageUpload()
      } else if (this.firmwareUpdateStore.state === 3) {
        this.firmwareUpdateStore.imageTest()
      } else if (this.firmwareUpdateStore.state === 4) {
        try {
          this.reset()
        } catch (e) {
          console.error('error resetting', e)
          // naviage back to scan
          this.$router.replace({ name: 'scan' })
        }
      } else if (this.firmwareUpdateStore.state === 5) {
        this.firmwareUpdateStore.eraseImage()
      } else if (this.firmwareUpdateStore.state === 6) {
        this.firmwareUpdateStore.imageConfirm()
      } else if (this.firmwareUpdateStore.state === 7) {
        // done, disconnect
        this.$router.replace({ name: 'scan' })
      }
    },
    nextState() {
      this.firmwareUpdateStore.setState(this.firmwareUpdateStore.state + 1)
    },
    async reset () {
      if (this.firmwareUpdateStore.state !== 4) return
      xbit.sendToast({
        message: 'Resetting... Please wait.',
        options: { autoClose: false }
      })

      // this.resetting = true
      this.firmwareUpdateStore.currentState.busy = true
      // this.progressInfo = 'The device is resetting and swapping firmware images. It will attempt to boot the new image, and if not successful, will revert to the previous image. This may take up to 2 minutes.'
      // this.updateFirmwareAction = 'Resetting...'
      const deviceAddressWatching = this.devicesStore.connected

      await xbit.sendBleWriteCommand({
        data: this.firmwareUpdateStore.mcumgr.cmdReset(),
        uuid: this.firmwareUpdateStore.smpCharId,
        deviceAddress: this.devicesStore.connected
      })
      await this.devicesStore.startScanning(120 * 1000)

      return new Promise((resolve, reject) => {
        // watch devices for the device to come back
        const timeout = setTimeout(async () => {
          await this.devicesStore.stopScanning()
          this.firmwareUpdateStore.currentState.busy = false
          // TODO Reset timed out. What to do?
          reject()
        }, 120 * 1000)

        this.timeRemaining = 120
        const watchDevicesInterval = setInterval(async () => {
          this.timeRemaining--
          let reconnectDevice = null
          // selected becomes undefined when the device disconnects
          for (const device of this.devicesStore.devices) {
            if (device.address === deviceAddressWatching) {
              reconnectDevice = device
              this.devicesStore.selectDevice(device)
              break
            }
          }
          try {
            if (reconnectDevice) {
              clearInterval(watchDevicesInterval)
              clearTimeout(timeout)
              this.firmwareUpdateStore.currentState.busy = false
              await this.devicesStore.stopScanning()
              await this.devicesStore.connectDevice(reconnectDevice)
              this.firmwareUpdateStore.setState(0)
            }
          } catch (e) {
            console.error('error resetting', e)
          }
          resolve()
        }, 1000)
      })
    },
    filePicker() {
      xbit.sendFilePickerCommand({
        accept: '.bin'
      })
    },
    deselectFile() {
      this.firmwareUpdateStore.deselectFile()
      try {
        // reset the file input
        this.$refs.fileInput.value = ''
      } catch (e) {
        // console.log('error resetting file input', e)
      }
    }
  }
})
</script>
