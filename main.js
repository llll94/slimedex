const {app,BrowserWindow,Tray,Menu,screen,ipcMain,nativeImage,globalShortcut,dialog,shell}=require('electron');
const atz=require('./atualizador');
const path=require('path'),fs=require('fs'),crypto=require('crypto');
const ICON=[64,64],PANEL=[360,480],HOTKEY='Control+Tab'; // 360px: combinação em 2 linhas; 100% dos "Como obter" e ~93% dos "Usado em" cabem (medido)
const LARGO=680; // tela do testador: campos à esquerda, possibilidades à direita
const MAC=process.platform==='darwin';
if(process.env.SLIMEDEX_DADOS)app.setPath('userData',process.env.SLIMEDEX_DADOS); // só para teste: pasta de dados separada
const SEM_ABERTURA=!!process.env.SLIMEDEX_SEM_ABERTURA; // só para teste/prints: pula a tela de abertura
let win,tray,aberto=false,dialogo=false,largo=false; // dialogo: janela de importar/exportar aberta; largo: painel na largura do testador
function size(open){aberto=open;const b=win.getBounds(),[w,h]=open?[largo?LARGO:PANEL[0],PANEL[1]]:ICON,wa=screen.getDisplayMatching(b).workArea;
  let x=b.x+b.width-w,y=b.y;x=Math.max(wa.x,Math.min(x,wa.x+wa.width-w));y=Math.max(wa.y,Math.min(y,wa.y+wa.height-h));
  win.setBounds({x,y,width:w,height:h});if(open&&falaMenu)calaFala();else if(falaUlt&&vivo(falaWin)&&falaWin.isVisible())fala(falaUlt);if(!open){win.blur();salva()}} // ao fechar, devolve o foco pro jogo
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
async function baixaComunidade(){const cache=path.join(app.getPath('userData'),'comunidade.json');
  // ?t=: o raw do GitHub guarda o arquivo em cache por até 5 min; com a hora no endereço vem o mais novo
  try{const r=await fetch(COMUNIDADE+'?t='+Date.now(),{signal:AbortSignal.timeout(6000)});
    if(r.ok){const t=await r.text(),d=JSON.parse(t);if(d&&typeof d=='object'){fs.writeFileSync(cache,t);return d}}}catch{}
  for(const f of [cache,path.join(__dirname,'comunidade.json')]){try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{}}
  return null}
// a abertura já baixa a base: a primeira pergunta do painel recebe essa mesma (não baixa duas vezes)
let baseAbertura=null;
ipcMain.handle('comunidade',()=>{const p=baseAbertura;baseAbertura=null;return p||baixaComunidade()});
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
// slimes do mapa (Tab) · beta: o leitor de tela é um processo à parte (só Windows, só com a chave ligada no ⋯)
// que manda o texto lido abaixo do minimapa; o painel acha o mapa e pede a janelinha com os slimes (arrastável)
const MAPA_POS=()=>path.join(app.getPath('userData'),'mapa-pos.json');
let leitor=null,mapaWin=null,mapaVisivel=false,mapaSai=0; // mapaSai: conta os "esconder" (só o último esconde de fato)
const ehMapa=s=>mapaWin&&!mapaWin.isDestroyed()&&mapaWin.webContents===s;
// leitor nativo (leitor-tela.exe, compilado no build; fica fora do pacote: app.asar.unpacked)
const LEITOR_EXE=()=>path.join(__dirname,'leitor-tela.exe').replace('app.asar'+path.sep,'app.asar.unpacked'+path.sep);
// Windows: com o jogo na frente, win.focus() não passa o teclado (cursor pisca, teclas vão pro jogo); o leitor força o primeiro plano
function trazFrente(){if(process.platform!=='win32')return;const exe=LEITOR_EXE();if(!fs.existsSync(exe))return;const h=win.getNativeWindowHandle();
  require('child_process').spawn(exe,['-foco',String(h.length>=8?h.readBigUInt64LE(0):h.readUInt32LE(0))],{windowsHide:true}).on('error',()=>{})}
