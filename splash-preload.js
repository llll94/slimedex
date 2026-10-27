// tela de abertura: só recebe a fase (checando → iniciando → pronto → sai)
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('abertura',{onFase:cb=>ipcRenderer.on('fase',(_,f)=>cb(f))});
