<template>
    <h3 class="pl-4 p-2 mb-2 text-white btn-gradient-1">
    <span class="p-2">
      Connected to {{ xbit.formatAddress(devicesStore.connected) }}
    </span>
    <!-- <button class="float-right p-2 rounded" @click="showAdvanced = !showAdvanced">
      <i class="fa-solid fa-glasses"></i>
    </button> -->
  </h3>
  <div class="flex flex-col" style="flex: 1 1 auto; height: 100%; overflow-y: auto; overflow-x: hidden;">
    <button @click="$router.push({ name: 'update' })"
      class="bg-canvas-slate-500 ml-4 p-2 mb-2 rounded text-white text-center hover:bg-canvas-slate-600 max-w-sm"
    ><i class="fa-solid fa-microchip py-2 my-2"></i> Firmware Update</button>
    <button @click="$router.push({ name: 'upload' })"
      class="bg-canvas-slate-500 ml-4 p-2 mb-2 rounded text-white text-center hover:bg-canvas-slate-600 max-w-sm"
    ><i class="fa-solid fa-file-code"></i> Upload File</button>
  </div>
  <div class="action-button btn-gradient-1" style="justify-self: flex-end;">
    <button @click="disconnectDevice(devicesStore.selected)"
      class="bg-canvas-slate-800 p-4 w-full h-full"
      :class="{
        'text-white cursor-pointer': devicesStore.selected,
        'text-gray-600 cursor-not-allowed': !devicesStore.selected
      }"
      :disabled="!devicesStore.selected">
      Disconnect
    </button>
  </div>
</template>
<script>
import { defineComponent } from 'vue'
import { xbit } from '@bennybtl/xbit-lib'
import { useDevicesStore } from '@/stores/devices-store'

export default defineComponent({
  name: 'HomeView',
  setup () {
    return {
      devicesStore: useDevicesStore(),
      xbit
    }
  },
  async beforeRouteLeave (to) {
    if (this.devicesStore.connected && to.name === 'scan') {
      // disconnect from the device
      await this.devicesStore.disconnectDevice()
    }
  },
  methods: {
    async disconnectDevice () {
      xbit.sendToast({
        message: 'Disconnecting...',
        options: { autoClose: false }
      })

      if (this.devicesStore.connected) {
      }

      this.$watch('devicesStore.disconnected', async (connected) => {
        if (connected) {
          xbit.sendClearToast()
          this.$router.push({ name: 'scan' })
        }
      })

      try {
        await this.devicesStore.disconnectDevice()
      } catch (e) {
        console.error(e)
        xbit.sendToast({
          type: 'error',
          message: 'Unable to disconnect'
        })
      }
    }
  }
})
</script>