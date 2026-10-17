const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ov',{size:o=>ipcRenderer.send('size',o),
  dragStart:()=>ipcRenderer.send('drag-start'),dragMove:()=>ipcRenderer.send('drag-move'),dragEnd:()=>ipcRenderer.send('drag-end'),
  onToggle:cb=>ipcRenderer.on('toggle',(_,f)=>cb(f))});
