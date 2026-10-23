const {app,BrowserWindow,Tray,Menu,screen,ipcMain,nativeImage,globalShortcut,dialog,shell}=require('electron');
const atz=require('./atualizador');
const path=require('path'),fs=require('fs'),crypto=require('crypto');
const ICON=[64,64],PANEL=[360,480],HOTKEY='Control+Tab'; // 360px: combinação em 2 linhas; 100% dos "Como obter" e ~93% dos "Usado em" cabem (medido)
const MAC=process.platform==='darwin';
if(process.env.SLIMEDEX_DADOS)app.setPath('userData',process.env.SLIMEDEX_DADOS); // só para teste: pasta de dados separada
let win,tray,aberto=false,dialogo=false; // dialogo: janela de importar/exportar aberta
function size(open){aberto=open;const b=win.getBounds(),[w,h]=open?PANEL:ICON,wa=screen.getDisplayMatching(b).workArea;
  let x=b.x+b.width-w,y=b.y;x=Math.max(wa.x,Math.min(x,wa.x+wa.width-w));y=Math.max(wa.y,Math.min(y,wa.y+wa.height-h));
  win.setBounds({x,y,width:w,height:h});if(!open){win.blur();salva()}} // ao fechar, devolve o foco pro jogo
// última posição do ícone, salva na pasta de dados do app; ignorada se cair fora de todas as telas
const POS=()=>path.join(app.getPath('userData'),'posicao.json');
function salva(){try{const [x,y]=win.getPosition();fs.writeFileSync(POS(),JSON.stringify({x,y}))}catch{}}
function carrega(){try{const p=JSON.parse(fs.readFileSync(POS(),'utf8')),[w,h]=ICON;
  if(screen.getAllDisplays().some(({workArea:a})=>p.x>=a.x&&p.y>=a.y&&p.x+w<=a.x+a.width&&p.y+h<=a.y+a.height))return p}catch{}return null}
// dados do próprio usuário (nomes PT, % editados, combinações novas): ficam só no PC, fora do app
const MEUS=()=>path.join(app.getPath('userData'),'meus-dados.json');
async function comDialogo(f){dialogo=true;try{return await f()}finally{dialogo=false;win.focus()}}
const JSON_F=[{name:'JSON',extensions:['json']}];
function gravaJson(f,d){fs.writeFileSync(f+'.tmp',JSON.stringify(d,null,1));fs.renameSync(f+'.tmp',f)}
ipcMain.handle('meus-ler',()=>{try{return JSON.parse(fs.readFileSync(MEUS(),'utf8'))}catch{return null}});
ipcMain.handle('meus-salvar',(_,d)=>{gravaJson(MEUS(),d);return true});
ipcMain.handle('meus-exportar',async(_,d)=>{const r=await comDialogo(()=>dialog.showSaveDialog(win,{defaultPath:'slimedex-meus-dados.json',filters:JSON_F}));
  if(r.canceled||!r.filePath)return false;gravaJson(r.filePath,d);return true});
ipcMain.handle('meus-exportar-csv',async(_,txt)=>{const r=await comDialogo(()=>dialog.showSaveDialog(win,{defaultPath:'slimedex-minhas-combinacoes.csv',filters:[{name:'CSV',extensions:['csv']}]}));
  if(r.canceled||!r.filePath)return false;fs.writeFileSync(r.filePath,'﻿'+txt);return true}); // BOM: Excel abre acentos certo
// base colaborativa (Supabase): a chave publishable é pública e só permite INSERIR envios (ver supabase/schema.sql)
const SUPA={url:'https://pwletsegcprygxgoduvp.supabase.co',key:'sb_publishable_surQfAXMk00rQglRSzdQ9g_ejYsAQS8'};
function autor(){const f=path.join(app.getPath('userData'),'autor.txt'); // id aleatório deste PC, não identifica a pessoa
  try{const id=fs.readFileSync(f,'utf8').trim();if(id)return id}catch{}const id=crypto.randomUUID();fs.writeFileSync(f,id);return id}