function ligaLeitor(on){
  if(!on){const p=leitor;leitor=null;if(p)p.kill();mapaVisivel=false;if(mapaWin&&!mapaWin.isDestroyed())mapaWin.hide();return}
  if(leitor||process.platform!=='win32')return;
  // sem o leitor nativo, usa o PowerShell
  const exe=LEITOR_EXE();let p;
  if(fs.existsSync(exe))p=require('child_process').spawn(exe,['-pai',String(process.pid)],{windowsHide:true});
  else{ // roda de uma cópia na pasta de dados (o PowerShell não lê de dentro do pacote do app); BOM para ele ler os acentos
    const arq=path.join(app.getPath('userData'),'leitor-tela.ps1');
    try{fs.writeFileSync(arq,'\ufeff'+fs.readFileSync(path.join(__dirname,'leitor-tela.ps1'),'utf8').replace(/^\ufeff/,''))}catch(e){win.webContents.send('mapa-evento',{ev:'erro',msg:e.message});return}
    p=require('child_process').spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',arq,'-pai',String(process.pid)],{windowsHide:true})}
  leitor=p;
  require('readline').createInterface({input:p.stdout}).on('line',l=>{let o;try{o=JSON.parse(l)}catch{return}if(leitor===p&&!win.isDestroyed())win.webContents.send('mapa-evento',o)});
  p.on('exit',c=>{if(leitor!==p)return;leitor=null;win.webContents.send('mapa-evento',{ev:'erro',msg:'o leitor parou (código '+c+')'})});
  p.on('error',e=>{if(leitor===p){leitor=null;win.webContents.send('mapa-evento',{ev:'erro',msg:e.message})}})}
function criaMapa(){
  if(!mapaWin||mapaWin.isDestroyed()){let pos;try{pos=JSON.parse(fs.readFileSync(MAPA_POS(),'utf8'))}catch{}
    const wa=screen.getDisplayMatching(win.getBounds()).workArea,W=440,H=360; // padrão: à esquerda de onde o mapa grande costuma abrir
    if(!naTela(pos,W,H))pos={x:wa.x+Math.round(wa.width*.2),y:wa.y+Math.round(wa.height*.33)};
    mapaWin=new BrowserWindow({width:W,height:H,x:pos.x,y:pos.y,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,
      hasShadow:false,focusable:false,show:false,useContentSize:true,webPreferences:{preload:path.join(__dirname,'preload.js'),backgroundThrottling:false}}); // escondida entre um Tab e outro: não pode pausar
    mapaWin.setAlwaysOnTop(true,'screen-saver');if(MAC)mapaWin.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});
    const w=mapaWin;w.loadFile('mapa.html');w.webContents.on('did-finish-load',()=>{if(w.fotos)w.webContents.send('pre-fotos',w.fotos);if(w.dados)w.webContents.send('pin-dados',w.dados)})}
}
// Windows: a janela não muda de tamanho entre um mapa e outro (redimensionar janela transparente visível piscava), só a caixa de dentro;
// o recorte (setShape) deixa só a caixa pegar o mouse, o resto passa para o jogo. Mac não tem recorte: larga antes de medir e encolhe para a caixa
function mostraMapa(d){criaMapa();
  mapaWin.dados=d;if(MAC&&!mapaWin.isVisible())mapaWin.setContentSize(440,360);if(!mapaWin.webContents.isLoading())mapaWin.webContents.send('pin-dados',d)}

// cor do ícone (a pessoa escolhe na 1ª vez que o app abre, ou no easter egg; d-* = cores para daltônicos), a chave de daltônico e o gamer mode: ficam na pasta de dados, então passam pelas atualizações
const CORES=['azul','vermelho','roxo','laranja','verde','d-azul','d-amarelo','d-vermelhao','d-violeta','d-ciano'],APAR=()=>path.join(app.getPath('userData'),'aparencia.json');
let apar={};try{apar=JSON.parse(fs.readFileSync(APAR(),'utf8'))||{}}catch{}
let cor=CORES.includes(apar.cor)?apar.cor:null;
const gravaApar=()=>{try{fs.writeFileSync(APAR(),JSON.stringify(apar))}catch{}};
// bandeja no gamer mode: o glifo branco (lá não dá para animar as cores como no ícone da tela)
const iconeBandeja=()=>apar.gamer===true?nativeImage.createFromPath(path.join(__dirname,'icones','app','branco.png')):iconeCor();
const iconeCor=grande=>nativeImage.createFromPath(path.join(__dirname,'icones','app',(cor||'azul')+(grande?'-256':'')+'.png')); // o .png pequeno puxa o @2x sozinho
// menu da bandeja: título com o ícone (cinza, como no Discord), reiniciar e sair
let idiomaMenu='pt';
function menuBandeja(l){if(l)idiomaMenu=l;l=idiomaMenu;if(tray)tray.setContextMenu(Menu.buildFromTemplate([{label:'Slimedex',icon:iconeCor(),enabled:false},{type:'separator'},
  {label:l==='en'?'Restart':'Reiniciar',click:reinicia},{type:'separator'},{label:l==='en'?'Quit':'Sair',click:()=>app.quit()}]))}
