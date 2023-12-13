import { defineStore } from 'pinia'
import { MCUManager } from '@/assets/mcumgr'

export const useMcuMgrStore = defineStore({
  id: 'mcumgrStore',
  state: () => {
    return {
      mcumgr: new MCUManager(),
      GUID_SMP: 'da2e7828-fbce-4e01-ae9e-261174997c48'
    }
  },
  actions: {
    processSmp (data) {
      mcumgr._notification(data.params.data)
    },
  }
})