ipcMain.handle('enviar',async(_,payload)=>{
  try{const r=await fetch(SUPA.url+'/rest/v1/contribuicoes',{method:'POST',
      headers:{apikey:SUPA.key,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({autor:autor(),versao_app:app.getVersion(),payload})});
    if(r.ok)return{ok:true};let m='';try{m=(await r.json()).message}catch{}return{ok:false,erro:m||'HTTP '+r.status}}
  catch{return{ok:false,erro:'sem conexão com a internet'}}});
// base da comunidade (gerada pelo merge diário no GitHub): baixa a mais nova; sem internet usa a última baixada ou a que vem no app
const COMUNIDADE='https://raw.githubusercontent.com/llll94/slimedex/main/comunidade.json';
ipcMain.handle('comunidade',async()=>{const cache=path.join(app.getPath('userData'),'comunidade.json');
  try{const r=await fetch(COMUNIDADE,{signal:AbortSignal.timeout(6000)});
    if(r.ok){const t=await r.text(),d=JSON.parse(t);if(d&&typeof d=='object'){fs.writeFileSync(cache,t);return d}}}catch{}
  for(const f of [cache,path.join(__dirname,'comunidade.json')]){try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{}}
  return null});
// devolve o texto cru e a extensão; quem decide como ler (JSON ou CSV) é a interface
ipcMain.handle('meus-importar',async()=>{const r=await comDialogo(()=>dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Meus dados ou planilha',extensions:['json','csv']}]}));
  if(r.canceled||!r.filePaths[0])return null;const f=r.filePaths[0];return{ext:path.extname(f).slice(1).toLowerCase(),texto:fs.readFileSync(f,'utf8').replace(/^﻿/,'')}});
// combinações fixadas na tela (☆): uma janelinha por combinação, sempre no topo e sem pegar o foco do jogo.
// Quem decide o que mostrar é o painel (textos já traduzidos); aqui só abre, fecha e lembra a posição.
const PINS=()=>path.join(app.getPath('userData'),'favoritos.json'),MAX_PINS=8,pins=new Map(); // id da combinação -> {w, dados}
let posPins={};
function salvaPins(){for(const [id,p] of pins){const [x,y]=p.w.getPosition();posPins[id]={x,y}}try{gravaJson(PINS(),posPins)}catch{}}
const naTela=(p,w,h)=>p&&screen.getAllDisplays().some(({workArea:a})=>p.x>=a.x&&p.y>=a.y&&p.x+w<=a.x+a.width&&p.y+h<=a.y+a.height);
function abrePin(d,i){const p=pins.get(d.id);if(p){p.dados=d;p.w.webContents.send('pin-dados',d);return}
  const W=300,H=58,b=win.getBounds(),wa=screen.getDisplayMatching(b).workArea; // sem posição salva: em fila, à esquerda do ícone
  const pos=naTela(posPins[d.id],W,H)?posPins[d.id]:{x:Math.max(wa.x,b.x+b.width-ICON[0]-W-8),y:Math.min(wa.y+wa.height-H,b.y+i*(H+4))};
  const w=new BrowserWindow({width:W,height:H,x:pos.x,y:pos.y,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,
    hasShadow:false,focusable:false,show:false,useContentSize:true,webPreferences:{preload:path.join(__dirname,'preload.js')}});
  w.setAlwaysOnTop(true,'screen-saver');if(MAC)w.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});
  if(process.env.SLIME_DEBUG){console.log('pin',d.id,pos);w.on('move',()=>console.log('pin move',d.id,w.getBounds()))}
  pins.set(d.id,{w,dados:d});w.loadFile('pin.html');
  w.webContents.on('did-finish-load',()=>{const q=pins.get(d.id);if(q&&q.w===w)w.webContents.send('pin-dados',q.dados)});
  w.on('closed',()=>{if(pins.get(d.id)?.w===w)pins.delete(d.id)})}
