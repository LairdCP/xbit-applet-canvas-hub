import{_ as h,d as u,o as n,c,a,b as o,F as r,r as S,n as d,u as f,x as i,e as l,t as v}from"./index-de117f55.js";const g=u({name:"ScanView",setup(){return{devicesStore:f(),xbit:i}},async beforeRouteLeave(){if(this.devicesStore.connecting)try{await this.devicesStore.disconnectDevice()}catch{}return await this.devicesStore.stopScanning()===null},async mounted(){this.devicesStore.clear();try{await this.devicesStore.disconnectDevice()}catch{}await this.devicesStore.startScanning()},methods:{async selectDevice(e){this.devicesStore.selectDevice(e)},async connectDevice(e){if(i.sendToast({message:"Connecting...",options:{autoClose:!1}}),this.devicesStore.connected)try{await this.devicesStore.disconnectDevice()}catch(t){console.error(t)}this.devicesStore.scanningTimeout&&await this.devicesStore.stopScanning(),this.$watch("devicesStore.connected",async t=>{t&&(i.sendClearToast(),this.$router.push({name:"home"}))});try{await this.devicesStore.connectDevice(e)}catch(t){console.error(t)}}}}),m={key:0,class:"pl-4 p-2 mb-2 text-white btn-gradient-1"},p=o("i",{class:"fa-solid fa-arrows-rotate"},null,-1),y={key:1,class:"pl-4 p-2 mb-2 text-white btn-gradient-1"},w={class:"flex flex-col",style:{flex:"1 1 auto","overflow-y":"auto","overflow-x":"hidden"}},b=["onClick"],D={key:0},C={key:1,class:"fas fa-check"},k={class:"action-button btn-gradient-1",style:{"justify-self":"flex-end"}},_=["disabled"];function $(e,t,B,T,V,x){return n(),c(r,null,[e.devicesStore.sortedDevices.length===0&&!e.devicesStore.scanningTimeout?(n(),c("h3",m,[a("Scan for BLE Devices "),p])):(n(),c("h3",y,"Select Device")),o("div",w,[(n(!0),c(r,null,S(e.devicesStore.sortedDevices,s=>(n(),c("div",{key:s.address,class:d(["bg-canvas-slate-500 ml-4 p-2 mb-2 rounded text-white text-center cursor-pointer hover:bg-canvas-slate-600 max-w-sm",{"bg-canvas-sky-500":s.address===e.devicesStore.connected,"bg-canvas-slate-600":s.address===e.devicesStore.selected,"opacity-25":!s.isCanvas}]),onClick:L=>e.selectDevice(s)},[s.isCanvas?(n(),c("span",D,"Canvas ")):l("",!0),a("Device "+v(e.xbit.formatAddress(s.address))+", "+v(s.rssi)+" dBm ",1),s.address===e.devicesStore.selected?(n(),c("i",C)):l("",!0)],10,b))),128))]),o("div",k,[o("button",{onClick:t[0]||(t[0]=s=>e.connectDevice(e.devicesStore.selected)),class:d(["bg-canvas-slate-800 p-4 w-full h-full",{"text-white cursor-pointer":e.devicesStore.selected&&!e.devicesStore.connecting,"text-gray-600 cursor-not-allowed":!e.devicesStore.selected||e.devicesStore.connecting}]),disabled:!e.devicesStore.selected||e.devicesStore.connecting}," Continue ",10,_)])],64)}const E=h(g,[["render",$]]);export{E as default};