// No .exe portátil o app roda de uma cópia temporária; reabre o .exe original (PORTABLE_EXECUTABLE_FILE)
function reinicia(){salva();const exe=process.env.PORTABLE_EXECUTABLE_FILE;app.relaunch(exe?{execPath:exe,args:[]}:undefined);app.exit(0)}
app.whenReady().then(()=>{
  if(MAC&&app.dock)app.dock.hide(); // Mac: overlay fica fora do Dock (só ícone na barra de menu)
  if(!SEM_ABERTURA)baseAbertura=baixaComunidade();
  const wa=screen.getPrimaryDisplay().workArea,p=carrega()||{x:wa.x+wa.width-ICON[0]-48,y:wa.y+506}; // padrão: 48px da borda direita, 506px do topo
  win=new BrowserWindow({width:ICON[0],height:ICON[1],x:p.x,y:p.y,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,hasShadow:false,show:SEM_ABERTURA,webPreferences:{preload:path.join(__dirname,'preload.js')}}); // com a abertura, aparece só no fim dela
  win.setAlwaysOnTop(true,'screen-saver');win.loadFile('overlay.html');
  if(MAC){win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});win.setFullScreenable(false)} // Mac: aparece sobre o jogo em tela cheia
  win.on('blur',()=>{if(aberto&&!dialogo)win.webContents.send('fechar')}); // clicou fora: recolhe para o ícone
  // botão "voltar" do mouse: no Windows ele chega como comando de app (não como clique), mesmo sem foco
  win.on('app-command',(_,cmd)=>{if(process.env.SLIME_DEBUG)console.log('app-command',cmd);if(cmd==='browser-backward'&&aberto)win.webContents.send('voltar')});
  tray=new Tray(iconeBandeja());
  tray.setToolTip(`Slimedex ${app.getVersion()} (Ctrl+Tab)`);menuBandeja('pt');
  ipcMain.on('idioma',(_,l)=>{menuBandeja(l);if(l!=='pt'&&l!=='en')return;for(const w of [falaWin,bauWin])if(vivo(w))w.webContents.send('idioma',l)}); // a interface avisa o idioma escolhido; o balão troca junto
  ipcMain.handle('versao',()=>app.getVersion());
  ipcMain.handle('pasta',()=>app.getPath('userData')); // onde ficam os dados do usuário neste sistema
  ipcMain.on('abrir-pasta',()=>shell.openPath(app.getPath('userData')));
  // reiniciar (base nova da comunidade): salva a posição, fecha e abre de novo.
  // nova versão no GitHub: verifica; no .exe portátil baixa, confere o SHA-256 e reinicia na nova; no Mac/dev abre a página
  const RELEASES=process.env.SLIMEDEX_RELEASE_URL||'https://api.github.com/repos/llll94/slimedex/releases/latest';
  // a resposta vale 1 min (sem login o GitHub só deixa 60 perguntas por hora); se o limite estourou, vale até a hora em que libera
  let ultVersao={em:0,r:null,p:null};
  const versaoNova=()=>{const a=Date.now(),u=ultVersao;if(u.p&&(a-u.em<60e3||(u.r&&u.r.limite>a)))return u.p;
    const p=atz.verificar(RELEASES,app.getVersion(),process.platform).catch(()=>null);ultVersao={em:a,r:null,p};p.then(r=>{if(ultVersao.p===p)ultVersao.r=r});return p};
  ipcMain.handle('versao-nova',versaoNova);
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
  ipcMain.on('reiniciar',reinicia);
  // cartilha (botão i): janela com barra de título própria (sem a moldura do sistema; no Mac fica o semáforo); se já está aberta, só traz para a frente (troca o idioma se mudou)
  let guiaWin=null;
  ipcMain.on('guia',(_,l)=>{l=l==='en'?'en':'pt';const q={lang:l,v:app.getVersion(),p:process.platform,cor:cor||'azul'};
    if(guiaWin&&!guiaWin.isDestroyed()){if(guiaWin.lang!==l||guiaWin.cor!==q.cor){guiaWin.lang=l;guiaWin.cor=q.cor;guiaWin.loadFile('guia.html',{query:q})}guiaWin.show();guiaWin.focus();return}
    guiaWin=new BrowserWindow({width:1040,height:720,minWidth:760,minHeight:520,backgroundColor:'#14171a',icon:iconeCor(true),show:false,
      ...(MAC?{titleBarStyle:'hiddenInset'}:{frame:false}),webPreferences:{sandbox:true,preload:path.join(__dirname,'guia-preload.js')}});
    guiaWin.lang=l;guiaWin.cor=q.cor;guiaWin.setMenu(null);guiaWin.loadFile('guia.html',{query:q});guiaWin.once('ready-to-show',()=>guiaWin.show());guiaWin.on('closed',()=>{guiaWin=null});
    const w=guiaWin,avisa=()=>w.webContents.send('guia-max',w.isMaximized());w.on('maximize',avisa);w.on('unmaximize',avisa)});
  // cor escolhida: grava e troca o ícone da bandeja, do menu e da cartilha na hora
  ipcMain.handle('cor',()=>({cor:cor||'azul',escolhida:!!cor,gamer:apar.gamer===true,dalt:apar.dalt===true,abertura:!SEM_ABERTURA}));
  ipcMain.on('dalt',(_,on)=>{apar.dalt=!!on;gravaApar()});
  ipcMain.on('gamer',(_,on)=>{apar.gamer=!!on;gravaApar();if(tray)tray.setImage(iconeBandeja())});
  ipcMain.on('cor',(_,c)=>{if(!CORES.includes(c))return;cor=apar.cor=c;gravaApar();
    if(tray){tray.setImage(iconeBandeja());menuBandeja()}if(guiaWin&&!guiaWin.isDestroyed())guiaWin.setIcon(iconeCor(true))});
  ipcMain.on('guia-janela',(e,a)=>{const w=guiaWin;if(!w||w.isDestroyed()||e.sender!==w.webContents)return;
    if(a==='min')w.minimize();else if(a==='max')w.isMaximized()?w.unmaximize():w.maximize();else if(a==='fechar')w.close()});
  ipcMain.on('size',(_,o)=>size(o));
  ipcMain.on('largo',(_,on)=>{on=!!on;if(on===largo)return;largo=on;if(aberto)size(true)}); // cresce para a esquerda, a borda direita fica no lugar
  // arrastar (ícone ou combinação fixada): guarda a distância do cursor ao canto da janela e acompanha o cursor
  const arrasto=new Map(),jan=e=>BrowserWindow.fromWebContents(e.sender);
  ipcMain.on('drag-start',e=>{const w=jan(e);if(!w)return;const c=screen.getCursorScreenPoint(),[x,y]=w.getPosition();arrasto.set(w,{x:c.x-x,y:c.y-y})});
  ipcMain.on('drag-move',e=>{const w=jan(e),o=w&&arrasto.get(w);if(!o)return;const c=screen.getCursorScreenPoint();w.setPosition(c.x-o.x,c.y-o.y)});
  ipcMain.on('drag-end',e=>{const w=jan(e);if(!w||!arrasto.delete(w))return;
    if(w===win)salva();else if(w===mapaWin){const [x,y]=w.getPosition();try{gravaJson(MAPA_POS(),{x,y})}catch{}}else salvaPins()});
  // combinações fixadas: o painel manda a lista toda (abre as novas, atualiza e fecha as que saíram)
  try{posPins=JSON.parse(fs.readFileSync(PINS(),'utf8'))||{}}catch{}
  ipcMain.on('fav-sync',(_,lista)=>{if(!Array.isArray(lista))return;lista=lista.filter(d=>d&&typeof d.id=='string').slice(0,MAX_PINS);
    const ids=new Set(lista.map(d=>d.id));for(const [id,p] of [...pins])if(!ids.has(id)){pins.delete(id);p.w.close()}lista.forEach(abrePin)});
  ipcMain.on('pin-tamanho',(e,w,h)=>{const x=jan(e),m=ehMapa(e.sender);if(!x||!(pinDe(e.sender)||m))return;
    const [cw,ch]=x.getContentSize();let nw=Math.ceil(w),nh=Math.ceil(h);if(m&&!MAC){const f=nw+'x'+nh;if(x.forma!==f){x.forma=f;x.setShape([{x:0,y:0,width:nw,height:nh}])}nw=Math.max(cw,nw);nh=Math.max(ch,nh)} // a do mapa só cresce (caixa maior que 440×360, raro)
    if(cw!==nw||ch!==nh)x.setContentSize(nw,nh); // mesmo tamanho: não redesenha (piscava)
    if(x.isVisible()||(m&&!mapaVisivel))return; // a do mapa só aparece se o painel ainda quer (Tab pode ter fechado antes)
    if(!m)return x.showInactive();
    x.webContents.send('mapa-entra');x.setOpacity(0);x.showInactive();setTimeout(()=>{if(!x.isDestroyed())x.setOpacity(1)},16)}); // um quadro invisível: não aparece resto do desenho anterior
  ipcMain.on('pin-fechar',e=>{if(ehMapa(e.sender)){mapaVisivel=false;mapaWin.hide();win.webContents.send('mapa-fechado');return}const p=pinDe(e.sender);if(!p)return;pins.delete(p[0]);p[1].w.close();win.webContents.send('fav-removido',p[0])});
  ipcMain.on('pin-ocultar',e=>{const p=pinDe(e.sender);if(!p)return;pins.delete(p[0]);p[1].w.close();win.webContents.send('fav-oculto',p[0])}); // × : some, mas continua fixado
  ipcMain.on('pin-abrir',(e,k)=>{if(!pinDe(e.sender)&&!ehMapa(e.sender)||typeof k!='string'||k.length>200)return;win.show();if(MAC)app.focus({steal:true});win.focus();trazFrente();win.webContents.send('abrir-ficha',k)});
  // atalho global: abre o painel já com foco na busca; se já estiver aberto e em foco, fecha
  if(!globalShortcut.register(HOTKEY,()=>{const f=win.isFocused();if(!f){win.show();if(MAC)app.focus({steal:true});win.focus();trazFrente()}win.webContents.send('toggle',f)}))
    console.error(`Não consegui registrar o atalho ${HOTKEY} (outro programa já usa)`);
  if(!SEM_ABERTURA)abertura(versaoNova);
});
// abertura (igual ao Discord): "Procurando atualizações…" confere versão nova e base da comunidade (no máx. 8 s);
// "Iniciando…" espera o painel ler os dados e montar a lista; no fim some e abre o painel
function abertura(versaoNova){const espera=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms))),ate=(p,ms)=>Promise.race([p,espera(ms)]);
  const base=baseAbertura,montou=new Promise(r=>ipcMain.once('pronto',r));
  const sp=new BrowserWindow({width:300,height:340,center:true,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,show:false,hasShadow:false,
    webPreferences:{preload:path.join(__dirname,'splash-preload.js')}});
  const fase=f=>{if(!sp.isDestroyed())sp.webContents.send('fase',f)};
  (async()=>{try{
    const carregou=new Promise(r=>sp.once('ready-to-show',r));sp.loadFile('splash.html');await ate(carregou,3000);if(!sp.isDestroyed())sp.show();
    let t=Date.now();await ate(Promise.all([versaoNova(),base]),8000);await espera(1000-(Date.now()-t)); // fica pelo menos 1 s: dá para ler
    fase('iniciando');t=Date.now();await ate(montou,8000);await espera(800-(Date.now()-t));
    fase('pronto');await espera(500);fase('sai');await espera(350);
  }finally{if(!sp.isDestroyed())sp.close();win.show();if(MAC)app.focus({steal:true});win.focus();trazFrente();win.webContents.send('abrir-inicio')}})()}
