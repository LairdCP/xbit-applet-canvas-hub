import{_ as h,d as u,o as n,c as o,a as i,b as a,F as r,r as p,n as d,u as f,x as c,e as l,t as v}from"./index-6fcff9af.js";const m=u({name:"HomeView",setup(){return{devicesStore:f()}},async beforeRouteLeave(){return await this.devicesStore.stopScanning()===null},async mounted(){this.devicesStore.clear(),await this.devicesStore.disconnectDevice();const e=await this.devicesStore.startScanning();console.log("scanning",e)},methods:{formatAddress(e){const s=e.match(/.{1,2}/g);return s.reverse(),s.pop(),s.join("")},async selectDevice(e){this.devicesStore.selectDevice(e)},async connectDevice(e){c.sendToast({message:"Connecting...",options:{autoClose:!1}}),this.devicesStore.connected&&await this.devicesStore.disconnectDevice(),this.devicesStore.scanningTimeout&&await this.devicesStore.stopScanning(),this.$watch("devicesStore.connected",async s=>{s&&(c.sendClearToast(),this.$router.push({name:"update"}))});try{await this.devicesStore.connectDevice(e)}catch(s){console.log(s),c.sendToast({type:"error",message:"Unable to connect"})}}}}),S={key:0,class:"pl-4 p-2 mb-2 text-white btn-gradient-1"},g=a("i",{class:"fa-solid fa-arrows-rotate"},null,-1),y={key:1,class:"pl-4 p-2 mb-2 text-white btn-gradient-1"},b={class:"flex flex-col",style:{flex:"1 1 auto",height:"100%","overflow-y":"auto","overflow-x":"hidden"}},w=["onClick"],D={key:0},C={key:1,class:"fas fa-check"},k={class:"action-button btn-gradient-1",style:{"justify-self":"flex-end"}},_=["disabled"];function $(e,s,T,x,B,V){return n(),o(r,null,[e.devicesStore.sortedDevices.length===0&&!e.devicesStore.scanningTimeout?(n(),o("h3",S,[i("Scan for BLE Devices "),g])):(n(),o("h3",y,"Select Device")),a("div",b,[(n(!0),o(r,null,p(e.devicesStore.sortedDevices,t=>(n(),o("div",{key:t.address,class:d(["bg-canvas-slate-500 ml-4 p-2 mb-2 rounded text-white text-center cursor-pointer hover:bg-canvas-slate-600 max-w-sm",{"bg-canvas-sky-500":t.address===e.devicesStore.connected,"bg-canvas-slate-600":t.address===e.devicesStore.selected,"opacity-25":!t.isCanvas}]),onClick:L=>e.selectDevice(t)},[t.isCanvas?(n(),o("span",D,"Canvas ")):l("",!0),i("Device "+v(e.formatAddress(t.address))+", "+v(t.rssi)+" dBm ",1),t.address===e.devicesStore.selected?(n(),o("i",C)):l("",!0)],10,w))),128))]),a("div",k,[a("button",{onClick:s[0]||(s[0]=t=>e.connectDevice(e.devicesStore.selected)),class:d(["bg-canvas-slate-800 p-4 w-full h-full",{"text-white cursor-pointer":e.devicesStore.selected,"text-gray-600 cursor-not-allowed":!e.devicesStore.selected}]),disabled:!e.devicesStore.selected}," Continue ",10,_)])],64)}const j=h(m,[["render",$]]);export{j as default};