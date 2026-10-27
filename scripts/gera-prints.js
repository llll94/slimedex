// Prints da cartilha: abre o app (Electron do node_modules) com dados de exemplo numa pasta temporária, fotografa cada
// tela em PT e EN (2×) e mede onde cai cada número das marcas de guia.js.
//   node scripts/gera-prints.js      -> grava guia/<idioma>-<img>.webp e guia/marcas.js
// O painel aparece na tela por alguns segundos; não clique fora dele enquanto roda (clicar fora fecha o painel).
const { spawn } = require('child_process'), path = require('path'), fs = require('fs'), os = require('os');
const RAIZ = path.join(__dirname, '..'), SAIDA = path.join(RAIZ, 'guia'), PORTA = 9351;
const G = require('../guia.js');
const espera = ms => new Promise(r => setTimeout(r, ms));

// dados de exemplo: um teste com resultado (compartilhado), um sem resultado (só no PC) e uma skill anotada (Mud Bass: Aqua Barrier nv 26)
const EXEMPLO = { pt: {}, pc: {}, votos: {}, num: {}, fav: [], loc: {}, per: {}, apaga: [],
  sk: { SL_Bass_WaterGround: { Aqua_Barrier: { l: 26, cp: true, ts: 1 } } }, skn: { Aqua_Barrier: 'Barreira Aquática' }, skc: [], combos: [
  { id: 't1', r: 'SL_Starfish_WaterFire', a: 'SL_Slime_Water', b: 'SL_Slime_Fire', m: '', l: '13', ch: 30, nt: [], tst: 1, cp: true },
  { id: 't2', r: null, a: 'SL_Kobold_Steel', b: 'SL_Slime_Grass', m: '', l: '', ch: null, nt: [], tst: 1, cp: false }] };
const MAPA = 'Clareira Esquecida';
const VESPETE = 'SL_Honet_WindElectric';

// o que fazer no painel antes de cada print (roda dentro do overlay.html)
const TELAS = {
  lista: "qi.value='';list()",
  busca: "qi.value='fogo';list();mark(1)",
  ficha: `ficha('${VESPETE}');document.head.insertAdjacentHTML('beforeend','<style id=prt>.ac{opacity:1!important}</style>')`, // ✎/lixeira só aparecem no hover
  usado: `document.getElementById('prt')?.remove();ficha('SL_Rat_PoisonDark');const h=[...bd.querySelectorAll('h4')].find(x=>/usado|used/i.test(x.textContent));bd.querySelector('#bd details.sec:not(#secel):not(#secsk)')?.setAttribute('open','');bd.scrollTop=h.offsetTop-bd.offsetTop-6`,
  form: `formCombo('${VESPETE}')`,
  testador: "TST={a:rot(K.SL_Kobold_Steel),b:rot(K.SL_HermitCrab_WaterPower),m:'',r:rot(K.SL_Mercury_SteelPower),l:'19',ch:'',cp:false,ed:null,msg:'',mais:false};testador()",
  'mapa-tela': `telaMapa('${MAPA}')`,
  'sk-ficha': "ficha('SL_Bass_WaterGround');secsk.open=true",
  'sk-form': "skillForm({s:'SL_Bass_WaterGround'});SKF.q='barreira';SKF.k='Aqua_Barrier';SKF.lv='26';skillForm()",
  'sk-lista': "SKT={q:'',el:'Água'};skillsTela();stq.blur()",
  'sk-detalhe': "skillDet('Aqua_Barrier')",
  cor: 'telaCor()',
  meus: 'meus()',
  envio: 'envio()'
};

// telas compridas: o print fica mais alto que o painel (a página é desenhada nesse tamanho só para a foto); 'auto' = cabe tudo
const ALTO = { usado: 620, meus: 'auto', 'sk-form': 640, 'sk-lista': 640 };

async function cdp(alvo) {
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); let id = 0; const esp = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && esp.has(m.id)) { esp.get(m.id)(m); esp.delete(m.id) } };
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = erro });
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; esp.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) });
  const js = async expr => { const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(expr.slice(0, 80) + ' → ' + r.result.exceptionDetails.exception.description); return r.result.result.value };
  return { js, cmd, fecha: () => ws.close() };
}
const alvos = async () => (await fetch(`http://127.0.0.1:${PORTA}/json`)).json();
const alvo = async re => { for (let i = 0; i < 40; i++) { try { const a = (await alvos()).find(p => p.type === 'page' && re.test(p.url)); if (a) return a } catch {} await espera(250) } throw new Error('janela não achada: ' + re) };
// espera as imagens (vêm da wiki) e dois quadros
const PRONTO = `Promise.race([Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))),new Promise(r=>setTimeout(r,8000))]).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`;
// retângulo do elemento (com 3 px de folga), em % da tela: a cartilha desenha um contorno e o número no canto
const MEDE = marcas => `(()=>{const o={};for(const m of ${JSON.stringify(marcas)}){const e=m.sel?document.querySelector(m.sel):eval(m.js);if(!e)continue;const r=e.getBoundingClientRect();if(!r.width||r.bottom<0||r.top>innerHeight)continue;
  const p=v=>+v.toFixed(2),x=Math.max(0,r.left-3),y=Math.max(0,r.top-3),w=Math.min(innerWidth,r.right+3)-x,h=Math.min(innerHeight,r.bottom+3)-y;o[m.n]=[p(x/innerWidth*100),p(y/innerHeight*100),p(w/innerWidth*100),p(h/innerHeight*100)]}return o})()`;