// ---- baú (só Windows): o baú em si é uma tela do painel; abrir e capturar ficam no menu do ícone (mouse em cima do Slimedex).
// A chave no ⋯ liga os atalhos com o jogo na frente (X e Ctrl+X). A leitura do baú do jogo (foto da tela → cartas → slimes →
// níveis) roda numa janela escondida (bau.html); o resultado o Slimedex "fala" num balão
let bauWin=null,vistaBau=false,lendoBau=0; // vistaBau: o painel está mostrando a tela do baú; lendoBau: hora em que a leitura começou
const BAU=()=>path.join(app.getPath('userData'),'bau.json');
const vivo=w=>w&&!w.isDestroyed();
function ligaBau(on){ligaTeclas(on);if(!on&&vivo(bauWin)){bauWin.destroy();bauWin=null}}
// abrir/fechar o baú = abrir o painel na tela do baú / fechar o painel
const bauAberto=()=>aberto&&vistaBau;
function abreBau(){win.show();win.focus();trazFrente();win.webContents.send('abrir-bau')}
function fechaBau(){if(bauAberto())win.webContents.send('fechar')}
const alternaBau=()=>{if(bauAberto())fechaBau();else abreBau()};
// atalhos com o jogo na frente (leitor-tela.exe -teclas): X abre/fecha o baú, V fecha, Ctrl+X captura
let teclas=null;
function ligaTeclas(on){if(!on||process.platform!=='win32'){const p=teclas;teclas=null;if(p)p.kill();return}
  const exe=LEITOR_EXE();if(teclas||!fs.existsSync(exe))return;const p=teclas=require('child_process').spawn(exe,['-teclas','-pai',String(process.pid)],{windowsHide:true});
  require('readline').createInterface({input:p.stdout}).on('line',l=>{let o;try{o=JSON.parse(l)}catch{return}if(teclas!==p||o.ev!=='tecla')return; // (o clique fora o painel já trata: ele fecha ao perder o foco)
    if(o.k==='x')alternaBau();else if(o.k==='v')fechaBau();else if(o.k==='cx')capturaBau()});
  p.on('exit',()=>{if(teclas===p)teclas=null});p.on('error',()=>{if(teclas===p)teclas=null})}
