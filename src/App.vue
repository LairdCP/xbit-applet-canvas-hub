<template>
  <!-- Main Header Componet -->
  <div id="main-wrapper" class="flex flex-col" style="height: 100%;">
    <div id="header" class="mb-2 p-4 bg-canvas-slate-800 text-white text-2xl">
      <button v-show="viewName() !== 'Canvas Hub'" @click="navigateBack" type="button" id="back-button" class="back-button gray-button mr-4">
        <i class="fa fa-angle-left"></i>
      </button>
      <span>{{ viewName() }}</span>
      <button v-if="$route.name === 'scan'" @click="devicesStore.startScanning()" type="button" id="refresh-button" class="mr-4 float-right">
        <i class="fa-solid fa-arrows-rotate" :class="{'fa-spin': devicesStore.scanningTimeout}"></i>
      </button>
    </div>
    <router-view v-slot="{ Component, route }">
      <component :is="Component"></component>
    </router-view>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { xbit } from '@bennybtl/xbit-lib'
import { useDevicesStore } from '@/stores/devices-store'
import { useFirmwareUpdateStore } from '@/stores/firmware-update.store'

export default defineComponent({
  name: 'AppMainView',
  setup () {
    return {
      devicesStore: useDevicesStore(),
      firmwareUpdateStore: useFirmwareUpdateStore()
    }
  },
  mounted () {
    xbit.addEventListener(async (data) => {
      // this applet doesn't care about these messages
      if (data.method === 'data' || data.method === 'rawData') {
        return
      }
      // if data is a scan result, add to scanResults
      // if (data.params?.data?.m === 'bleAd') {
      if (data.method === 'bluetoothDeviceDiscovered') {
        try {
          await this.devicesStore.processAd(data)
        } catch (e) {
          console.error('error processing ad', e)
        }
      }

      if (data.method === 'bluetoothNotificationReceived') {
        try {
          await this.firmwareUpdateStore.processNotification(data)
        } catch (e) {
          console.error('error processing notification', e)
        }
      }

      // inform the applet that it's being closed
      // so it can perform any state cleanup as neede
      if (data.method === 'closingApplet') {
        try {
          await this.devicesStore.disconnectDevice()
        } catch (e) {
          // console.error(e)
        }
        try {
          await this.devicesStore.stopScanning()
        } catch (e) {
          console.error('error stopping scanning', e)
        }
      }
    })
  },
  methods: {
    navigateBack () {
      // if in the process of connecting, don't allow back navigation
      if (this.devicesStore.connectingState) return

      if (this.$router.currentRoute.name === 'scan') {
        xbit.sendCommand({
          method: 'closeApplet'
        })
      } else {
        this.$router.back()
      }
    },
    viewName () {
      if (!this.$route.name || this.$route.name === 'scan') {
        return 'Canvas Hub'
      }
      // captialize first letter of this.$router.currentRoute.name and return
      return this.$route.name.charAt(0).toUpperCase() + this.$route.name.slice(1)
    }
  }
})

</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.main-wrapper {
  background: linear-gradient(to right, #1870ef, rgb(166, 0, 212));
}

.btn-gradient-1 {
  border-top: 6px;
  border-style: solid;
  border-image: linear-gradient(to right, #1870ef, rgb(166, 0, 212)) 1;
}


</style>
