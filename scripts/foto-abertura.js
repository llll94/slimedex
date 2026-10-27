// Foto da tela de abertura para a cartilha: fase "Iniciando…" parada (1ª luzinha acesa), em PT e EN, 2×.
//   electron scripts/foto-abertura.js <pasta>   (chamado pelo gera-prints.js) -> <pasta>/<idioma>-abertura.webp
const { app, BrowserWindow } = require('electron'), path = require('path'), fs = require('fs');
const SAIDA = process.argv[2] || path.join(__dirname, '..', 'guia');
app.commandLine.appendSwitch('force-device-scale-factor', '2');
app.on('window-all-closed', () => {}); // fecha uma janela por idioma: não pode encerrar o app no meio
app.whenReady().then(async () => {
  for (const L of ['pt', 'en']) {
    const w = new BrowserWindow({ width: 300, height: 340, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
    await w.loadFile(path.join(__dirname, '..', 'splash.html'), { query: { foto: L } });
    await new Promise(r => setTimeout(r, 500));
    const png = (await w.webContents.capturePage()).toDataURL();
    // o print da cartilha é .webp: converte no próprio Chromium
    const webp = await w.webContents.executeJavaScript(`new Promise(ok=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;
      c.getContext('2d').drawImage(i,0,0);ok(c.toDataURL('image/webp',.9).split(',')[1])};i.src=${JSON.stringify(png)}})`);
    fs.writeFileSync(path.join(SAIDA, `${L}-abertura.webp`), Buffer.from(webp, 'base64'));
    w.destroy(); console.log(`${L}-abertura`);
  }
  app.quit();
}).catch(e => { console.error(e.message); app.exit(1) });