const doBau=e=>[bauWin,falaWin].some(w=>vivo(w)&&e.sender===w.webContents);
ipcMain.on('bau-ligar',(_,on)=>ligaBau(!!on));
ipcMain.on('bau-vista',(e,on)=>{if(e.sender===win.webContents)vistaBau=!!on});
// Capturar (menu do ícone, Ctrl+X): a leitura roda na janela escondida (criada na 1ª vez); o resultado vai para o painel
// (redesenha o baú) e vira a fala do Slimedex. Uma leitura por vez (com folga, se o leitor travar)
function capturaBau(){if(process.platform!=='win32'||Date.now()-lendoBau<20000)return;lendoBau=Date.now();fala({lendo:true});
  if(!vivo(bauWin)){bauWin=new BrowserWindow({width:200,height:200,show:false,frame:false,transparent:true,skipTaskbar:true,focusable:false,webPreferences:{preload:path.join(__dirname,'bau-preload.js'),backgroundThrottling:false}});bauWin.loadFile('bau.html')}
  bauWin.tela=screen.getDisplayMatching(win.getBounds());const pede=()=>vivo(bauWin)&&bauWin.webContents.send('bau-capturar');
  if(bauWin.webContents.isLoading())bauWin.webContents.once('did-finish-load',()=>setTimeout(pede,50));else pede()}
