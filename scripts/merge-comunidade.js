// Merge diário da base colaborativa: lê os envios do Supabase e gera comunidade.json.
// Recalcula tudo do zero a cada execução (vale o envio mais recente de cada pessoa), então é seguro rodar de novo.
//
//   node scripts/merge-comunidade.js                 -> lê do Supabase (precisa SUPABASE_URL e SUPABASE_SECRET_KEY)
//   node scripts/merge-comunidade.js envios.json     -> lê de um arquivo local (para teste)
//
// Regras:
//   - combinação nova entra se >= MIN_PESSOAS pessoas diferentes enviaram (material/nível = o mais citado, chance = mediana)
//   - chance de combinação existente entra se >= MIN_PESSOAS relatos (mediana)
//   - nome PT-BR entra se >= MIN_PESSOAS pessoas usaram o mesmo nome
//   - votos 👍/👎 viram placar; combinação da comunidade muito negativada (CONTESTADA) é descartada
const fs = require('fs'), path = require('path');

const MIN_PESSOAS = 2;
const TESTE = '00000000-0000-0000-0000-000000000000'; // autor dos envios de teste
const contestada = v => v && v.d >= 3 && v.d >= 2 * v.u; // mesma regra do app

const RAIZ = path.join(__dirname, '..');
const D = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data.json'), 'utf8'));
const SLIMES = new Set(D.slimes.map(s => s.k));
const cidBase = c => [c.a, c.b, c.r, c.m].join('|'); // mesmo id que o app usa para combinações da base
const par = (a, b, r) => [a, b].sort().join('+') + '>' + r;
const baseIdx = new Map(D.combos.filter(c => c.r).map(c => [par(c.a, c.b, c.r), c]));
const baseCids = new Set(D.combos.map(cidBase));

const txt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const chance = v => (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100 ? v : null);
const mediana = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return Math.round((s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) * 10) / 10 };
function maisCitado(lista) { const n = new Map(); for (const v of lista) if (v) n.set(v, (n.get(v) || 0) + 1); let best = '', bn = 0; for (const [v, c] of n) if (c > bn || (c === bn && v < best)) { best = v; bn = c } return best }

