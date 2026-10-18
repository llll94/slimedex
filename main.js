const {app,BrowserWindow,Tray,Menu,screen,ipcMain,nativeImage,globalShortcut,dialog}=require('electron');
const path=require('path'),fs=require('fs');
const ICON=[64,64],PANEL=[340,480],HOTKEY='Control+Tab';
let win,tray,off=null;
function size(open){const b=win.getBounds(),[w,h]=open?PANEL:ICON,wa=screen.getDisplayMatching(b).workArea;
  let x=b.x+b.width-w,y=b.y;x=Math.max(wa.x,Math.min(x,wa.x+wa.width-w));y=Math.max(wa.y,Math.min(y,wa.y+wa.height-h));
  win.setBounds({x,y,width:w,height:h});if(!open){win.blur();salva()}} // ao fechar, devolve o foco pro jogo
// última posição do ícone, salva na pasta de dados do app; ignorada se cair fora de todas as telas
const POS=()=>path.join(app.getPath('userData'),'posicao.json');
function salva(){try{const [x,y]=win.getPosition();fs.writeFileSync(POS(),JSON.stringify({x,y}))}catch{}}
function carrega(){try{const p=JSON.parse(fs.readFileSync(POS(),'utf8')),[w,h]=ICON;
  if(screen.getAllDisplays().some(({workArea:a})=>p.x>=a.x&&p.y>=a.y&&p.x+w<=a.x+a.width&&p.y+h<=a.y+a.height))return p}catch{}return null}
// dados do próprio usuário (nomes PT, % editados, combinações novas): ficam só no PC, fora do app
const MEUS=()=>path.join(app.getPath('userData'),'meus-dados.json');
const JSON_F=[{name:'JSON',extensions:['json']}];
function gravaJson(f,d){fs.writeFileSync(f+'.tmp',JSON.stringify(d,null,1));fs.renameSync(f+'.tmp',f)}
ipcMain.handle('meus-ler',()=>{try{return JSON.parse(fs.readFileSync(MEUS(),'utf8'))}catch{return null}});
ipcMain.handle('meus-salvar',(_,d)=>{gravaJson(MEUS(),d);return true});
ipcMain.handle('meus-exportar',async(_,d)=>{const r=await dialog.showSaveDialog(win,{defaultPath:'slimepedia-meus-dados.json',filters:JSON_F});
  if(r.canceled||!r.filePath)return false;gravaJson(r.filePath,d);return true});
ipcMain.handle('meus-exportar-csv',async(_,txt)=>{const r=await dialog.showSaveDialog(win,{defaultPath:'slimepedia-minhas-combinacoes.csv',filters:[{name:'CSV',extensions:['csv']}]});
  if(r.canceled||!r.filePath)return false;fs.writeFileSync(r.filePath,'﻿'+txt);return true}); // BOM: Excel abre acentos certo
// devolve o texto cru e a extensão; quem decide como ler (JSON ou CSV) é a interface
ipcMain.handle('meus-importar',async()=>{const r=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Meus dados ou planilha',extensions:['json','csv']}]});
  if(r.canceled||!r.filePaths[0])return null;const f=r.filePaths[0];return{ext:path.extname(f).slice(1).toLowerCase(),texto:fs.readFileSync(f,'utf8').replace(/^﻿/,'')}});
app.whenReady().then(()=>{
  const wa=screen.getPrimaryDisplay().workArea,p=carrega()||{x:wa.x+wa.width-ICON[0]-48,y:wa.y+506}; // padrão: 48px da borda direita, 506px do topo
  win=new BrowserWindow({width:ICON[0],height:ICON[1],x:p.x,y:p.y,frame:false,transparent:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,hasShadow:false,webPreferences:{preload:path.join(__dirname,'preload.js')}});
  win.setAlwaysOnTop(true,'screen-saver');win.loadFile('overlay.html');
  tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')).resize({width:16}));
  tray.setToolTip('Slimepédia (Ctrl+Tab)');tray.setContextMenu(Menu.buildFromTemplate([{label:'Sair',click:()=>app.quit()}]));
  ipcMain.on('size',(_,o)=>size(o));
  // arrastar o ícone: guarda a distância do cursor ao canto da janela e acompanha o cursor
  ipcMain.on('drag-start',()=>{const c=screen.getCursorScreenPoint(),[x,y]=win.getPosition();off={x:c.x-x,y:c.y-y}});
  ipcMain.on('drag-move',()=>{if(!off)return;const c=screen.getCursorScreenPoint();win.setPosition(c.x-off.x,c.y-off.y)});
  ipcMain.on('drag-end',()=>{if(off)salva();off=null});
  // atalho global: abre o painel já com foco na busca; se já estiver aberto e em foco, fecha
  if(!globalShortcut.register(HOTKEY,()=>{const f=win.isFocused();if(!f){win.show();win.focus()}win.webContents.send('toggle',f)}))
    console.error(`Não consegui registrar o atalho ${HOTKEY} (outro programa já usa)`);
});
app.on('will-quit',()=>globalShortcut.unregisterAll());