ipcMain.on('bau-capturar-agora',e=>{if(e.sender===win.webContents){win.webContents.send('bau-usou');capturaBau()}}); // Ctrl+X no painel
ipcMain.on('bau-resultado',(e,r)=>{if(!vivo(bauWin)||e.sender!==bauWin.webContents)return;r=r&&typeof r=='object'?r:{erro:'?'};
  lendoBau=0;win.webContents.send('bau-atualizado');fala({...r,acao:'bau'})});
ipcMain.handle('bau-ler',()=>{try{return JSON.parse(fs.readFileSync(BAU(),'utf8'))}catch{return null}});
ipcMain.handle('bau-salvar',(e,d)=>{if(!doBau(e)||!d||typeof d!='object')return false;herdaCoracao(d);gravaJson(BAU(),d);return true});
// coração da carta (clique no baú do painel): 0 nada, 1 azul vazio, 2 rosa
ipcMain.handle('bau-coracao',(e,i,k,am)=>{if(!vivo(win)||e.sender!==win.webContents||![0,1,2].includes(am))return false;let d;try{d=JSON.parse(fs.readFileSync(BAU(),'utf8'))}catch{return false}
  const c=d&&Array.isArray(d.v)&&d.v[i];if(!c||c.k!==k)return false;if(am)c.am=am;else delete c.am;gravaJson(BAU(),d);return true});
// nova captura: o coração marcado à mão continua na mesma carta (mesma casa e slime; senão o mesmo slime e nível ainda sem dono).
// Se a captura já leu o coração na tela (c.am), vale o que ela leu
function herdaCoracao(d){let velho;try{velho=JSON.parse(fs.readFileSync(BAU(),'utf8')).v}catch{}if(!Array.isArray(velho)||!Array.isArray(d.v))return;
  const usado=new Set(),pega=(c,j)=>{if(!('am' in c))c.am=velho[j].am;usado.add(j)},tem=j=>velho[j]&&velho[j].am&&!usado.has(j);
  d.v.forEach((c,i)=>{if(c&&c.k&&tem(i)&&velho[i].k===c.k)pega(c,i)});
  d.v.forEach(c=>{if(!c||!c.k||'am' in c)return;const j=velho.findIndex((o,j)=>tem(j)&&o.k===c.k&&o.lv===c.lv);if(j>=0)pega(c,j)});
  d.v.forEach(c=>{if(c&&!c.am)delete c.am})}
// a fala do Slimedex: balão saindo do ícone (ou do painel) contando o que aconteceu; some sozinho; clicar abre o baú.
// O mesmo balão mostra o menu do ícone (msg.menu): fica enquanto o cursor estiver no ícone ou nele
// msg.fica: aviso que só some depois que o mouse passa por cima e sai (ou com um clique); msg.acao: o que o clique faz
let falaWin=null,falaT=0,falaSai=0,falaMenu=false,menuFora=0,falaFica=false,ficaPassou=false,falaAcao=null,falaUlt=null;
// onde o balão fica: à esquerda do Slimedex (ícone ou painel); sem espaço, à direita
function posFala(W,H){const b=win.getBounds(),wa=screen.getDisplayMatching(b).workArea,topo=aberto?b.y+18:b.y+b.height/2-H/2;
  let x=b.x-W+6,lado='e';if(x<wa.x){x=b.x+b.width-6;lado='d'}
  return{lado,pos:{x:Math.round(x),y:Math.round(Math.max(wa.y,Math.min(topo,wa.y+wa.height-H))),width:W,height:H}}}