const pinDe=s=>[...pins].find(([,p])=>!p.w.isDestroyed()&&p.w.webContents===s);
function menuBandeja(l){if(tray)tray.setContextMenu(Menu.buildFromTemplate([{label:l==='en'?'Quit':'Sair',click:()=>app.quit()}]))}
app.whenReady().then(()=>{
  if(MAC&&app.dock)app.dock.hide(); // Mac: overlay fica fora do Dock (só ícone na barra de menu)
  const wa=screen.getPrimaryDisplay().workArea,p=carrega()||{x:wa.x+wa.width-ICON[0]-48,y:wa.y+506}; // padrão: 48px da borda direita, 506px do topo
  win=new BrowserWindow({width:ICON[0],height:ICON[1],x:p.x,y:p.y,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,hasShadow:false,webPreferences:{preload:path.join(__dirname,'preload.js')}});
  win.setAlwaysOnTop(true,'screen-saver');win.loadFile('overlay.html');
  if(MAC){win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});win.setFullScreenable(false)} // Mac: aparece sobre o jogo em tela cheia
  win.on('blur',()=>{if(aberto&&!dialogo)win.webContents.send('fechar')}); // clicou fora: recolhe para o ícone
  // botão "voltar" do mouse: no Windows ele chega como comando de app (não como clique), mesmo sem foco
  win.on('app-command',(_,cmd)=>{if(process.env.SLIME_DEBUG)console.log('app-command',cmd);if(cmd==='browser-backward'&&aberto)win.webContents.send('voltar')});
  tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')).resize({width:16}));
  tray.setToolTip('Slimedex (Ctrl+Tab)');menuBandeja('pt');
  ipcMain.on('idioma',(_,l)=>menuBandeja(l)); // a interface avisa o idioma escolhido
  ipcMain.handle('versao',()=>app.getVersion());
  ipcMain.handle('pasta',()=>app.getPath('userData')); // onde ficam os dados do usuário neste sistema
  // reiniciar (base nova da comunidade): salva a posição, fecha e abre de novo.
  // No .exe portátil o app roda de uma cópia temporária; reabre o .exe original (PORTABLE_EXECUTABLE_FILE).
  // nova versão no GitHub: verifica; no .exe portátil baixa, confere o SHA-256 e reinicia na nova; no Mac/dev abre a página
  const RELEASES=process.env.SLIMEDEX_RELEASE_URL||'https://api.github.com/repos/llll94/slimedex/releases/latest';
  ipcMain.handle('versao-nova',async()=>{try{return await atz.verificar(RELEASES,app.getVersion(),process.platform)}catch{return null}});
  let baixado=null; // .exe novo já baixado e conferido, esperando o reinício
  ipcMain.handle('baixar-atualizacao',async(_,nova)=>{const exe=process.env.PORTABLE_EXECUTABLE_FILE;
    if(process.platform!=='win32'||!exe||!nova||!nova.arquivo){const p=nova&&/^https:\/\/github\.com\/llll94\/slimedex\//.test(nova.pagina||'')?nova.pagina:'https://github.com/llll94/slimedex/releases/latest';shell.openExternal(p);return{aberto:true}}
    try{baixado=await atz.baixar(nova.arquivo,path.dirname(exe),p=>win.webContents.send('progresso',p));return{ok:true}}
    catch(e){return{erro:e.message}}});
  ipcMain.on('instalar-atualizacao',()=>{const exe=process.env.PORTABLE_EXECUTABLE_FILE;if(!baixado||!exe)return;
    salva();app.relaunch({execPath:baixado,args:['--remover-antigo',exe]});app.exit(0)});
  ipcMain.handle('foi-atualizado',()=>process.argv.includes('--remover-antigo')); // aberto logo depois de uma atualização
  // o que mudou em cada versão, para quem joga (novidades.json no repositório)
  const NOVIDADES=process.env.SLIMEDEX_NOVIDADES_URL||'https://raw.githubusercontent.com/llll94/slimedex/main/novidades.json'; // variável só para teste local
  ipcMain.handle('novidades',async()=>{try{const r=await fetch(NOVIDADES,{signal:AbortSignal.timeout(6000)});if(r.ok)return await r.json()}catch{}return null});
  ipcMain.on('reiniciar',()=>{salva();const exe=process.env.PORTABLE_EXECUTABLE_FILE;app.relaunch(exe?{execPath:exe,args:[]}:undefined);app.exit(0)});
  ipcMain.on('size',(_,o)=>size(o));
  // arrastar (ícone ou combinação fixada): guarda a distância do cursor ao canto da janela e acompanha o cursor
  const arrasto=new Map(),jan=e=>BrowserWindow.fromWebContents(e.sender);
  ipcMain.on('drag-start',e=>{const w=jan(e);if(!w)return;const c=screen.getCursorScreenPoint(),[x,y]=w.getPosition();arrasto.set(w,{x:c.x-x,y:c.y-y})});
  ipcMain.on('drag-move',e=>{const w=jan(e),o=w&&arrasto.get(w);if(!o)return;const c=screen.getCursorScreenPoint();w.setPosition(c.x-o.x,c.y-o.y)});
  ipcMain.on('drag-end',e=>{const w=jan(e);if(!w||!arrasto.delete(w))return;w===win?salva():salvaPins()});
  // combinações fixadas: o painel manda a lista toda (abre as novas, atualiza e fecha as que saíram)
  try{posPins=JSON.parse(fs.readFileSync(PINS(),'utf8'))||{}}catch{}
  ipcMain.on('fav-sync',(_,lista)=>{if(!Array.isArray(lista))return;lista=lista.filter(d=>d&&typeof d.id=='string').slice(0,MAX_PINS);
    const ids=new Set(lista.map(d=>d.id));for(const [id,p] of [...pins])if(!ids.has(id)){pins.delete(id);p.w.close()}lista.forEach(abrePin)});
  ipcMain.on('pin-tamanho',(e,w,h)=>{const x=jan(e);if(!x||!pinDe(e.sender))return;x.setContentSize(Math.ceil(w),Math.ceil(h));if(!x.isVisible())x.showInactive()});
  ipcMain.on('pin-fechar',e=>{const p=pinDe(e.sender);if(!p)return;pins.delete(p[0]);p[1].w.close();win.webContents.send('fav-removido',p[0])});
  ipcMain.on('pin-abrir',(e,k)=>{if(!pinDe(e.sender))return;win.show();if(MAC)app.focus({steal:true});win.focus();win.webContents.send('abrir-ficha',k)});
  // atalho global: abre o painel já com foco na busca; se já estiver aberto e em foco, fecha
  if(!globalShortcut.register(HOTKEY,()=>{const f=win.isFocused();if(!f){win.show();if(MAC)app.focus({steal:true});win.focus()}win.webContents.send('toggle',f)}))
    console.error(`Não consegui registrar o atalho ${HOTKEY} (outro programa já usa)`);
});
app.on('will-quit',()=>globalShortcut.unregisterAll());
// aberto pela atualização: apaga o .exe da versão anterior (o atualizador só aceita um Slimedex portátil na mesma pasta)
{const i=process.argv.indexOf('--remover-antigo');if(i>=0)atz.removerAntigo(process.argv[i+1],process.env.PORTABLE_EXECUTABLE_FILE)}
