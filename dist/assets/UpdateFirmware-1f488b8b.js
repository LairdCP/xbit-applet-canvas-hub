import{_ as g,d as U,o as i,c as r,b as t,t as o,F as w,r as v,f as b,w as y,T as _,a as d,e as p,x as n,i as k,u as T,j as c,n as u}from"./index-de117f55.js";const D=U({name:"UpdateFirmwareView",setup(){const e="DA2E7828-FBCE-4E01-AE9E-261174997C48";return{xbit:n,firmwareUpdateStore:k(),GUID_SMP:e,devicesStore:T()}},data(){return{images:[],selectedFile:!1,pendingFile:!1,jsonDataListener:null,progressInfo:"",updateFirmwareAction:"Update Firmware",settingUpSmp:!1,readingImageState:!1,testingImageState:!1,confirmingImageState:!1,erasingImage:!1,resetting:!1,uploading:!1,testButtonDisabled:!0,confirmButtonDisabled:!0,eraseButtonDisabled:!1,timeRemaining:0}},async mounted(){this.devicesStore.connected||this.$router.replace({name:"scan"}),this.firmwareUpdateStore.mcumgr.onMessage(async({op:e,group:a,id:f,data:l,length:S})=>{switch(a){case c.MGMT_GROUP_ID_OS:switch(f){case c.OS_MGMT_ID_ECHO:alert(l.r);break;case c.OS_MGMT_ID_TASKSTAT:console.table(l.tasks);break;case c.OS_MGMT_ID_MPSTAT:console.log(l);break}break;case c.MGMT_GROUP_ID_IMAGE:switch(f){case c.IMG_MGMT_ID_STATE:this.firmwareUpdateStore.processReadStateResponse(l)}}}),this.jsonDataListener=e=>{if(e.method==="filePickerSelected"){const a={target:{files:[{name:a.params.name,size:a.params.imageData.length,path:"",lastModified:Date.now()}]}};this.selectFile(a)}},n.addEventListener("bluetoothNotificationReceived",this.jsonDataListener),n.addEventListener("filePickerSelected",this.jsonDataListener),this.$watch("devicesStore.connected",async e=>{if(e)n.sendClearToast();else{if(this.firmwareUpdateStore.resetting)return;this.firmwareUpdateStore.uploading||this.firmwareUpdateStore.deselectFile(),n.sendToast({type:"error",message:"Disconnected"}),this.mfirmwareUpdateStore.mcumgr.reset(),this.$router.push({name:"scan"})}}),this.$watch("firmwareUpdateStore.state",async e=>{e===0?setTimeout(()=>{this.stateAction()},100):e===1&&setTimeout(()=>{this.stateAction()},100)}),this.firmwareUpdateStore.setState(0)},async beforeRouteLeave(){if(n.removeEventListener("jsonData",this.jsonDataListener),this.firmwareUpdateStore.uploading)return n.sendToast({type:"error",message:"Uploading in progress, please wait."}),!1;this.firmwareUpdateStore.resetStateMachine()},methods:{async stateAction(){if(this.firmwareUpdateStore.state===0)try{await this.firmwareUpdateStore.detectSmp(),this.nextState()}catch(e){console.log("error detecting  SMP",e)}else if(this.firmwareUpdateStore.state===1)try{await this.firmwareUpdateStore.readImageState()}catch(e){console.error("error reading image state",e)}else if(this.firmwareUpdateStore.state===2)this.firmwareUpdateStore.imageUpload();else if(this.firmwareUpdateStore.state===3)this.firmwareUpdateStore.imageTest();else if(this.firmwareUpdateStore.state===4)try{this.reset()}catch(e){console.error("error resetting",e),this.$router.replace({name:"scan"})}else this.firmwareUpdateStore.state===5?this.firmwareUpdateStore.eraseImage():this.firmwareUpdateStore.state===6?this.firmwareUpdateStore.imageConfirm():this.firmwareUpdateStore.state===7&&this.$router.replace({name:"scan"})},nextState(){this.firmwareUpdateStore.setState(this.firmwareUpdateStore.state+1)},async reset(){if(this.firmwareUpdateStore.state!==4)return;n.sendToast({message:"Resetting... Please wait.",options:{autoClose:!1}}),this.firmwareUpdateStore.currentState.busy=!0;const e=this.devicesStore.connected;return await n.sendBleWriteCommand({data:this.firmwareUpdateStore.mcumgr.cmdReset(),uuid:this.firmwareUpdateStore.smpCharId,deviceAddress:this.devicesStore.connected}),await this.devicesStore.startScanning(120*1e3),new Promise((a,f)=>{const l=setTimeout(async()=>{await this.devicesStore.stopScanning(),this.firmwareUpdateStore.currentState.busy=!1,f()},12e4);this.timeRemaining=120;const S=setInterval(async()=>{this.timeRemaining--;let h=null;for(const s of this.devicesStore.devices)if(s.address===e){h=s,this.devicesStore.selectDevice(s);break}try{h&&(clearInterval(S),clearTimeout(l),this.firmwareUpdateStore.currentState.busy=!1,await this.devicesStore.stopScanning(),await this.devicesStore.connectDevice(h),this.firmwareUpdateStore.setState(0))}catch(s){console.error("error resetting",s)}a()},1e3)})},filePicker(){n.sendFilePickerCommand({accept:".bin"})},deselectFile(){this.firmwareUpdateStore.deselectFile();try{this.$refs.fileInput.value=""}catch{}}}}),F={class:"pl-4 p-2 mb-2 text-white btn-gradient-1"},I={class:"p-2"},M={key:0},C={key:1},A={class:"flex flex-col",style:{flex:"1 1 auto","overflow-y":"auto","overflow-x":"hidden","max-width":"48rem"}},E={class:"flex max-[575px]:flex-col"},P=t("i",{class:"fa-solid fa-microchip py-2 my-2"},null,-1),$=["disabled"],R=t("i",{class:"fa-solid fa-trash-can"},null,-1),G=[R],L={key:0},B=t("i",{class:"fa-solid fa-arrows-rotate fa-spin"},null,-1),j=[B],x={key:1},O={class:"whitespace-nowrap"},V={key:2,class:"mt-2"},N=t("i",{class:"fa-solid fa-file-code"},null,-1),z={key:0,class:"bg-canvas-slate-700 text-white p-2 m-2"},W=t("i",{class:"fa-solid fa-microchip py-2 my-2"},null,-1),H=t("i",{class:"fas fa-times"},null,-1),K=[H],q={key:0,class:"text-white m-2 p-2 bg-canvas-sky-700"},J=t("i",{class:"fa-solid fa-spinner fa-spin"},null,-1),Q={key:1,class:"text-white m-2 p-2 bg-canvas-sky-700"},X={key:2,class:"text-white m-2 p-2 bg-canvas-pink-300"},Y={class:"action-button btn-gradient-1"},Z=["disabled"];function ee(e,a,f,l,S,h){return i(),r(w,null,[t("h3",F,[t("span",I,[e.devicesStore.connected?(i(),r("span",M,"Connected to "+o(e.xbit.formatAddress(e.devicesStore.connected)),1)):(i(),r("span",C,"Scanning For Device "+o(this.timeRemaining),1))])]),t("div",A,[t("div",E,[(i(!0),r(w,null,v(e.firmwareUpdateStore.images,s=>(i(),r("div",{key:s.slot,class:"p-2 m-2 text-white bg-canvas-slate-700 grow"},[t("h3",null,[P,d(" Slot "+o(s.slot+1)+" ",1),s.slot===1&&!e.uploading&&!s.empty?(i(),r("button",{key:0,class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25 float-right",onClick:a[0]||(a[0]=(...m)=>e.firmwareUpdateStore.imageErase&&e.firmwareUpdateStore.imageErase(...m)),disabled:e.firmwareUpdateStore.states[5].busy},G,8,$)):p("",!0)]),e.firmwareUpdateStore.erasing||e.firmwareUpdateStore.reading?(i(),r("div",L,j)):s.empty?p("",!0):(i(),r("div",x,[t("div",O,"Version: "+o(s.version),1),t("div",null,[d("Pending "),t("i",{class:u({"fa-solid fa-circle-check":s.pending,"fa-regular fa-circle":!s.pending})},null,2)]),t("div",null,[d("Confirmed "),t("i",{class:u({"fa-solid fa-circle-check":s.confirmed,"fa-regular fa-circle":!s.confirmed})},null,2)]),t("div",null,[d("Bootable "),t("i",{class:u({"fa-solid fa-circle-check":s.bootable,"fa-regular fa-circle":!s.bootable})},null,2)])])),s.slot===1?(i(),r("div",V,[t("label",{class:"bg-canvas-slate-600 text-white p-2 rounded cursor-pointer block text-center",for:"fileInput",onClick:a[1]||(a[1]=(...m)=>e.filePicker&&e.filePicker(...m))},[N,d(" Select Update Image To Upload ")]),t("input",{type:"file",id:"fileInput",onChange:a[2]||(a[2]=(...m)=>e.firmwareUpdateStore.selectFile&&e.firmwareUpdateStore.selectFile(...m)),class:"hidden",accept:".bin"},null,32)])):p("",!0)]))),128))]),b(_,{name:"fade",mode:"out-in"},{default:y(()=>[e.firmwareUpdateStore.selectedFile?(i(),r("div",z,[t("h3",null,[W,d(" Selected File "),t("button",{onClick:a[3]||(a[3]=s=>e.deselectFile()),class:"float-right text-canvas-slate-500 hover:text-white"},K)]),t("div",null,"Version: "+o(e.firmwareUpdateStore.selectedFile.version),1),t("div",null,"File Name: "+o(e.firmwareUpdateStore.selectedFile.name),1),t("div",null,"File Last Modified: "+o(e.xbit.toDate(e.firmwareUpdateStore.selectedFile.lastModified)),1),t("div",null,"Image Size: "+o(e.firmwareUpdateStore.selectedFile.imageSize),1)])):p("",!0)]),_:1}),e.firmwareUpdateStore.currentState.progressText&&e.firmwareUpdateStore.currentState.busy?(i(),r("div",q,[J,d(" "+o(e.firmwareUpdateStore.currentState.progressText),1)])):(i(),r("div",Q,o(e.firmwareUpdateStore.currentState.infoText),1)),e.firmwareUpdateStore.errorText?(i(),r("div",X,o(e.firmwareUpdateStore.errorText),1)):p("",!0)]),t("div",Y,[t("button",{onClick:a[4]||(a[4]=s=>e.stateAction()),class:"bg-canvas-slate-800 text-white p-4 w-full h-full disabled:opacity-25 cursor-pointer",disabled:e.firmwareUpdateStore.currentState.busy||!e.firmwareUpdateStore.currentState.ready},o(e.firmwareUpdateStore.currentState.actionText),9,Z)])],64)}const se=g(D,[["render",ee]]);export{se as default};