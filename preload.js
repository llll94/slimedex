const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ov',{size:o=>ipcRenderer.send('size',o),
  dragStart:()=>ipcRenderer.send('drag-start'),dragMove:()=>ipcRenderer.send('drag-move'),dragEnd:()=>ipcRenderer.send('drag-end'),
  onToggle:cb=>ipcRenderer.on('toggle',(_,f)=>cb(f)),onFechar:cb=>ipcRenderer.on('fechar',()=>cb()),onVoltar:cb=>ipcRenderer.on('voltar',()=>cb()),
  meus:{ler:()=>ipcRenderer.invoke('meus-ler'),salvar:d=>ipcRenderer.invoke('meus-salvar',d),
    exportar:d=>ipcRenderer.invoke('meus-exportar',d),exportarCsv:t=>ipcRenderer.invoke('meus-exportar-csv',t),
    importar:()=>ipcRenderer.invoke('meus-importar'),enviar:p=>ipcRenderer.invoke('enviar',p)},
  comunidade:()=>ipcRenderer.invoke('comunidade'),idioma:l=>ipcRenderer.send('idioma',l),versao:()=>ipcRenderer.invoke('versao'),
  pasta:()=>ipcRenderer.invoke('pasta'),plataforma:process.platform,reiniciar:()=>ipcRenderer.send('reiniciar'),
  versaoNova:()=>ipcRenderer.invoke('versao-nova'),baixarAtualizacao:n=>ipcRenderer.invoke('baixar-atualizacao',n),instalarAtualizacao:()=>ipcRenderer.send('instalar-atualizacao'),
  foiAtualizado:()=>ipcRenderer.invoke('foi-atualizado'),novidades:()=>ipcRenderer.invoke('novidades'),onProgresso:cb=>ipcRenderer.on('progresso',(_,p)=>cb(p))});
