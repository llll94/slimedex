// Importa as skills da World of Slime Wiki para o data.json/data.js.
// O bundle JS do site é lido como TEXTO (regex), nunca executado.
// Uso: node scripts/importa-skills.js [bundle.js já baixado]
//  - D.skills: {k, en, pw (PT da wiki, só para a busca), el, ki, ic, mp, cd, ds, de}
//  - s.sk de cada slime: ids das skills que a wiki lista para ele (sem nível)
//  - skills-extra.json: skills do jogo que a wiki não tem (entram depois das da wiki; mesma chave = vale a da wiki)
const fs = require('fs'), path = require('path'), os = require('os');
const RAIZ = path.join(__dirname, '..'), WIKI = 'https://world-of-slime-wiki.vercel.app';
const EL = { water: 'Água', ice: 'Gelo', dark: 'Sombrio', steel: 'Metal', fire: 'Fogo', power: 'Poder', electric: 'Elétrico', light: 'Luz', grass: 'Grama', ground: 'Terra', wind: 'Vento', magic: 'Magia', poison: 'Veneno' };
const campo = (o, n) => { const m = o.match(new RegExp('[,{]' + n + ':`([^`]*)`')); return m ? m[1] : '' };
const num = (o, n) => { const m = o.match(new RegExp('[,{]' + n + ':([\\d.]+)')); return m ? +m[1] : null };
// "AquaDome" → "Aqua Dome", "Fire_Breath" → "Fire Breath"
const bonito = s => s.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim();

async function bundle() {
  if (process.argv[2]) return fs.readFileSync(process.argv[2], 'utf8');
  const html = await (await fetch(WIKI + '/')).text();
  const js = (html.match(/\/assets\/index-[\w-]+\.js/) || [])[0];
  if (!js) throw new Error('não achei o bundle na página da wiki');
  const t = await (await fetch(WIKI + js)).text();
  fs.writeFileSync(path.join(os.tmpdir(), 'slimedex-wiki-bundle.txt'), t); // cópia para conferência
  return t;
}

(async () => {
  const t = await bundle();
  const ini = t.indexOf('{skills:[');
  if (ini < 0) throw new Error('lista de skills não encontrada');
  // cada skill é um objeto {id:`...`, ... descriptionEn:`...`} dentro de skills:[...]
  const skills = [];
  for (const m of t.slice(ini).matchAll(/\{id:`[^`]+`,name:`[^`]*`,nameEn:`[^`]*`,element:`[^`]*`[\s\S]*?\}(?=,\{id:`|\])/g)) {
    const o = m[0], el = EL[campo(o, 'element')];
    if (!el) throw new Error('elemento desconhecido em ' + o.slice(0, 80));
    skills.push({ k: campo(o, 'id'), en: bonito(campo(o, 'nameEn')), pw: campo(o, 'name'), el, ki: campo(o, 'kind'), ic: campo(o, 'icon'),
      mp: num(o, 'mp'), cd: num(o, 'cooldown'), ds: campo(o, 'description'), de: campo(o, 'descriptionEn') });
  }
  const ids0 = new Set(skills.map(s => s.k));
  if (skills.length < 100 || ids0.size !== skills.length) throw new Error('lista estranha: ' + skills.length + ' skills, ' + ids0.size + ' ids');
  const todas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'skills-extra.json'), 'utf8')).skills;
  for (const e of todas) { const w = skills.find(s => s.k === e.k); if (w && e.nm) w.nm = e.nm } // a wiki passou a ter: fica o nome PT do jogo
  const extra = todas.filter(s => !ids0.has(s.k)).map(({ fonte, ...s }) => s);
  skills.push(...extra);
  const ids = new Set(skills.map(s => s.k));
  // skills de cada slime: key:`SL_...` ... skills:[{id:`X`,...}]
  const porSlime = {};
  for (const m of t.matchAll(/key:`(SL_[^`]+)`[\s\S]{0,4000}?skills:\[([^\]]*)\]/g))
    if (!(m[1] in porSlime)) porSlime[m[1]] = [...m[2].matchAll(/id:`([^`]+)`/g)].map(x => x[1]).filter(k => ids.has(k));

  const D = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data.json'), 'utf8'));
  const bk = path.join(RAIZ, 'backup', 'data-antes-skills.json');
  if (!fs.existsSync(bk)) fs.writeFileSync(bk, JSON.stringify(D));
  D.skills = skills; delete D.icones;
  let com = 0;
  for (const s of D.slimes) { s.sk = porSlime[s.k] || []; if (s.sk.length) com++ }
  const j = JSON.stringify(D);
  fs.writeFileSync(path.join(RAIZ, 'data.json'), j);
  fs.writeFileSync(path.join(RAIZ, 'data.js'), 'window.D=' + j + ';\n');
  const pe = {}; skills.forEach(s => pe[s.el] = (pe[s.el] || 0) + 1);
  console.log(`${skills.length} skills (${extra.length} de skills-extra.json) · ${com} slimes com skill`); console.log(pe);
})().catch(e => { console.error(e.message); process.exit(1) });
