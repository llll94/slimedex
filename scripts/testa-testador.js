// Mede o testador deixando cada combinação conhecida de fora: em que posição a certa aparece e que chance recebe.
//   node scripts/testa-testador.js            -> com o material de cada combinação
//   node scripts/testa-testador.js sem-mat     -> sem material
const path = require('path');
const T = require('../testador.js');
const RAIZ = path.join(__dirname, '..');
const D = require(path.join(RAIZ, 'data.json')), CM = require(path.join(RAIZ, 'comunidade.json'));
const K = {}; D.slimes.forEach(s => K[s.k] = s);
const norm = t => (t || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
// "Fragmento Sólido (Solid Fragment)" -> chave do item, para o mesmo material em PT/EN contar igual
const IT = {}; (D.itens || []).forEach(i => [i.pt, i.en, i.pt + ' (' + i.en + ')'].forEach(v => IT[norm(v)] = i.k));
const matK = m => IT[norm(m)] || norm(m);
const C = [...D.combos, ...CM.combos].filter(c => c.r && K[c.r] && K[c.a] && K[c.b]);
const semMat = process.argv[2] === 'sem-mat';
let p1 = 0, p5 = 0, p10 = 0, chTop = 0, chCerta = 0;
C.forEach((c, i) => {
  const outras = C.filter((_, j) => j !== i);
  const l = T.estimar(K[c.a], K[c.b], D.slimes, outras, semMat ? '' : c.m, matK);
  const pos = l.findIndex(x => x.k === c.r);
  if (pos === 0) p1++; if (pos >= 0 && pos < 5) p5++; if (pos >= 0 && pos < 10) p10++;
  chTop += l.length ? l[0].p : 0; chCerta += pos >= 0 ? l[pos].p : 0;
});
const pc = n => Math.round(n / C.length * 100) + '%';
console.log(`${C.length} combinações ${semMat ? '(sem material)' : '(com material)'}: 1º ${pc(p1)} · top 5 ${pc(p5)} · top 10 ${pc(p10)} · chance média do 1º ${pc(chTop)} · chance média da certa ${pc(chCerta)}`);
