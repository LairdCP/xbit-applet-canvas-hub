import{_ as g,d as b,o as r,c as o,b as t,t as i,w as U,v,n as c,a as n,F as h,r as y,f as k,g as T,T as I,e as u,x as d,h as C,u as D,i as f}from"./index-e5322cfd.js";const F=b({name:"HomeView",setup(){const e="DA2E7828-FBCE-4E01-AE9E-261174997C48";return{xbit:d,firmwareUpdateStore:C(),GUID_SMP:e,devicesStore:D()}},data(){return{images:[],selectedFile:!1,pendingFile:!1,showAdvanced:!1,jsonDataListener:null,progressInfo:"",updateFirmwareAction:"Update Firmware",settingUpSmp:!1,readingImageState:!1,testingImageState:!1,confirmingImageState:!1,erasingImage:!1,resetting:!1,uploading:!1,testButtonDisabled:!0,confirmButtonDisabled:!0,eraseButtonDisabled:!1}},async mounted(){this.devicesStore.connected||this.$router.push({name:"home"}),this.firmwareUpdateStore.mcumgr.onMessage(async({op:e,group:a,id:m,data:l,length:p})=>{switch(a){case f.MGMT_GROUP_ID_OS:switch(m){case f.OS_MGMT_ID_ECHO:alert(l.r);break;case f.OS_MGMT_ID_TASKSTAT:console.table(l.tasks);break;case f.OS_MGMT_ID_MPSTAT:console.log(l);break}break;case f.MGMT_GROUP_ID_IMAGE:switch(m){case f.IMG_MGMT_ID_STATE:this.firmwareUpdateStore.processReadStateResponse(l)}}}),this.jsonDataListener=e=>{if(e.method==="filePickerSelected"){const a={target:{files:[{name:a.params.name,size:a.params.imageData.length,path:"",lastModified:Date.now()}]}};this.selectFile(a)}},d.addEventListener("bluetoothNotificationReceived",this.jsonDataListener),d.addEventListener("filePickerSelected",this.jsonDataListener),this.$watch("devicesStore.connected",async e=>{if(e)d.sendClearToast();else{if(this.firmwareUpdateStore.resetting)return;this.firmwareUpdateStore.uploading||this.firmwareUpdateStore.deselectFile(),d.sendToast({type:"error",message:"Disconnected"}),this.persistConnection?await this.devicesStore.connectDevice(this.devicesStore.selected):this.$router.push({name:"home"})}}),this.$watch("firmwareUpdateStore.state",async e=>{this.showAdvanced||(e===0?setTimeout(()=>{this.stateAction()},1e3):e===1&&setTimeout(()=>{this.stateAction()},1e3))}),this.firmwareUpdateStore.setState(0)},async beforeRouteLeave(){if(d.removeEventListener("jsonData",this.jsonDataListener),this.firmwareUpdateStore.uploading)return d.sendToast({type:"error",message:"Uploading in progress, please wait."}),!1;this.devicesStore.connected&&await this.devicesStore.disconnectDevice(),this.firmwareUpdateStore.resetStateMachine()},methods:{async stateAction(){if(this.firmwareUpdateStore.state===0)try{await this.firmwareUpdateStore.detectSmp(),this.nextState()}catch(e){console.log("error detecting  SMP",e)}else if(this.firmwareUpdateStore.state===1)try{await this.firmwareUpdateStore.readImageState()}catch(e){console.log("error reading image state",e)}else this.firmwareUpdateStore.state===2?this.firmwareUpdateStore.imageUpload():this.firmwareUpdateStore.state===3?this.firmwareUpdateStore.imageTest():this.firmwareUpdateStore.state===4?this.reset():this.firmwareUpdateStore.state===5?this.firmwareUpdateStore.eraseImage():this.firmwareUpdateStore.state===6?this.firmwareUpdateStore.imageConfirm():this.firmwareUpdateStore.state},nextState(){this.firmwareUpdateStore.setState(this.firmwareUpdateStore.state+1)},async reset(){if(this.firmwareUpdateStore.state===4)return d.sendToast({message:"Resetting... Please wait.",options:{autoClose:!1}}),this.firmwareUpdateStore.currentState.busy=!0,await d.sendBleWriteCommand({data:this.firmwareUpdateStore.mcumgr.cmdReset(),uuid:this.firmwareUpdateStore.smpCharId,deviceId:this.devicesStore.connected}),await this.devicesStore.startScanning(120*1e3),new Promise((e,a)=>{const m=setTimeout(async()=>{await this.devicesStore.stopScanning(device),this.firmwareUpdateStore.currentState.busy=!1,a()},12e4),l=setInterval(async()=>{for(const p of this.devicesStore.devices)if(p.address===this.devicesStore.selected){clearInterval(l),clearTimeout(m),this.firmwareUpdateStore.currentState.busy=!1;try{await this.devicesStore.stopScanning(p),await this.devicesStore.connectDevice(p),this.firmwareUpdateStore.setState(0)}catch(w){console.log("error resetting",w)}e();break}},1e3)})},filePicker(){d.sendFilePickerCommand({accept:".bin"})},deselectFile(){this.firmwareUpdateStore.deselectFile();try{this.$refs.fileInput.value=""}catch{}}}}),M={class:"pl-4 p-2 mb-2 text-white btn-gradient-1"},E={class:"p-2"},A={class:"grow max-w-md pl-4"},P={class:"m-2"},B=["disabled"],G=["disabled"],L=["disabled"],_=["disabled"],$=["disabled"],R=["disabled"],O={class:"flex flex-row w-full"},V=t("i",{class:"fa-solid fa-microchip py-2 my-2"},null,-1),j=["disabled"],N=t("i",{class:"fa-solid fa-trash-can"},null,-1),z=[N],H={key:0},K=t("i",{class:"fa-solid fa-arrows-rotate fa-spin"},null,-1),W=[K],q={key:1},J={class:"whitespace-nowrap"},Q={key:2,class:"mt-2"},X=t("i",{class:"fa-solid fa-file-code"},null,-1),Y={key:0,class:"bg-canvas-slate-700 text-white p-2 m-2"},Z=t("i",{class:"fa-solid fa-microchip py-2 my-2"},null,-1),x=t("i",{class:"fas fa-times"},null,-1),ee=[x],te={key:0,class:"text-white m-2 p-2 bg-canvas-sky-700"},ae=t("i",{class:"fa-solid fa-spinner fa-spin"},null,-1),se={key:1,class:"text-white m-2 p-2 bg-canvas-sky-700"},ie={key:2,class:"text-white m-2 p-2 bg-canvas-pink-300"},re={class:"action-button btn-gradient-1"},oe=["disabled"];function ne(e,a,m,l,p,w){return r(),o(h,null,[t("h3",M,[t("span",E," Connected to "+i(e.devicesStore.connected||"?"),1)]),t("div",A,[U(t("div",P,[t("button",{class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25",disabled:e.firmwareUpdateStore.states[0].busy||!e.firmwareUpdateStore.states[0].ready,onClick:a[0]||(a[0]=(...s)=>e.firmwareUpdateStore.setupSmp&&e.firmwareUpdateStore.setupSmp(...s))},[t("i",{class:c(["fa-solid fa-arrows-rotate",{"fa-spin":e.firmwareUpdateStore.states[0].busy}])},null,2),n(" "+i(e.firmwareUpdateStore.states[0].actionText),1)],8,B),t("button",{class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25",disabled:e.firmwareUpdateStore.states[1].busy||!e.firmwareUpdateStore.states[1].ready,onClick:a[1]||(a[1]=(...s)=>e.firmwareUpdateStore.readImageState&&e.firmwareUpdateStore.readImageState(...s))},[t("i",{class:c(["fa-solid fa-arrows-rotate",{"fa-spin":e.firmwareUpdateStore.states[1].busy}])},null,2),n(" "+i(e.firmwareUpdateStore.states[1].actionText),1)],8,G),t("button",{class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25",disabled:e.firmwareUpdateStore.states[3].busy||!e.firmwareUpdateStore.states[3].ready,onClick:a[2]||(a[2]=(...s)=>e.firmwareUpdateStore.imageTest&&e.firmwareUpdateStore.imageTest(...s))},[t("i",{class:c(["fa-solid fa-arrows-rotate",{"fa-spin":e.firmwareUpdateStore.states[3].busy}])},null,2),n(" "+i(e.firmwareUpdateStore.states[3].actionText),1)],8,L),t("button",{class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25",onClick:a[3]||(a[3]=(...s)=>e.imageConfirm&&e.imageConfirm(...s)),disabled:e.confirmButtonDisabled||e.confirmingImageState}," Image Confirm ",8,_),t("button",{class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25",onClick:a[4]||(a[4]=(...s)=>e.imageErase&&e.imageErase(...s)),disabled:e.eraseButtonDisabled||e.erasingImage}," Image Erase ",8,$),t("button",{class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25",onClick:a[5]||(a[5]=(...s)=>e.reset&&e.reset(...s)),disabled:e.resetting},[t("i",{class:c(["fa-solid fa-arrows-rotate",{"fa-spin":e.resetting}])},null,2),n(" Reset ")],8,R)],512),[[v,e.showAdvanced]]),t("div",O,[(r(!0),o(h,null,y(e.firmwareUpdateStore.images,s=>(r(),o("div",{key:s.slot,class:"p-2 m-2 text-white bg-canvas-slate-700 grow"},[t("h3",null,[V,n(" Slot "+i(s.slot+1)+" ",1),s.slot===1&&!e.uploading&&!s.empty?(r(),o("button",{key:0,class:"bg-canvas-slate-600 text-white p-2 m-2 rounded disabled:opacity-25 float-right",onClick:a[6]||(a[6]=(...S)=>e.firmwareUpdateStore.imageErase&&e.firmwareUpdateStore.imageErase(...S)),disabled:e.firmwareUpdateStore.states[5].busy},z,8,j)):u("",!0)]),e.firmwareUpdateStore.erasing||e.firmwareUpdateStore.reading?(r(),o("div",H,W)):s.empty?u("",!0):(r(),o("div",q,[t("div",J,"Version: "+i(s.version),1),t("div",null,[n("Pending "),t("i",{class:c({"fa-solid fa-circle-check":s.pending,"fa-regular fa-circle":!s.pending})},null,2)]),t("div",null,[n("Confirmed "),t("i",{class:c({"fa-solid fa-circle-check":s.confirmed,"fa-regular fa-circle":!s.confirmed})},null,2)]),t("div",null,[n("Bootable "),t("i",{class:c({"fa-solid fa-circle-check":s.bootable,"fa-regular fa-circle":!s.bootable})},null,2)])])),s.slot===1?(r(),o("div",Q,[t("label",{class:"bg-canvas-slate-600 text-white p-2 rounded cursor-pointer block text-center",for:"fileInput",onClick:a[7]||(a[7]=(...S)=>e.filePicker&&e.filePicker(...S))},[X,n(" Update Image")]),t("input",{type:"file",id:"fileInput",onChange:a[8]||(a[8]=(...S)=>e.firmwareUpdateStore.selectFile&&e.firmwareUpdateStore.selectFile(...S)),class:"hidden",accept:".bin"},null,32)])):u("",!0)]))),128))]),k(I,{name:"fade",mode:"out-in"},{default:T(()=>[e.firmwareUpdateStore.selectedFile?(r(),o("div",Y,[t("h3",null,[Z,n(" Selected File "),t("button",{onClick:a[9]||(a[9]=s=>e.deselectFile()),class:"float-right text-canvas-slate-500 hover:text-white"},ee)]),t("div",null,"Version: "+i(e.firmwareUpdateStore.selectedFile.version),1),t("div",null,"File Name: "+i(e.firmwareUpdateStore.selectedFile.name),1),t("div",null,"File Last Modified: "+i(e.xbit.toDate(e.firmwareUpdateStore.selectedFile.lastModified)),1),t("div",null,"Image Size: "+i(e.firmwareUpdateStore.selectedFile.imageSize),1)])):u("",!0)]),_:1}),e.firmwareUpdateStore.currentState.progressText&&e.firmwareUpdateStore.currentState.busy?(r(),o("div",te,[ae,n(" "+i(e.firmwareUpdateStore.currentState.progressText),1)])):(r(),o("div",se,i(e.firmwareUpdateStore.currentState.infoText),1)),e.firmwareUpdateStore.errorText?(r(),o("div",ie,i(e.firmwareUpdateStore.currentState.errorText),1)):u("",!0)]),t("div",re,[t("button",{onClick:a[10]||(a[10]=s=>e.stateAction()),class:"bg-canvas-slate-800 text-white p-4 w-full h-full disabled:opacity-25 cursor-pointer",disabled:e.firmwareUpdateStore.currentState.busy||!e.firmwareUpdateStore.currentState.ready},i(e.firmwareUpdateStore.currentState.actionText),9,oe)])],64)}const le=g(F,[["render",ne]]);export{le as default};
