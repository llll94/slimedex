// ponte da cartilha (guia.html): só os botões da barra de título própria (a janela não tem a moldura do sistema)
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('janela', {
  min: () => ipcRenderer.send('guia-janela', 'min'),
  max: () => ipcRenderer.send('guia-janela', 'max'),
  fechar: () => ipcRenderer.send('guia-janela', 'fechar'),
  onMax: cb => ipcRenderer.on('guia-max', (_, m) => cb(m)) // maximizada ou não: troca o ícone do botão
});
