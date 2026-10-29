// ponte das janelas do baú (leitor escondido e o balão de fala/menu do Slimedex): só o que elas precisam
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bau', {
  // leitura: o main pede, o leitor escondido fotografa a tela, lê e salva; o resultado vira a fala do Slimedex
  onCapturar: cb => ipcRenderer.on('bau-capturar', () => cb()),
  capturar: () => ipcRenderer.invoke('bau-capturar'), niveis: (arq, r) => ipcRenderer.invoke('bau-niveis', arq, r),
  ler: () => ipcRenderer.invoke('bau-ler'), salvar: d => ipcRenderer.invoke('bau-salvar', d),
  resultado: r => ipcRenderer.send('bau-resultado', r),
  // balão de fala do Slimedex (e o menu do ícone, no mesmo balão)
  onIdioma: cb => ipcRenderer.on('idioma', (_, l) => cb(l)),
  onFala: cb => ipcRenderer.on('fala', (_, d) => cb(d)), onFalaSai: cb => ipcRenderer.on('fala-sai', () => cb()), falaClique: () => ipcRenderer.send('fala-clique'),
  menuAcao: a => ipcRenderer.send('menu-acao', a),
});
