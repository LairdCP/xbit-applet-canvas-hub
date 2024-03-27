<template>
  <h3 class="pl-4 p-2 mb-2 text-white btn-gradient-1" v-if="devicesStore.sortedDevices.length === 0 && !devicesStore.scanningTimeout">Scan for BLE Devices  <i class="fa-solid fa-arrows-rotate"></i></h3>
  <h3 class="pl-4 p-2 mb-2 text-white btn-gradient-1" v-else>Select Device</h3>
  <div class="flex flex-col" style="flex: 1 1 auto; overflow-y: auto; overflow-x: hidden;">
    <div v-for="i in devicesStore.sortedDevices" :key="i.address"
      class="bg-canvas-slate-500 ml-4 p-2 mb-2 rounded text-white text-center cursor-pointer hover:bg-canvas-slate-600 max-w-sm"
      :class="{
        'bg-canvas-sky-500': i.address === devicesStore.connected,
        'bg-canvas-slate-600': i.address === devicesStore.selected,
        'opacity-25': !i.isCanvas
      }"
      @click="selectDevice(i)">
      <span v-if="i.isCanvas">Canvas </span>Device {{ xbit.formatAddress(i.address) }}, {{ i.rssi }} dBm
      <i v-if="i.address === devicesStore.selected" class="fas fa-check"></i>
    </div>
  </div>
  <div class="action-button btn-gradient-1" style="justify-self: flex-end;">
    <button @click="connectDevice(devicesStore.selected)"
      class="bg-canvas-slate-800 p-4 w-full h-full"
      :class="{
        'text-white cursor-pointer': devicesStore.selected && !devicesStore.connecting,
        'text-gray-600 cursor-not-allowed': !devicesStore.selected || devicesStore.connecting
      }"
      :disabled="!devicesStore.selected || devicesStore.connecting">
      Continue
    </button>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { xbit } from '@bennybtl/xbit-lib'
import { useDevicesStore } from '@/stores/devices-store'

export default defineComponent({
  name: 'ScanView',
  setup () {
    return {
      devicesStore: useDevicesStore(),
      xbit
    }
  },
  async beforeRouteLeave () {
    // disconnect from the device
    if (this.devicesStore.connecting) {
      try {
        await this.devicesStore.disconnectDevice()
      } catch (e) {
        // console.error(e)
      }
    }
    const scanning = await this.devicesStore.stopScanning()
    return scanning === null
  },
  async mounted () {
    this.devicesStore.clear()
    try {
      await this.devicesStore.disconnectDevice()
    } catch (e) {
      // console.error(e)
    }

    // send a ctrl+d
    // reconnect to the dongle

    // start scanning
    const scanning = await this.devicesStore.startScanning()
    // if (!scanning) {
    //   // on failure...
    // }
  },
  methods: {
    async selectDevice (device) {
      this.devicesStore.selectDevice(device)
    },
    async connectDevice (device) {
      xbit.sendToast({
        message: 'Connecting...',
        options: { autoClose: false }
      })

      if (this.devicesStore.connected) {
        try {
          await this.devicesStore.disconnectDevice()
        } catch (e) {
          // on failure to disconnect, do ...
          console.error(e)
          this.devicesStore.selected = null
          xbit.sendToast({
            message: error?.message || error || 'Unable to disconnect',
            type: 'error'
          })
        }
      }

      if (this.devicesStore.scanningTimeout) {
        await this.devicesStore.stopScanning()
        // on failure to stop scanning, do ...
      }

      this.$watch('devicesStore.connected', async (connected) => {
        if (connected) {
          xbit.sendClearToast()
          this.$router.push({ name: 'home' })
        }
      })

      try {
        await this.devicesStore.connectDevice(device)
      } catch (e) {
        this.devicesStore.selected = null
        xbit.sendToast({
          message: e?.message || e || 'Unable to connect',
          type: 'error'
        })
        console.error(e)
      }
    },
  }
})
</script>
