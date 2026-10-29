// ponte das janelas do baú (ícone, leitor escondido e o balão de fala do Slimedex): só o que elas precisam
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bau', {
  dragStart: () => ipcRenderer.send('drag-start'), dragMove: () => ipcRenderer.send('drag-move'), dragEnd: () => ipcRenderer.send('drag-end'),
  alterna: () => ipcRenderer.send('bau-alterna'), alvos: r => ipcRenderer.send('bau-alvos', r), onDentro: cb => ipcRenderer.on('bau-dentro', (_, d) => cb(d)),
  // Capturar: o ícone pede, o leitor escondido lê a tela e salva; o resultado volta para o ícone
  capturarAgora: () => ipcRenderer.send('bau-capturar-agora'), onCapturar: cb => ipcRenderer.on('bau-capturar', () => cb()),
  capturar: () => ipcRenderer.invoke('bau-capturar'), niveis: (arq, r) => ipcRenderer.invoke('bau-niveis', arq, r),
  ler: () => ipcRenderer.invoke('bau-ler'), salvar: d => ipcRenderer.invoke('bau-salvar', d),
  resultado: r => ipcRenderer.send('bau-resultado', r), onResultado: cb => ipcRenderer.on('bau-resultado', (_, r) => cb(r)),
  // balão de fala do Slimedex
  onIdioma: cb => ipcRenderer.on('idioma', (_, l) => cb(l)),
  onFala: cb => ipcRenderer.on('fala', (_, d) => cb(d)), onFalaSai: cb => ipcRenderer.on('fala-sai', () => cb()), falaClique: () => ipcRenderer.send('fala-clique'),
});