function fala(msg){falaMenu=!!msg.menu;falaFica=!!msg.fica;ficaPassou=false;falaAcao=msg.acao||null;falaUlt=msg.menu?null:msg;
  const W=msg.menu?212:320,H=msg.menu?(msg.atualizar?160:126):96,{lado,pos}=posFala(W,H),dados={...msg,lado,cor:cor||'azul'};
  const mostra=()=>{if(!vivo(falaWin))return;const ja=falaWin.isVisible();falaSai++;falaWin.webContents.send('fala',dados);
    if(!ja){falaWin.setOpacity(0);falaWin.showInactive();falaWin.moveTop();setTimeout(()=>{if(vivo(falaWin))falaWin.setOpacity(1)},16)} // igual ao Tab: aparece invisível e sobe um quadro depois; já aberto, só troca o texto
    clearTimeout(falaT);if(!msg.lendo&&!msg.menu&&!msg.fica)falaT=setTimeout(calaFala,msg.ms||(msg.erro?7000:5000))};
  if(vivo(falaWin)){falaWin.setBounds(pos);return mostra()} // menu e fala têm tamanhos diferentes
  falaWin=new BrowserWindow({...pos,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,hasShadow:false,focusable:false,show:false,
    webPreferences:{preload:path.join(__dirname,'bau-preload.js'),backgroundThrottling:false}});
  falaWin.setAlwaysOnTop(true,'screen-saver');falaWin.loadFile('fala.html');falaWin.webContents.once('did-finish-load',mostra)}
function calaFala(){falaMenu=falaFica=false;falaUlt=null;if(!vivo(falaWin)||!falaWin.isVisible())return;const n=++falaSai;falaWin.webContents.send('fala-sai');setTimeout(()=>{if(n===falaSai&&vivo(falaWin))falaWin.hide()},220)}
ipcMain.on('fala-clique',e=>{if(!vivo(falaWin)||e.sender!==falaWin.webContents)return;const a=falaAcao;calaFala();
  if(a==='bau')abreBau();else if(a==='atualizar')win.webContents.send('atualizar-agora');
  else if(a==='feitas'){win.show();win.focus();trazFrente();win.webContents.send('abrir-feitas')}}); // "atualizado": abre o que mudou
// o painel pede uma fala (saudação ao abrir, versão nova, descobertas novas da comunidade). Não toma o lugar do "lendo…",
// do menu aberto nem de um aviso que fica
ipcMain.on('fala-pede',(e,m)=>{if(e.sender!==win.webContents||!m||typeof m!='object'||lendoBau||falaMenu)return;
  if(falaFica&&!m.fica&&vivo(falaWin)&&falaWin.isVisible())return;
  fala({t1:String(m.t1||'').slice(0,80),t2:String(m.t2||'').slice(0,140),tipo:m.tipo==='aviso'?'aviso':'ok',fica:!!m.fica,acao:['atualizar','feitas'].includes(m.acao)?m.acao:null,ms:Math.min(15000,+m.ms||0)||undefined})});
// menu do ícone: aparece com o mouse em cima do Slimedex (fechado); não toma o lugar do "lendo…"
ipcMain.on('ico-menu',(e,on,at)=>{if(e.sender!==win.webContents||process.platform!=='win32')return; // at: tem versão nova (4ª opção: Atualizar)
  if(!on){if(falaMenu)calaFala();return}if(!aberto&&!lendoBau&&!falaMenu)fala({menu:true,atualizar:!!at})});
// menu: some quando o cursor sai do ícone e do balão (com folga para atravessar o vão entre os dois). Aviso que fica: some depois
// que o mouse passa por cima dele e sai. Só roda com um dos dois na tela (antes do app 'ready' o 'screen' não pode ser usado)
setInterval(()=>{if(!(falaMenu||falaFica)||!vivo(falaWin)||!falaWin.isVisible())return;
  const c=screen.getCursorScreenPoint(),em=b=>c.x>=b.x&&c.x<b.x+b.width&&c.y>=b.y&&c.y<b.y+b.height;
  if(falaFica){if(em(falaWin.getBounds()))ficaPassou=true;else if(ficaPassou)calaFala();return}
  if((!aberto&&em(win.getBounds()))||em(falaWin.getBounds())){menuFora=0;return}
  if(!menuFora)menuFora=Date.now();else if(Date.now()-menuFora>250){menuFora=0;calaFala()}},60);
ipcMain.on('menu-acao',(e,a)=>{if(!vivo(falaWin)||e.sender!==falaWin.webContents||!falaMenu)return;
  if(a==='abrir'){calaFala();win.show();win.focus();trazFrente();win.webContents.send('toggle',false)} // igual ao Ctrl+Tab
  else if(a==='bau'){calaFala();win.webContents.send('bau-usou');abreBau()}
  else if(a==='capturar'){win.webContents.send('bau-usou');capturaBau()} // o menu vira o "lendo…" no mesmo balão
  else if(a==='atualizar'){calaFala();win.webContents.send('atualizar-agora')}});