async function foto(c, arq, clip) {
  const r = await c.cmd('Page.captureScreenshot', { format: 'webp', quality: 90, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
  fs.writeFileSync(arq, Buffer.from(r.result.data, 'base64'));
}

(async () => {
  const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'slimedex-prints-'));
  fs.writeFileSync(path.join(dados, 'meus-dados.json'), JSON.stringify(EXEMPLO));
  fs.writeFileSync(path.join(dados, 'aparencia.json'), JSON.stringify({ cor: 'azul' })); // cor já escolhida: o app não abre pedindo a cor
  fs.mkdirSync(SAIDA, { recursive: true });
  const app = spawn(require('electron'), [RAIZ, `--remote-debugging-port=${PORTA}`, '--force-device-scale-factor=2'],
    { env: { ...process.env, SLIMEDEX_DADOS: dados, SLIMEDEX_RELEASE_URL: 'http://127.0.0.1:1/', SLIMEDEX_NOVIDADES_URL: 'http://127.0.0.1:1/' }, stdio: 'ignore' });
  const MARCAS = {};
  try {
    const ov = await cdp(await alvo(/overlay\.html/));
    await espera(2500); // meus dados + base da comunidade
    await ov.js('open()'); await espera(500);
    const figs = G.PAGINAS.flatMap(p => p.figs);
    for (const L of ['pt', 'en']) {
      await ov.js(`idioma('${L}');list()`); await espera(300);
      const M = MARCAS[L] = { _tam: {} };
      for (const f of figs) {
        if (f.img === 'pin' || f.img === 'mapa') continue;
        const tela = '{if(pn.hidden)open();' + (f.img === 'busca' ? '' : "qi.value='';limpaX();") + TELAS[f.img] + '}'; // bloco: as variáveis de uma tela não esbarram nas da outra; painel fechado (clique fora) reabre
        await ov.js(tela); await espera(f.img === 'testador' ? 700 : 300);
        const alto = ALTO[f.img];
        if (alto) { const [w, h] = await ov.js('[innerWidth,innerHeight+bd.scrollHeight-bd.clientHeight]');
          await ov.cmd('Emulation.setDeviceMetricsOverride', { width: w, height: Math.min(alto === 'auto' ? h : alto, 1000), deviceScaleFactor: 2, mobile: false }); await espera(300); await ov.js(tela); await espera(300) }
        await ov.js(PRONTO); await espera(200);
        // na 2.1.1 o painel fechou no meio e todos os prints saíram só com o ícone: agora para em vez de gravar errado
        if (await ov.js('pn.hidden')) throw new Error(`o painel fechou antes do print ${L}-${f.img} (clicaram fora?): rode de novo sem mexer no mouse`);
        M[f.img] = await ov.js(MEDE(f.marcas || []));
        M._tam[f.img] = await ov.js('[innerWidth,innerHeight]');
        await foto(ov, path.join(SAIDA, `${L}-${f.img}.webp`));
        if (alto) { await ov.cmd('Emulation.clearDeviceMetricsOverride'); await espera(200) }
        const faltou = (f.marcas || []).filter(m => !M[f.img][m.n]).map(m => m.n);
        console.log(`${L}-${f.img}`, faltou.length ? `· sem posição para ${faltou.join(', ')}` : '');
      }
      await ov.js('list()'); await espera(300);
      // combinação fixada: janelinha pin.html
      await ov.js(`favorita(cid(made['${VESPETE}'][0]),document.body)`); await espera(1500);
      const pin = await cdp(await alvo(/pin\.html/)); await pin.js(PRONTO);
      const rp = await pin.js(`(()=>{const r=document.getElementById('p').getBoundingClientRect();return{x:r.left,y:r.top,width:r.width,height:r.height}})()`);
      await foto(pin, path.join(SAIDA, `${L}-pin.webp`), rp); M._tam.pin = [Math.round(rp.width), Math.round(rp.height)]; pin.fecha();
      await ov.js(`favorita(cid(made['${VESPETE}'][0]),document.body)`); await espera(500); console.log(`${L}-pin`);
      // slimes do mapa: caixa da janelinha mapa.html (só a caixa; o resto da janela é transparente)
      await ov.js(`mostraMapa({branco:'${MAPA}',azul:'',ms:40})`); await espera(1500);
      const mp = await cdp(await alvo(/mapa\.html/)); await mp.js(PRONTO); await espera(300);
      const rm = await mp.js(`(()=>{const r=document.getElementById('p').getBoundingClientRect();return{x:r.left,y:r.top,width:r.width,height:r.height}})()`);
      await foto(mp, path.join(SAIDA, `${L}-mapa.webp`), rm); M._tam.mapa = [Math.round(rm.width), Math.round(rm.height)]; mp.fecha();
      await ov.js('ov.mapa.esconder()'); console.log(`${L}-mapa`);
    }
    await ov.js(`idioma('pt')`); ov.fecha();
    fs.writeFileSync(path.join(SAIDA, 'marcas.js'), '// gerado por scripts/gera-prints.js: posição (% do print) de cada número da cartilha, por idioma\nwindow.MARCAS=' + JSON.stringify(MARCAS) + ';\n');
    console.log('ok: guia/marcas.js');
  } finally { app.kill(); await espera(1500); try { fs.rmSync(dados, { recursive: true, force: true }) } catch {} } // espera o app soltar a pasta
})().catch(e => { console.error(e.message || e); process.exit(1) });
