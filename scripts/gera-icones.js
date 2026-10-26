// Ícones do app (flat, aparelho estilo dex) nas cores que a pessoa pode escolher (5 normais + 5 para daltônicos); o azul é o padrão (.exe, Mac, README, Discord).
//   node scripts/gera-icones.js   -> icones/app/<cor>.svg|.png|@2x.png|-256.png, icon.svg, icon.png (256), build/icon-mac.png (1024)
// Os PNGs são desenhados pelo Electron do node_modules (canvas), sem dependência nova.
const path = require('path'), fs = require('fs');
const RAIZ = path.join(__dirname, '..'), PASTA = path.join(RAIZ, 'icones', 'app');
// corpo, lombada, contorno, miolo da lente e (opcional) a setinha
const CORES = {
  azul:     { c: '#3b8fd9', l: '#2a6fb0', o: '#0f2a47', lente: '#4fd1ee' },
  vermelho: { c: '#e5484d', l: '#b8323a', o: '#4a1418', lente: '#3d9be9' },
  roxo:     { c: '#7c5cff', l: '#5f42d9', o: '#24165e', lente: '#4fd1ee' },
  laranja:  { c: '#f28c28', l: '#c96a12', o: '#4a2508', lente: '#3d9be9' },
  verde:    { c: '#3fbf7f', l: '#2c9a63', o: '#123d29', lente: '#3d9be9' },
  // para daltônicos (paleta Okabe-Ito, com violeta no lugar do rosa): continuam diferentes entre si em deuteranopia, protanopia e tritanopia
  'd-azul':     { c: '#0072B2', l: '#005a8c', o: '#0b2236', lente: '#66CCEE' },
  'd-amarelo':  { c: '#F0E442', l: '#c9be2e', o: '#3d3808', lente: '#0072B2', tri: '#3d3808' },
  'd-vermelhao':{ c: '#D55E00', l: '#a84a00', o: '#3b1a00', lente: '#56B4E9' },
  'd-violeta':  { c: '#8B3DFF', l: '#6a22d6', o: '#1f0b4a', lente: '#66CCEE' },
  'd-ciano':    { c: '#66CCEE', l: '#3fa9cf', o: '#0b2e3d', lente: '#0072B2' }};
const PADRAO = 'azul';
const svg = k => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
<rect x="40" y="16" width="176" height="224" rx="28" fill="${k.c}"/>
<path d="M45 21h31v214H45z" fill="${k.l}"/>
<rect x="40" y="16" width="176" height="224" rx="28" fill="none" stroke="${k.o}" stroke-width="10"/>
<path d="M76 21v214" stroke="${k.o}" stroke-width="8"/>
<path d="M76 126h52l22-24h66" fill="none" stroke="${k.o}" stroke-width="8" stroke-linejoin="round"/>
<circle cx="116" cy="70" r="34" fill="#f4fbff" stroke="${k.o}" stroke-width="8"/>
<circle cx="116" cy="70" r="21" fill="${k.lente}"/>
<circle cx="108" cy="62" r="7" fill="#f4fbff"/>
<circle cx="164" cy="50" r="8" fill="#ff5f5f" stroke="${k.o}" stroke-width="4"/>
<circle cx="186" cy="50" r="8" fill="#ffd23f" stroke="${k.o}" stroke-width="4"/>
<path d="M118 196h68" stroke="${k.o}" stroke-width="9" stroke-linecap="round"/>
<path d="M150 158l18 12-18 12z" fill="${k.tri || '#ffd23f'}"/>
</svg>
`;

if (!process.versions.electron) { // chamado pelo node: abre o Electron com este mesmo arquivo
  const r = require('child_process').spawnSync(require('electron'), [__filename], { stdio: 'inherit' });
  process.exit(r.status || 0);
}
const { app, BrowserWindow } = require('electron');
app.whenReady().then(async () => {
  fs.mkdirSync(PASTA, { recursive: true });
  const w = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await w.loadURL('data:text/html,<canvas></canvas>');
  // desenha o SVG num quadrado de lado n (com margem m de cada lado) e devolve o PNG
  const png = async (s, n, m = 0) => Buffer.from(await w.webContents.executeJavaScript(`new Promise(ok=>{const i=new Image();i.onload=()=>{
    const c=document.querySelector('canvas');c.width=c.height=${n};const g=c.getContext('2d');g.clearRect(0,0,${n},${n});g.imageSmoothingQuality='high';
    g.drawImage(i,${m},${m},${n - 2 * m},${n - 2 * m});ok(c.toDataURL('image/png').split(',')[1])};i.src='data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}'})`), 'base64');
  for (const [nome, k] of Object.entries(CORES)) {
    const s = svg(k);
    fs.writeFileSync(path.join(PASTA, nome + '.svg'), s);
    fs.writeFileSync(path.join(PASTA, nome + '.png'), await png(s, 16));      // bandeja e menu (100%)
    fs.writeFileSync(path.join(PASTA, nome + '@2x.png'), await png(s, 32));   // bandeja e menu (tela 200%)
    fs.writeFileSync(path.join(PASTA, nome + '-256.png'), await png(s, 256)); // janela da cartilha
    if (nome === PADRAO) {
      fs.writeFileSync(path.join(RAIZ, 'icon.svg'), s);
      fs.writeFileSync(path.join(RAIZ, 'icon.png'), await png(s, 256));
      fs.writeFileSync(path.join(RAIZ, 'build', 'icon-mac.png'), await png(s, 1024, 100)); // o Mac pede uma margem em volta
    }
  }
  console.log('ícones gerados:', Object.keys(CORES).join(', '), '· padrão:', PADRAO);
  app.quit();
});
