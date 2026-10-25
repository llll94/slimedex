// Confere a busca/semelhança de skills.js com nomes em PT como aparecem no jogo
// Uso: node scripts/testa-skills.js
const Sk = require('../skills.js'), D = require('../data.json');
const L = D.skills;
const casos = [ // [o que a pessoa digita, id que tem que vir em 1º no "é essa?"]
  ['Barreira Aquática', 'Aqua_Barrier'], ['Barreira Aquatica', 'Aqua_Barrier'], ['aqua bariier', 'Aqua_Barrier'],
  ['Barreira de Vento', 'Wind_Barrier'], ['Garra de Metal', 'ClawMetal'], ['Garra Sombria', 'ClawDark'],
  ['Cura Aquática', 'HealAqua'], ['Domo Aquático', 'AquaDome'], ['Nevasca', 'BlizzardTempest'],
];
let ok = 0;
for (const [q, k] of casos) {
  const r = Sk.parecidas(q, L);
  const bom = r[0] && r[0].k === k;
  if (bom) ok++;
  console.log(bom ? 'ok ' : 'ERR', q.padEnd(20), '→', r.slice(0, 3).map(s => s.en).join(' | ') || '(nada)');
}
const b = Sk.busca('barreira', L).slice(0, 3).map(s => s.en);
console.log('busca "barreira" →', b.join(' | '));
const f = Sk.busca('bola de fogo', L).slice(0, 3).map(s => s.en);
console.log('busca "bola de fogo" →', f.join(' | '));
console.log('elemento de "Barreira Aquática":', Sk.elementoDe('Barreira Aquática'), '· "Garra de Metal":', Sk.elementoDe('Garra de Metal'));
console.log(`${ok}/${casos.length} no 1º lugar`);
process.exit(ok === casos.length ? 0 : 1);