// Capturar: fotografa a tela (resolução real) e devolve a foto, sem esconder nada (o ícone, o painel e o balão não ficam em cima
// das cartas do jogo); o arquivo temporário serve só para o OCR dos níveis e é apagado na leitura seguinte
let bauFoto=null;
ipcMain.handle('bau-capturar',async e=>{if(!vivo(bauWin)||e.sender!==bauWin.webContents)return null;const {desktopCapturer}=require('electron');
  const d=bauWin.tela||screen.getPrimaryDisplay(),W=Math.round(d.size.width*d.scaleFactor),H=Math.round(d.size.height*d.scaleFactor);
  try{
    const f=process.env.SLIMEDEX_BAU_FOTO?[{thumbnail:nativeImage.createFromPath(process.env.SLIMEDEX_BAU_FOTO)}]:await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:W,height:H}}); // SLIMEDEX_BAU_FOTO: só para teste (um print no lugar da tela)
    const s=f.find(x=>x.display_id===String(d.id))||f[0];if(!s||s.thumbnail.isEmpty())return{erro:'sem captura'};
    if(bauFoto)try{fs.unlinkSync(bauFoto)}catch{}
    bauFoto=path.join(app.getPath('temp'),`slimedex-bau-${process.pid}.png`);fs.writeFileSync(bauFoto,s.thumbnail.toPNG());
    return{url:'data:image/png;base64,'+s.thumbnail.toPNG().toString('base64'),arq:bauFoto}}
  catch(x){return{erro:x.message}}});
// níveis ("LV12" no rodapé de cada carta): OCR do Windows pelo leitor-tela.exe
ipcMain.handle('bau-niveis',(e,arq,rs)=>new Promise(ok=>{if(!vivo(bauWin)||e.sender!==bauWin.webContents||arq!==bauFoto||!Array.isArray(rs))return ok(null);const exe=LEITOR_EXE();if(!fs.existsSync(exe))return ok(null);
  const args=['-niveis',arq,...rs.slice(0,60).map(r=>r.map(n=>Math.max(0,n|0)).join(','))];
  require('child_process').execFile(exe,args,{timeout:15000,windowsHide:true},(err,out)=>{try{try{fs.unlinkSync(arq)}catch{}if(bauFoto===arq)bauFoto=null;ok(JSON.parse(String(out).trim().split('\n').pop()).niveis)}catch{ok(null)}})}));
app.on('will-quit',()=>{globalShortcut.unregisterAll();ligaLeitor(false);ligaTeclas(false);if(bauFoto)try{fs.unlinkSync(bauFoto)}catch{}});
ipcMain.on('mapa-ligar',(_,on)=>ligaLeitor(!!on));
ipcMain.on('mapa-escolha',(e,n)=>{if(ehMapa(e.sender)&&typeof n=='string'&&n.length<=80)win.webContents.send('mapa-escolha',n)}); // "Qual é este mapa?": a resposta vai para o painel
ipcMain.on('mapa-mostrar',(_,d)=>{if(!d||typeof d!='object')return;mapaVisivel=true;mapaSai++;mostraMapa(d)});
// ao ligar: cria a janelinha escondida e já carrega as fotos dos slimes dos mapas (o primeiro Tab não espera a internet)
ipcMain.on('mapa-preparar',(_,fotos)=>{if(!Array.isArray(fotos))return;criaMapa();mapaWin.fotos=fotos.filter(u=>typeof u=='string'&&u.startsWith('https://')).slice(0,400);
  if(!mapaWin.webContents.isLoading())mapaWin.webContents.send('pre-fotos',mapaWin.fotos)});
// some aos poucos como o mapa do jogo (450 ms) e só então esconde a janela; se voltou a mostrar nesse meio-tempo, fica
ipcMain.on('mapa-esconder',()=>{mapaVisivel=false;if(!mapaWin||mapaWin.isDestroyed())return;if(!mapaWin.isVisible())return mapaWin.hide();
  const n=++mapaSai,w=mapaWin;w.webContents.send('mapa-sai');setTimeout(()=>{if(n===mapaSai&&!mapaVisivel&&!w.isDestroyed())w.hide()},460)});
// aberto pela atualização: apaga o .exe da versão anterior (o atualizador só aceita um Slimedex portátil na mesma pasta)
{const i=process.argv.indexOf('--remover-antigo');if(i>=0)atz.removerAntigo(process.argv[i+1],process.env.PORTABLE_EXECUTABLE_FILE)}