async function lerEnvios() {
  if (process.argv[2]) return JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('faltam SUPABASE_URL / SUPABASE_SECRET_KEY');
  const linhas = [];
  for (let de = 0; ; de += 1000) {
    const r = await fetch(`${url}/rest/v1/contribuicoes?select=id,autor,created_at,payload&order=id.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Range-Unit': 'items', Range: `${de}-${de + 999}` }
    });
    if (!r.ok) throw new Error(`Supabase respondeu ${r.status}: ${await r.text()}`);
    const lote = await r.json(); linhas.push(...lote);
    if (lote.length < 1000) break;
  }
  return linhas;
}

(async () => {
  const linhas = (await lerEnvios()).filter(l => l && l.autor && l.autor !== TESTE && l.payload && typeof l.payload === 'object');
  // cada envio é uma "foto" completa dos dados da pessoa: vale o mais recente de cada autor
  const ultimo = new Map(); for (const l of linhas) ultimo.set(l.autor, l.payload);

  const novos = new Map();   // par -> { a,b,r, quem:Set, m:[], l:[], ch:[] }
  const chances = new Map(); // id da combinação -> [valores]
  const nomes = new Map();   // slime -> Map(nome normalizado -> { nome, quem:Set })
  const votos = new Map();   // id da combinação -> { u, d }

  for (const [autor, p] of ultimo) {
    for (const c of Array.isArray(p.combos) ? p.combos.slice(0, 1000) : []) {
      if (!c || !SLIMES.has(c.r) || !SLIMES.has(c.a) || !SLIMES.has(c.b)) continue;
      const k = par(c.a, c.b, c.r), ch = chance(c.ch), base = baseIdx.get(k);
      if (base) { if (ch != null) (chances.get(cidBase(base)) || chances.set(cidBase(base), []).get(cidBase(base))).push(ch); continue }
      const n = novos.get(k) || novos.set(k, { a: c.a, b: c.b, r: c.r, quem: new Set(), m: [], l: [], ch: [] }).get(k);
      if (n.quem.has(autor)) continue;
      n.quem.add(autor); n.m.push(txt(c.m, 60)); n.l.push(txt(c.l, 10)); if (ch != null) n.ch.push(ch);
    }
    for (const [id, v] of Object.entries(p.pc && typeof p.pc === 'object' ? p.pc : {})) {
      const ch = chance(v); if (ch == null) continue;
      if (baseCids.has(id)) (chances.get(id) || chances.set(id, []).get(id)).push(ch);
      else if (id.startsWith('c:') && novos.has(id.slice(2))) novos.get(id.slice(2)).ch.push(ch);
    }
    for (const [k, v] of Object.entries(p.pt && typeof p.pt === 'object' ? p.pt : {})) {
      const nome = txt(v, 40); if (!SLIMES.has(k) || !nome) continue;
      const m = nomes.get(k) || nomes.set(k, new Map()).get(k), nn = norm(nome);
      (m.get(nn) || m.set(nn, { nome, quem: new Set() }).get(nn)).quem.add(autor);
    }
    for (const [id, v] of Object.entries(p.votos && typeof p.votos === 'object' ? p.votos : {})) {
      if (v !== 1 && v !== -1 || typeof id !== 'string' || id.length > 300) continue;
      const t = votos.get(id) || votos.set(id, { u: 0, d: 0 }).get(id); v === 1 ? t.u++ : t.d++;
    }
  }

  const combos = [...novos.entries()]
    .filter(([k, n]) => n.quem.size >= MIN_PESSOAS && !contestada(votos.get('c:' + k)))
    .map(([k, n]) => ({ id: 'c:' + k, r: n.r, a: n.a, b: n.b, m: maisCitado(n.m), l: maisCitado(n.l), ch: n.ch.length ? mediana(n.ch) : null, n: n.quem.size }))
    .sort((x, y) => (x.id < y.id ? -1 : 1));
  const aceitos = new Set([...baseCids, ...combos.map(c => c.id)]);
  const pc = Object.fromEntries([...chances].filter(([id, v]) => v.length >= MIN_PESSOAS).sort().map(([id, v]) => [id, { ch: mediana(v), n: v.length }]));
  const pt = Object.fromEntries([...nomes].map(([k, m]) => { const top = [...m.values()].sort((a, b) => b.quem.size - a.quem.size || (a.nome < b.nome ? -1 : 1))[0]; return [k, top] })
    .filter(([, t]) => t.quem.size >= MIN_PESSOAS).sort().map(([k, t]) => [k, t.nome]));
  const vt = Object.fromEntries([...votos].filter(([id]) => aceitos.has(id)).sort().map(([id, v]) => [id, v]));

  // só o que o app usa decide se há novidade; "pessoas" é informativo e não abre PR sozinho
  const essencial = { combos, pc, pt, votos: vt };
  const arq = path.join(RAIZ, 'comunidade.json');
  let antes = null; try { const a = JSON.parse(fs.readFileSync(arq, 'utf8')); antes = JSON.stringify({ combos: a.combos, pc: a.pc, pt: a.pt, votos: a.votos }) } catch {}
  const mudou = antes !== JSON.stringify(essencial);
  if (mudou) fs.writeFileSync(arq, JSON.stringify({ gerado: new Date().toISOString(), pessoas: ultimo.size, ...essencial }, null, 1) + '\n');

  const nm = k => (D.slimes.find(s => s.k === k) || {}).nm || k;
  const resumo = [
    `## Base colaborativa — ${new Date().toISOString().slice(0, 10)}`, '',
    `- Envios lidos: **${linhas.length}** de **${ultimo.size}** pessoa(s)`,
    `- Combinações novas aceitas (≥${MIN_PESSOAS} pessoas): **${combos.length}** · candidatas ainda sem consenso: ${[...novos.values()].filter(n => n.quem.size < MIN_PESSOAS).length}`,
    `- Chances com consenso: **${Object.keys(pc).length}** · nomes PT-BR: **${Object.keys(pt).length}** · combinações com votos: **${Object.keys(vt).length}**`,
    `- Contestadas (muitos 👎): ${Object.entries(vt).filter(([, v]) => contestada(v)).length}`, '',
    ...(combos.length ? ['### Combinações da comunidade', '', ...combos.map(c => `- ${nm(c.r)} = ${nm(c.a)} + ${nm(c.b)}${c.m ? ` · ${c.m}` : ''}${c.ch != null ? ` · ~${c.ch}%` : ''} (${c.n} pessoas)`), ''] : []),
    ...(Object.keys(pt).length ? ['### Nomes PT-BR', '', ...Object.entries(pt).map(([k, v]) => `- ${nm(k)} → ${v}`), ''] : [])
  ].join('\n');
  fs.writeFileSync(path.join(RAIZ, 'resumo-merge.md'), resumo + '\n');
  console.log(resumo);
  console.log(mudou ? '\ncomunidade.json ATUALIZADO' : '\ncomunidade.json sem mudanças');
})().catch(e => { console.error(e.message || e); process.exit(1) });
