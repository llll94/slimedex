const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ov',{size:o=>ipcRenderer.send('size',o),largo:on=>ipcRenderer.send('largo',on),guia:l=>ipcRenderer.send('guia',l),
  dragStart:()=>ipcRenderer.send('drag-start'),dragMove:()=>ipcRenderer.send('drag-move'),dragEnd:()=>ipcRenderer.send('drag-end'),
  onToggle:cb=>ipcRenderer.on('toggle',(_,f)=>cb(f)),onFechar:cb=>ipcRenderer.on('fechar',()=>cb()),onVoltar:cb=>ipcRenderer.on('voltar',()=>cb()),
  meus:{ler:()=>ipcRenderer.invoke('meus-ler'),salvar:d=>ipcRenderer.invoke('meus-salvar',d),
    exportar:d=>ipcRenderer.invoke('meus-exportar',d),exportarCsv:t=>ipcRenderer.invoke('meus-exportar-csv',t),
    importar:()=>ipcRenderer.invoke('meus-importar'),enviar:p=>ipcRenderer.invoke('enviar',p)},
  comunidade:()=>ipcRenderer.invoke('comunidade'),idioma:l=>ipcRenderer.send('idioma',l),versao:()=>ipcRenderer.invoke('versao'),cor:()=>ipcRenderer.invoke('cor'),escolheCor:c=>ipcRenderer.send('cor',c),gamer:on=>ipcRenderer.send('gamer',on),dalt:on=>ipcRenderer.send('dalt',on),
  pasta:()=>ipcRenderer.invoke('pasta'),abrirPasta:()=>ipcRenderer.send('abrir-pasta'),plataforma:process.platform,reiniciar:()=>ipcRenderer.send('reiniciar'),
  versaoNova:()=>ipcRenderer.invoke('versao-nova'),baixarAtualizacao:n=>ipcRenderer.invoke('baixar-atualizacao',n),instalarAtualizacao:()=>ipcRenderer.send('instalar-atualizacao'),
  foiAtualizado:()=>ipcRenderer.invoke('foi-atualizado'),novidades:()=>ipcRenderer.invoke('novidades'),onProgresso:cb=>ipcRenderer.on('progresso',(_,p)=>cb(p)),
  // combinações fixadas na tela: fav = lado do painel, pin = a janelinha de cada uma
  fav:{sync:l=>ipcRenderer.send('fav-sync',l),onRemovido:cb=>ipcRenderer.on('fav-removido',(_,id)=>cb(id)),onAbrir:cb=>ipcRenderer.on('abrir-ficha',(_,k)=>cb(k)),onOculto:cb=>ipcRenderer.on('fav-oculto',(_,id)=>cb(id))},
  // slimes do mapa (Tab): liga o leitor de tela e mostra/esconde a janelinha; a janelinha usa a mesma ponte 'pin'
  mapa:{ligar:on=>ipcRenderer.send('mapa-ligar',on),preparar:f=>ipcRenderer.send('mapa-preparar',f),mostrar:d=>ipcRenderer.send('mapa-mostrar',d),esconder:()=>ipcRenderer.send('mapa-esconder'),
    onEvento:cb=>ipcRenderer.on('mapa-evento',(_,e)=>cb(e)),onFechado:cb=>ipcRenderer.on('mapa-fechado',()=>cb())},
  pin:{onDados:cb=>ipcRenderer.on('pin-dados',(_,d)=>cb(d)),onFotos:cb=>ipcRenderer.on('pre-fotos',(_,f)=>cb(f)),tamanho:(w,h)=>ipcRenderer.send('pin-tamanho',w,h),fechar:()=>ipcRenderer.send('pin-fechar'),ocultar:()=>ipcRenderer.send('pin-ocultar'),abrir:k=>ipcRenderer.send('pin-abrir',k)}});
