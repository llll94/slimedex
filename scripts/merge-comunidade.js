// Merge diário da base colaborativa: lê os envios do Supabase e gera comunidade.json.
// Recalcula tudo do zero a cada execução (vale o envio mais recente de cada pessoa), então é seguro rodar de novo.
//
//   node scripts/merge-comunidade.js                 -> lê do Supabase (precisa SUPABASE_URL e SUPABASE_SECRET_KEY)
//   node scripts/merge-comunidade.js envios.json     -> lê de um arquivo local (para teste)
//
// Regras:
//   - combinação nova entra se >= MIN_PESSOAS pessoas diferentes enviaram (material/nível = o mais citado, chance = a mais enviada)
//   - chance de combinação existente entra se >= MIN_PESSOAS relatos: vale a mais enviada; empate fica com a já aprovada,
//     senão com a mais recente
//   - nome PT-BR entra se >= MIN_PESSOAS pessoas usaram o mesmo nome
//   - número do slime (só para slimes sem número na base): o mais enviado; número que já é de outro slime é descartado
//   - votos 👍/👎 viram placar; combinação da comunidade muito negativada (CONTESTADA) é descartada
//   - slime visto num mapa (loc): entra se >= MIN_PESSOAS pessoas marcaram; só mapas da lista (D.mapas) e só o que a base ainda não tem
//   - apelido de mapa (mapap: texto lido pelo OCR → mapa escolhido em "Qual é este mapa?"): entra com >= MIN_APELIDO pessoas;
//     para mapa fora da lista → revisão; bloqueios.json mapa_certo vira apelido sempre
//   - dia/noite (per): o mais marcado por slime (dia | noite | ambos), só quando difere da base; trocar um já aprovado → revisão
//   - combinação "teste" da base (veio da planilha, ts) fica confirmada (conf) quando alguém a manda ou dá 👍 nela
//   - teste sem resultado (r: null, vem do testador com "Compartilhar" ligado): vira testada da comunidade (id 'c:A+B>?', selo teste);
//     não entra (ou sai sozinha) quando o mesmo par A + B já tem resultado, ou quando a base já tem essa testada
//   - não combina (2.2.1, r: null e nc: 1, botão 🚫 do testador): par que o jogo não deixa combinar (id 'c:A+B>x', nc: 1);
//     entra sozinho com >= MIN_PESSOAS; não entra (ou sai) quando o mesmo par já tem resultado, ou com muitos 👎
//   - 🗑 apagar (entrada {x:1, id} em combos): vai para 'apagadas' (combinação da base) ou tira da comunidade — sempre com revisão
//   - skills (2.1.0): sk = [{s, k, l}] (slime, skill, nível) vira sk: { slime: { skill: { l, n } } } com o nível que mais gente
//     mandou (empate: o menor); skn = nome da skill no jogo em PT (o mais mandado); skc = skill cadastrada que não está na lista
//     (id 'u:...', entra junto com a anotação que usa ela). Aprovação automática só quando a skill é da lista, tem elemento do
//     slime e o nível não muda mais de 10; skill nova, nome trocado e elemento diferente → revisão
//   - descrição de skill (2.2.1, skd): texto livre escrito no app; vale o mais mandado (empate: o menor). Texto novo ou
//     trocado SEMPRE vai para revisão (é texto livre que todo mundo vai ler). bloqueios.json skd: 'skill' ignora a descrição
//   - combinação cujo resultado é um dos próprios slimes (Mighty + X = Mighty) não existe: é ignorada
//   - bloqueios.json: autores, combinações, nomes e números que o merge ignora (rollback de verdade: o revert do PR
//     sozinho não basta, porque o merge seguinte recalcularia tudo do Supabase)
//
// Aprovação automática: compara com o comunidade.json atual e, se TUDO o que mudou segue o padrão da base, avisa o
// Actions (auto=true) para fazer o merge do PR sozinho. Padrões tirados das 176 combinações da base com resultado:
//   - resultado divide ao menos 1 elemento com os pais (98% da base)
//   - nível é praticamente fixo por resultado (só 4 de 44 variam): tem que bater com o da base quando ela sabe
//   - material vazio ou um item da lista do wiki; chance que já existia não pode pular mais de 25 pontos
//   - nome PT novo só com letras (2–30) e que não seja nome de slime em inglês; trocar nome ou número já aprovado,
//     tirar mais de 3 itens de uma vez ou mais de 30 novidades num dia → revisão manual
const fs = require('fs'), path = require('path');

const MIN_PESSOAS = 1; // 1 = a descoberta de uma pessoa já entra (a revisão do PR e os votos 👎 seguram erros)
const MIN_APELIDO = 2; // apelido de mapa (texto lido pelo OCR → mapa): só com 2 pessoas diferentes
const TESTE = '00000000-0000-0000-0000-000000000000'; // autor dos envios de teste
const contestada = v => v && v.d >= 3 && v.d >= 2 * v.u; // mesma regra do app

const RAIZ = path.join(__dirname, '..');
const D = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data.json'), 'utf8'));
const SLIMES = new Set(D.slimes.map(s => s.k));
const cidBase = c => [c.a, c.b, c.r, c.m].join('|'); // mesmo id que o app usa para combinações da base
const par = (a, b, r) => a + '+' + b + '>' + r; // a ordem importa: A + B e B + A são combinações diferentes (chance diferente)
// "base" = o data.json que os apps já têm (o da última versão publicada). O data.json do repositório pode estar à
// frente: o que ele tem a mais (PENDENTES) vai no comunidade.json até sair uma versão nova com ele.
let baseIdx, baseCids, PENDENTES = [], PARES_COM_R = new Set(); // PARES_COM_R: 'A+B' que já têm resultado (base, repositório ou comunidade)
const parT = (a, b) => a + '+' + b; // testada: só o par (ainda sem resultado)
const pcNota = c => { const m = (c.nt || []).join(' ').match(/(\d+(?:[.,]\d+)?)\s*%/); return m ? +m[1].replace(',', '.') : null }; // igual ao app
async function baseDoApp() {
  if (process.env.BASE_APP_JSON) return { tag: 'arquivo', D: JSON.parse(fs.readFileSync(process.env.BASE_APP_JSON, 'utf8')) };
  if (process.argv[2]) return { tag: 'repo', D };
  const h = { 'User-Agent': 'slimedex-merge', ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) };
  const rel = await (await fetch('https://api.github.com/repos/llll94/slimedex/releases/latest', { headers: h })).json();
  if (!rel.tag_name) throw new Error('não achei a última versão publicada');
  const r = await fetch(`https://raw.githubusercontent.com/llll94/slimedex/${rel.tag_name}/data.json`);
  if (!r.ok) throw new Error(`data.json da ${rel.tag_name}: HTTP ${r.status}`); // falha em vez de tirar as pendentes de quem usa
  return { tag: rel.tag_name, D: await r.json() };
}
const K = Object.fromEntries(D.slimes.map(s => [s.k, s]));
// slimes que eram duplicados e viraram um só (D.apelidos: chave antiga -> nova): envios com a chave antiga continuam valendo
const semApelidos = p => { let s = JSON.stringify(p); for (const [de, para] of Object.entries(D.apelidos || {})) s = s.replace(new RegExp(`\\b${de}\\b`, 'g'), para); return JSON.parse(s) };
let BQ = {}; try { BQ = JSON.parse(fs.readFileSync(path.join(RAIZ, 'bloqueios.json'), 'utf8')) } catch {}
const bloq = n => new Set(Array.isArray(BQ[n]) ? BQ[n] : []);
const BQ_AUTOR = bloq('autores'), BQ_COMBO = bloq('combos'), BQ_PT = bloq('pt'), BQ_NUM = bloq('num'), BQ_LOC = bloq('loc'); // loc: 'Mapa=SL_x' ou 'Mapa'
// combinações "teste" do data.json do repositório (podem ainda não estar na versão publicada: aí chegam como 'c:'+par)
const TESTE_IDX = new Map(D.combos.filter(c => c.ts && c.r).map(c => [par(c.a, c.b, c.r), c]));
const SKILLS = new Map((D.skills || []).map(s => [s.k, s]));
const ELEMENTOS = new Set(['Água', 'Gelo', 'Sombrio', 'Metal', 'Fogo', 'Poder', 'Elétrico', 'Luz', 'Grama', 'Terra', 'Vento', 'Magia', 'Veneno']);
const BQ_SKD = bloq('skd'), BQ_SK = bloq('sk'), BQ_SKN = bloq('skn'), BQ_APAGAR = bloq('apagar'); // apagar: pedido de apagar ignorado (id da combinação) // sk: 's:slime>skill' · skn: 'skill' ou 'skill=nome'
const MAPAS = new Map((D.mapas || []).map(m => [m.pt, new Set(m.sl)]));
// mapa_certo (bloqueios.json): nome lido errado/cortado pelo app -> nome certo; o que foi marcado no errado passa para o certo
// mesmo jeito do app (overlay.html planoM) de comparar o que o OCR leu: sem acento/espaço, o/c/e, 1/l/i e rn/m iguais
const planoM = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9|]/g, '').replace(/[ceo0]/g, 'o').replace(/[il1|]/g, 'i').replace(/rn/g, 'm');
const MAPA_CERTO = BQ.mapa_certo && typeof BQ.mapa_certo === 'object' && !Array.isArray(BQ.mapa_certo) ? BQ.mapa_certo : {};

const txt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const chance = v => (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100 ? v : null);
// chance mais enviada; 'a' vem em ordem de envio (o último é o mais recente)
const arred = v => Math.round(v * 10) / 10;
function maisEnviada(a, aprovada) {
  const n = new Map(); for (const v of a) n.set(arred(v), (n.get(arred(v)) || 0) + 1);
  const max = Math.max(...n.values()), empate = [...n].filter(([, c]) => c === max).map(([v]) => v);
  if (aprovada != null && empate.includes(arred(aprovada))) return arred(aprovada);
  for (let i = a.length - 1; i >= 0; i--) if (empate.includes(arred(a[i]))) return arred(a[i]);
}
let ANTES = null; try { ANTES = JSON.parse(fs.readFileSync(path.join(RAIZ, 'comunidade.json'), 'utf8')) } catch {}
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
  const app = await baseDoApp();
  baseIdx = new Map(app.D.combos.filter(c => c.r).map(c => [par(c.a, c.b, c.r), c]));
  baseCids = new Set(app.D.combos.map(cidBase));
  PENDENTES = D.combos.filter(c => c.r && SLIMES.has(c.r) && SLIMES.has(c.a) && SLIMES.has(c.b) && !baseIdx.has(par(c.a, c.b, c.r)));
  const linhas = (await lerEnvios()).filter(l => l && l.autor && l.autor !== TESTE && !BQ_AUTOR.has(l.autor) && l.payload && typeof l.payload === 'object')
    .map(l => ({ ...l, payload: semApelidos(l.payload) }));
  // cada envio é uma "foto" completa dos dados da pessoa: vale o mais recente de cada autor
  const ultimo = new Map(), anterior = new Map(), ordem = new Map();
  linhas.forEach((l, i) => { if (ultimo.has(l.autor)) anterior.set(l.autor, ultimo.get(l.autor)); ultimo.set(l.autor, l.payload); ordem.set(l.autor, i) });
  // chances que uma pessoa mandou: id da base (ou 'c:'+par) -> valores, na ordem (o % editado na linha vem por último)
  const relatos = p => { const r = new Map(), add = (id, ch) => (r.get(id) || r.set(id, []).get(id)).push(ch);
    for (const c of Array.isArray(p.combos) ? p.combos.slice(0, 1000) : []) { if (!c || !SLIMES.has(c.r) || !SLIMES.has(c.a) || !SLIMES.has(c.b)) continue;
      const ch = chance(c.ch); if (ch == null) continue; const k = par(c.a, c.b, c.r), base = baseIdx.get(k); add(base ? cidBase(base) : 'c:' + k, ch) }
    for (const [id, v] of Object.entries(p.pc && typeof p.pc === 'object' ? p.pc : {})) { const ch = chance(v); if (ch != null) add(id, ch) }
    return r };
  // a mesma combinação repetida com % diferentes: vale o que a pessoa mudou desde o envio anterior, senão o último
  const escolhe = (vals, antes) => { const u = [...new Set(vals)]; if (u.length === 1) return u[0]; const novo = u.filter(v => !(antes || []).includes(v)); return novo.length ? novo[novo.length - 1] : vals[vals.length - 1] };

  const novos = new Map();   // par -> { a,b,r, quem:Set, m:[], l:[], ch:[] }
  const chances = new Map(); // id da combinação -> [valores]
  const nomes = new Map();   // slime -> Map(nome normalizado -> { nome, quem:Set })
  const numeros = new Map(); // slime -> Map(número -> Set(autores))
  const votos = new Map();   // id da combinação -> { u, d }
  const vistos = new Map();  // mapa -> Map(slime -> Set(autores))
  const periodos = new Map(); // slime -> Map(dia|noite|ambos -> Set(autores))
  const confirmadas = new Set(); // id (do app) das combinações "teste" que alguém mandou ou deu 👍
  const pedidosApagar = new Map(); // id da combinação (base: a|b|r|m, comunidade: c:...) -> Set(autores)
  const testadas = new Map(); // par A+B -> { a, b, quem:Set, m:[] } (testes sem resultado compartilhados)
  const skAnot = new Map();  // 'slime>skill' -> { s, k, quem:Set, l:[] }
  const apelidos = new Map(); // texto lido (planoM) -> Map(nome do mapa -> Set de autores)
  const skNomes = new Map(); // skill -> Map(nome normalizado -> { nome, quem:Set })
  const skCad = new Map();   // 'u:...' -> { nm:[], el:[] } (skills cadastradas)
  const skDesc = new Map();  // skill -> Map(texto normalizado -> { texto, quem:Set })
  const naoCombina = new Map(); // 'A+B' -> { a, b, quem:Set } (🚫 do testador)
  for (const c of PENDENTES) { const ch = pcNota(c); novos.set(par(c.a, c.b, c.r), { a: c.a, b: c.b, r: c.r, quem: new Set(['base']), m: [c.m || ''], l: [c.l || ''], ch: ch != null ? [ch] : [] }) }

  for (const [autor, p] of [...ultimo].sort((x, y) => ordem.get(x[0]) - ordem.get(y[0]))) { // do envio mais antigo ao mais recente
    for (const c of Array.isArray(p.combos) ? p.combos.slice(0, 1000) : []) {
      if (c && c.x === 1) { if (typeof c.id === 'string' && c.id.length <= 300) (pedidosApagar.get(c.id) || pedidosApagar.set(c.id, new Set()).get(c.id)).add(autor); continue }
      if (c && c.r == null && c.nc === 1 && SLIMES.has(c.a) && SLIMES.has(c.b)) { const k = parT(c.a, c.b); if (BQ_COMBO.has('c:' + k + '>x')) continue;
        (naoCombina.get(k) || naoCombina.set(k, { a: c.a, b: c.b, quem: new Set() }).get(k)).quem.add(autor); continue }
      if (c && c.r == null && SLIMES.has(c.a) && SLIMES.has(c.b)) { const k = parT(c.a, c.b); if (BQ_COMBO.has('c:' + k + '>?')) continue;
        const n = testadas.get(k) || testadas.set(k, { a: c.a, b: c.b, quem: new Set(), m: [] }).get(k);
        if (!n.quem.has(autor)) { n.quem.add(autor); n.m.push(txt(c.m, 60)) } continue }
      if (!c || !SLIMES.has(c.r) || !SLIMES.has(c.a) || !SLIMES.has(c.b) || c.r === c.a || c.r === c.b) continue; // resultado nunca é um dos slimes
      const k = par(c.a, c.b, c.r), base = baseIdx.get(k);
      if (TESTE_IDX.has(k)) confirmadas.add(cidBase(TESTE_IDX.get(k)));
      if (BQ_COMBO.has(base ? cidBase(base) : 'c:' + k)) continue;
      if (base) continue; // na base: só conta como relato de chance (abaixo, um por pessoa)
      const n = novos.get(k) || novos.set(k, { a: c.a, b: c.b, r: c.r, quem: new Set(), m: [], l: [], ch: [] }).get(k);
      if (n.quem.has(autor)) continue;
      n.quem.add(autor); n.m.push(txt(c.m, 60)); n.l.push(txt(c.l, 10));
    }
    const ant = relatos(anterior.get(autor) || {});
    for (const [id, vals] of relatos(p)) { if (BQ_COMBO.has(id)) continue; const ch = escolhe(vals, ant.get(id));
      const tc = id.startsWith('c:') ? TESTE_IDX.get(id.slice(2)) : [...TESTE_IDX.values()].find(c => cidBase(c) === id); if (tc) confirmadas.add(cidBase(tc)); // informou a chance: fez a combinação
      if (baseCids.has(id)) (chances.get(id) || chances.set(id, []).get(id)).push(ch);
      else if (id.startsWith('c:') && novos.has(id.slice(2))) novos.get(id.slice(2)).ch.push(ch) }
    for (const [k, v] of Object.entries(p.num && typeof p.num === 'object' ? p.num : {})) {
      if (!SLIMES.has(k) || BQ_NUM.has(k) || !Number.isInteger(v) || v < 1 || v > 9999) continue;
      const m = numeros.get(k) || numeros.set(k, new Map()).get(k); (m.get(v) || m.set(v, new Set()).get(v)).add(autor);
    }
    for (const [k, v] of Object.entries(p.pt && typeof p.pt === 'object' ? p.pt : {})) {
      const nome = txt(v, 40); if (!SLIMES.has(k) || !nome || BQ_PT.has(k) || BQ_PT.has(k + '=' + nome)) continue;
      const m = nomes.get(k) || nomes.set(k, new Map()).get(k), nn = norm(nome);
      (m.get(nn) || m.set(nn, { nome, quem: new Set() }).get(nn)).quem.add(autor);
    }
    for (let [mapa, ks] of Object.entries(p.loc && typeof p.loc === 'object' ? p.loc : {})) {
      if (typeof MAPA_CERTO[mapa] === 'string') mapa = MAPA_CERTO[mapa];
      // mapa fora da lista também entra (nome lido da tela pelo app), mas a aprovação automática manda para revisão
      if (typeof mapa !== 'string' || mapa.length > 80 || !/^[\p{L}\d][\p{L}\d' -]*$/u.test(mapa) || BQ_LOC.has(mapa) || !Array.isArray(ks)) continue;
      // 'SL_x' = visto aqui; '-SL_x' = não nasce aqui (só faz sentido para o que a base tem nesse mapa)
      for (const e of ks.slice(0, 100)) { if (typeof e !== 'string') continue; const tira = e[0] === '-', k = tira ? e.slice(1) : e, naBase = (MAPAS.get(mapa) || new Set()).has(k);
        if (!SLIMES.has(k) || (tira ? !naBase : naBase) || BQ_LOC.has(mapa + '=' + k)) continue;
        const m = vistos.get(mapa) || vistos.set(mapa, new Map()).get(mapa), c = tira ? '-' + k : k; (m.get(c) || m.set(c, new Set()).get(c)).add(autor) }
    }
    // apelidos de mapa: o que o OCR leu → mapa que a pessoa escolheu na janelinha ("Qual é este mapa?")
    for (const [lido, nome] of Object.entries(p.mapap && typeof p.mapap === 'object' ? p.mapap : {})) {
      if (!/^[a-z0-9|]{3,80}$/.test(lido) || typeof nome !== 'string' || nome.length > 80 || !/^[\p{L}\d][\p{L}\d' -]*$/u.test(nome)) continue;
      const certo = typeof MAPA_CERTO[nome] === 'string' ? MAPA_CERTO[nome] : nome, m = apelidos.get(lido) || apelidos.set(lido, new Map()).get(lido);
      (m.get(certo) || m.set(certo, new Set()).get(certo)).add(autor) }
    for (const [k, v] of Object.entries(p.per && typeof p.per === 'object' ? p.per : {})) {
      if (!SLIMES.has(k) || !['dia', 'noite', 'ambos'].includes(v) || bloq('per').has(k)) continue;
      const m = periodos.get(k) || periodos.set(k, new Map()).get(k); (m.get(v) || m.set(v, new Set()).get(v)).add(autor);
    }
    // skills: cadastradas desta pessoa (só valem se usadas numa anotação dela), anotações e nomes PT
    const cad = new Map((Array.isArray(p.skc) ? p.skc.slice(0, 50) : []).filter(c => c && typeof c.k === 'string' && /^u:[a-z0-9-]{1,58}$/.test(c.k) && txt(c.nm, 40).length >= 2 && ELEMENTOS.has(c.el)).map(c => [c.k, c]));
    for (const a of Array.isArray(p.sk) ? p.sk.slice(0, 2000) : []) {
      if (!a || !SLIMES.has(a.s) || typeof a.k !== 'string' || !(SKILLS.has(a.k) || cad.has(a.k)) || BQ_SK.has('s:' + a.s + '>' + a.k)) continue;
      const l = Number.isInteger(a.l) && a.l >= 1 && a.l <= 99 ? a.l : null, id = a.s + '>' + a.k;
      const n = skAnot.get(id) || skAnot.set(id, { s: a.s, k: a.k, quem: new Set(), l: [] }).get(id);
      if (n.quem.has(autor)) continue; n.quem.add(autor); if (l != null) n.l.push(l);
      if (cad.has(a.k)) { const c = cad.get(a.k), x = skCad.get(a.k) || skCad.set(a.k, { nm: [], el: [] }).get(a.k); x.nm.push(txt(c.nm, 40)); x.el.push(c.el) }
    }
    for (const [k, v] of Object.entries(p.skn && typeof p.skn === 'object' ? p.skn : {})) {
      const nome = txt(v, 40); if (!SKILLS.has(k) || nome.length < 2 || BQ_SKN.has(k) || BQ_SKN.has(k + '=' + nome)) continue;
      const m = skNomes.get(k) || skNomes.set(k, new Map()).get(k), nn = norm(nome);
      (m.get(nn) || m.set(nn, { nome, quem: new Set() }).get(nn)).quem.add(autor);
    }
    for (const [k, v] of Object.entries(p.skd && typeof p.skd === 'object' ? p.skd : {})) {
      const texto = txt(v, 300).replace(/\s+/g, ' '); if (!(SKILLS.has(k) || cad.has(k)) || texto.length < 2 || BQ_SKD.has(k)) continue;
      const m = skDesc.get(k) || skDesc.set(k, new Map()).get(k), nn = norm(texto);
      (m.get(nn) || m.set(nn, { texto, quem: new Set() }).get(nn)).quem.add(autor);
    }
    for (const [id, v] of Object.entries(p.votos && typeof p.votos === 'object' ? p.votos : {})) {
      if (v !== 1 && v !== -1 || typeof id !== 'string' || id.length > 300) continue;
      if (v === 1) { const tc = id.startsWith('c:') ? TESTE_IDX.get(id.slice(2)) : [...TESTE_IDX.values()].find(c => cidBase(c) === id); if (tc) confirmadas.add(cidBase(tc)) }
      const t = votos.get(id) || votos.set(id, { u: 0, d: 0 }).get(id); v === 1 ? t.u++ : t.d++;
    }
  }

  const combos = [...novos.entries()]
    .filter(([k, n]) => n.quem.size >= MIN_PESSOAS && !contestada(votos.get('c:' + k)))
    .map(([k, n]) => ({ id: 'c:' + k, r: n.r, a: n.a, b: n.b, m: maisCitado(n.m), l: maisCitado(n.l), ch: n.ch.length ? maisEnviada(n.ch, ((ANTES && ANTES.combos || []).find(c => c.id === 'c:' + k) || {}).ch) : null, n: n.quem.size }))
    .sort((x, y) => (x.id < y.id ? -1 : 1));
  PARES_COM_R = new Set([...app.D.combos, ...D.combos, ...combos].filter(c => c.r).map(c => parT(c.a, c.b)));
  const testadaNaBase = new Set([...app.D.combos, ...D.combos].filter(c => !c.r).map(c => parT(c.a, c.b)));
  combos.push(...[...testadas.entries()]
    .filter(([k, n]) => n.quem.size >= MIN_PESSOAS && !PARES_COM_R.has(k) && !testadaNaBase.has(k) && !contestada(votos.get('c:' + k + '>?')))
    .map(([k, n]) => ({ id: 'c:' + k + '>?', r: null, a: n.a, b: n.b, m: maisCitado(n.m), l: '', ch: null, n: n.quem.size, ts: 1 }))
    .sort((x, y) => (x.id < y.id ? -1 : 1)));
  combos.push(...[...naoCombina.entries()]
    .filter(([k, n]) => n.quem.size >= MIN_PESSOAS && !PARES_COM_R.has(k) && !contestada(votos.get('c:' + k + '>x')))
    .map(([k, n]) => ({ id: 'c:' + k + '>x', r: null, a: n.a, b: n.b, m: '', l: '', ch: null, n: n.quem.size, nc: 1 }))
    .sort((x, y) => (x.id < y.id ? -1 : 1)));
  const aceitos = new Set([...baseCids, ...combos.map(c => c.id)]);
  const pc = Object.fromEntries([...chances].filter(([id, v]) => v.length >= MIN_PESSOAS).sort().map(([id, v]) => [id, { ch: maisEnviada(v, ANTES && ANTES.pc && ANTES.pc[id] && ANTES.pc[id].ch), n: v.length }]));
  const pt = Object.fromEntries([...nomes].map(([k, m]) => { const top = [...m.values()].sort((a, b) => b.quem.size - a.quem.size || (a.nome < b.nome ? -1 : 1))[0]; return [k, top] })
    .filter(([, t]) => t.quem.size >= MIN_PESSOAS).sort().map(([k, t]) => [k, t.nome]));
  const vt = Object.fromEntries([...votos].filter(([id]) => aceitos.has(id)).sort().map(([id, v]) => [id, v]));

  // só o que o app usa decide se há novidade; "pessoas" é informativo e não abre PR sozinho
  // números: a base manda nos que já têm; entre os demais, vale o mais enviado e um número só fica com um slime
  const baseNum = new Map(D.slimes.filter(s => s.n != null).map(s => [s.n, s.k])), temNum = new Set(D.slimes.filter(s => s.n != null).map(s => s.k));
  const candidatos = [];
  for (const [k, m] of numeros) { if (temNum.has(k)) continue; const [n, q] = [...m].sort((a, b) => b[1].size - a[1].size || a[0] - b[0])[0]; if (q.size >= MIN_PESSOAS && !baseNum.has(n)) candidatos.push({ k, n, q: q.size }) }
  const usado = new Set(), num = {};
  for (const c of candidatos.sort((a, b) => b.q - a.q || (a.k < b.k ? -1 : 1))) { if (usado.has(c.n)) continue; usado.add(c.n); num[c.k] = c.n }
  const numOrd = Object.fromEntries(Object.keys(num).sort().map(k => [k, num[k]]));
  const loc = Object.fromEntries([...vistos].sort().map(([mapa, m]) => [mapa, [...m].filter(([, q]) => q.size >= MIN_PESSOAS).map(([k]) => k).sort()]).filter(([, ks]) => ks.length));
  const per = Object.fromEntries([...periodos].map(([k, m]) => [k, [...m].sort((a, b) => b[1].size - a[1].size || (a[0] < b[0] ? -1 : 1))[0]])
    .filter(([k, [v, q]]) => q.size >= MIN_PESSOAS && v !== (K[k] || {}).pe).sort().map(([k, [v]]) => [k, v]));
  const conf = [...confirmadas].sort();
  // skills: nível mais mandado (empate: o menor); sem nível = null
  const nivelTop = l => { if (!l.length) return null; const n = new Map(); l.forEach(v => n.set(v, (n.get(v) || 0) + 1)); return [...n].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0] };
  const sk = {};
  for (const n of [...skAnot.values()].filter(n => n.quem.size >= MIN_PESSOAS).sort((a, b) => (a.s + a.k < b.s + b.k ? -1 : 1))) (sk[n.s] = sk[n.s] || {})[n.k] = { l: nivelTop(n.l), n: n.quem.size };
  const usadas = new Set(Object.values(sk).flatMap(o => Object.keys(o)));
  const skc = [...skCad].filter(([k]) => usadas.has(k)).sort().map(([k, x]) => ({ k, nm: maisCitado(x.nm), el: maisCitado(x.el) }));
  const skn = Object.fromEntries([...skNomes].map(([k, m]) => [k, [...m.values()].sort((a, b) => b.quem.size - a.quem.size || (a.nome < b.nome ? -1 : 1))[0]])
    .filter(([, t]) => t.quem.size >= MIN_PESSOAS).sort().map(([k, t]) => [k, t.nome]));
  const skcIds = new Set(skc.map(c => c.k)); // descrição de skill cadastrada só entra junto com ela
  const skd = Object.fromEntries([...skDesc].filter(([k]) => SKILLS.has(k) || skcIds.has(k)).map(([k, m]) => [k, [...m.values()].sort((a, b) => b.quem.size - a.quem.size || (a.texto < b.texto ? -1 : 1))[0]])
    .filter(([, t]) => t.quem.size >= MIN_PESSOAS).sort().map(([k, t]) => [k, t.texto]));
  // apagar: só ids que existem (base do repositório ou combinação da comunidade); as da comunidade saem da lista
  const idsBase = new Set(D.combos.map(cidBase)), idsCom = new Set(combos.map(c => c.id));
  const apag = [...pedidosApagar].filter(([id, q]) => q.size >= MIN_PESSOAS && !BQ_APAGAR.has(id) && (idsBase.has(id) || idsCom.has(id))).map(([id]) => id);
  const apagadas = apag.filter(id => idsBase.has(id)).sort();
  // apelidos: o mapa mais escolhido para cada texto lido, com >= MIN_APELIDO pessoas (um clique errado de uma pessoa não muda o mapa de todos); os de bloqueios.json (mapa_certo) valem sempre
  const mp = {};
  for (const [lido, m] of apelidos) { const [nome, q] = [...m].sort((a, b) => b[1].size - a[1].size || (a[0] < b[0] ? -1 : 1))[0]; if (q.size >= MIN_APELIDO && !BQ_LOC.has(nome)) mp[lido] = nome }
  for (const [errado, certo] of Object.entries(MAPA_CERTO)) if (typeof certo === 'string' && planoM(errado).length >= 3) mp[planoM(errado)] = certo;
  const mapap = Object.fromEntries(Object.keys(mp).sort().map(k => [k, mp[k]]));
  const essencial = { combos: combos.filter(c => !apag.includes(c.id)), pc, pt, votos: vt, num: numOrd, loc, per, conf, apagadas, sk, skn, skc, skd, mapap };
  const arq = path.join(RAIZ, 'comunidade.json');
  let antes = null; try { const a = JSON.parse(fs.readFileSync(arq, 'utf8')); antes = { combos: a.combos || [], pc: a.pc || {}, pt: a.pt || {}, votos: a.votos || {}, num: a.num || {}, loc: a.loc || {}, per: a.per || {}, conf: a.conf || [], apagadas: a.apagadas || [], sk: a.sk || {}, skn: a.skn || {}, skc: a.skc || [], skd: a.skd || {}, mapap: a.mapap || {} } } catch {}
  const mudou = JSON.stringify(antes) !== JSON.stringify(essencial);
  if (mudou) fs.writeFileSync(arq, JSON.stringify({ gerado: new Date().toISOString(), pessoas: ultimo.size, ...essencial }, null, 1) + '\n');

  const nm = k => (K[k] || {}).nm || k;
  const skNome = (k, cad) => SKILLS.has(k) ? SKILLS.get(k).en : (((cad || []).find(c => c.k === k) || {}).nm || k) + ' (cadastrada)';
  const { barrados, novidades, removidos } = verifica(antes || { combos: [], pc: {}, pt: {}, votos: {}, num: {}, loc: {}, per: {}, conf: [], apagadas: [], sk: {}, skn: {}, skc: [], skd: {}, mapap: {} }, essencial, nm);
  for (const id of apag) if (id.startsWith('c:') && antes && antes.combos.some(c => c.id === id)) barrados.push(`apagar uma combinação da comunidade (${id.slice(2)}): confira antes de aprovar`);
  const auto = mudou && barrados.length === 0;
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `auto=${auto}\n`);
  const RECENTE = 24 * 3600e3, recentes = linhas.filter(l => l.created_at && Date.now() - new Date(l.created_at) < RECENTE).slice(-10);
  const relato = recentes.map(l => {
    const p = l.payload, out = [`**${l.autor.slice(0, 8)}** · ${String(l.created_at).slice(0, 16).replace('T', ' ')} UTC`], qt = k => Object.keys(p[k] && typeof p[k] === 'object' ? p[k] : {}).length;
    for (const c of (Array.isArray(p.combos) ? p.combos : []).slice(0, 60)) { if (!c) continue;
      const desc = c.nc === 1 && !c.r ? `🚫 ${nm(c.a)} + ${nm(c.b)} (não combina)` : `${c.r ? nm(c.r) : '?'} = ${nm(c.a)} + ${nm(c.b)}${c.m ? ' · ' + txt(c.m, 60) : ''}${c.l ? ' · nv ' + txt(c.l, 10) : ''}${chance(c.ch) != null ? ' · ' + c.ch + '%' : ''}`;
      const o = c.r && (c.r === c.a || c.r === c.b) ? 'resultado igual a um dos slimes: ignorada' : !c.r ? (SLIMES.has(c.a) && SLIMES.has(c.b) ? (PARES_COM_R.has(parT(c.a, c.b)) ? (c.nc === 1 ? 'não combina, mas o par já tem resultado: ignorada' : 'teste sem resultado: o par já tem resultado, ignorada') : c.nc === 1 ? 'não combina' : 'teste sem resultado (selo teste)') : 'slime desconhecido: ignorada') : ![c.r, c.a, c.b].every(k => SLIMES.has(k)) ? 'slime desconhecido: ignorada'
        : baseIdx.has(par(c.a, c.b, c.r)) ? 'já está na base' + (chance(c.ch) != null ? ' (conta como relato de chance)' : '') : 'nova (comunidade)';
      out.push(`  - ${desc} → ${o}`) }
    const pa = (Array.isArray(p.combos) ? p.combos : []).filter(c => c && c.x === 1).length; if (pa) out.push(`  - pediu para apagar: ${pa} combinação(ões)`);
    out.push(`  - chances editadas: ${qt('pc')} · nomes: ${qt('pt')} · números: ${qt('num')} · votos: ${qt('votos')} · mapas: ${qt('loc')} · dia/noite: ${qt('per')} · skills: ${Array.isArray(p.sk) ? p.sk.length : 0} · nomes de skill: ${qt('skn')} · skills cadastradas: ${Array.isArray(p.skc) ? p.skc.length : 0}`);
    return out.join('\n') });
  const resumo = [
    `## Base colaborativa — ${new Date().toISOString().slice(0, 10)}`, '',
    `- Envios lidos: **${linhas.length}** de **${ultimo.size}** pessoa(s)`,
    `- Base do app: **${app.tag}** · combinações do data.json que ainda não estão nela (vão pela comunidade): **${PENDENTES.length}**`,
    `- Combinações novas aceitas (≥${MIN_PESSOAS} pessoas): **${combos.length}** · candidatas ainda sem consenso: ${[...novos.values()].filter(n => n.quem.size < MIN_PESSOAS).length}`,
    `- Chances com consenso: **${Object.keys(pc).length}** · nomes PT-BR: **${Object.keys(pt).length}** · números: **${Object.keys(numOrd).length}** · combinações com votos: **${Object.keys(vt).length}**`,
    `- Contestadas (muitos 👎): ${Object.entries(vt).filter(([, v]) => contestada(v)).length}`, '',
    ...(combos.length ? ['### Combinações da comunidade', '', ...combos.map(c => c.nc ? `- 🚫 ${nm(c.a)} + ${nm(c.b)} não combina (${c.n} pessoas)` : `- ${c.r ? nm(c.r) : '?'} = ${nm(c.a)} + ${nm(c.b)}${c.m ? ` · ${c.m}` : ''}${c.ch != null ? ` · ~${c.ch}%` : ''} (${c.n} pessoas)${c.r ? '' : ' · teste'}`), ''] : []),
    ...(Object.keys(pt).length ? ['### Nomes PT-BR', '', ...Object.entries(pt).map(([k, v]) => `- ${nm(k)} → ${v}`), ''] : []),
    ...(Object.keys(numOrd).length ? ['### Números', '', ...Object.entries(numOrd).map(([k, v]) => `- ${nm(k)} → #${v}`), ''] : []),
    ...(apag.length ? ['### Apagar (pedido de alguém)', '', ...apag.map(id => id.startsWith('c:') ? `- ${(() => { const c = combos.find(x => x.id === id); return c ? `${c.r ? nm(c.r) : '?'} = ${nm(c.a)} + ${nm(c.b)}` : id })()} (comunidade)` : `- ${(() => { const [a, b, r] = id.split('|'); return `${r ? nm(r) : '?'} = ${nm(a)} + ${nm(b)}` })()} (base)`), ''] : []),
    ...(conf.length ? ['### Confirmadas (saem do selo "teste")', '', ...conf.map(id => { const [a, b, r] = id.split('|'); return `- ${nm(r)} = ${nm(a)} + ${nm(b)}` }), ''] : []),
    ...(Object.keys(sk).length ? ['### Skills anotadas', '', ...Object.entries(sk).flatMap(([s, o]) => Object.entries(o).map(([k, v]) => `- ${nm(s)}: ${skNome(k, skc)}${v.l != null ? ' · nv ' + v.l : ''} (${v.n} pessoa(s))`)), ''] : []),
    ...(Object.keys(skn).length ? ['### Nomes de skill (PT)', '', ...Object.entries(skn).map(([k, v]) => `- ${skNome(k, skc)} → ${v}`), ''] : []),
    ...(Object.keys(skd).length ? ['### Descrições de skill', '', ...Object.entries(skd).map(([k, v]) => `- ${skNome(k, skc)}: ${v}`), ''] : []),
    ...(Object.keys(per).length ? ['### Dia / noite', '', ...Object.entries(per).map(([k, v]) => `- ${nm(k)} → ${v}`), ''] : []),
    ...(Object.keys(loc).length ? ['### Slimes vistos nos mapas', '', ...Object.entries(loc).map(([mapa, ks]) => `- ${mapa}: ${ks.map(k => k[0] === '-' ? `~~${nm(k.slice(1))}~~ (não nasce aqui)` : nm(k)).join(', ')}`), ''] : []),
    ...(relato.length ? ['### Envios das últimas 24 h', '', ...relato, ''] : []),
    ...(mudou ? ['### Aprovação automática', '', auto
      ? `✅ ${novidades} novidade(s)${removidos ? ` e ${removidos} remoção(ões)` : ''} dentro do padrão da base — **aprovado sozinho**. Se der problema: **Revert** neste PR e coloque o item em \`bloqueios.json\` (senão o próximo merge traz de volta).`
      : '⚠️ **Precisa de revisão** — fora do padrão:', ...barrados.map(b => `- ${b}`), ''] : [])
  ].join('\n');
  fs.writeFileSync(path.join(RAIZ, 'resumo-merge.md'), resumo + '\n');
  console.log(resumo);
  console.log(mudou ? '\ncomunidade.json ATUALIZADO' + (auto ? ' (aprovação automática)' : '') : '\ncomunidade.json sem mudanças');
})().catch(e => { console.error(e.message || e); process.exit(1) });

// ---------- aprovação automática: o que mudou em relação ao comunidade.json atual segue o padrão da base? ----------
function verifica(antes, agora, nm) {
  const normI = s => norm(s || '').replace(/[^a-z0-9]+/g, ' ').trim();
  const ITENS = new Set(D.itens.flatMap(i => [normI(i.en), normI(i.pt), normI(i.k)]));
  const partes = m => { const x = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(m); return x ? [x[1], x[2]] : [m] }; // "PT (EN)"
  const ehItem = m => partes(m).some(p => ITENS.has(normI(p)));
  const NOMES_EN = new Set(D.slimes.flatMap(s => [normI(s.nm), normI(s.sp)]));
  const nivelBase = new Map(); for (const c of D.combos) if (c.r && c.l) (nivelBase.get(c.r) || nivelBase.set(c.r, new Set()).get(c.r)).add(c.l);
  const descCid = id => { const [a, b, r] = id.split('|'); return `${r ? nm(r) : '?'} = ${nm(a)} + ${nm(b)}` };
  const barrados = []; let novidades = 0, removidos = 0;

  const ant = new Map(antes.combos.map(c => [c.id, c])), ids = new Set(agora.combos.map(c => c.id));
  const pend = new Set(PENDENTES.map(c => 'c:' + par(c.a, c.b, c.r)));
  for (const c of agora.combos) {
    const o = ant.get(c.id); if (o && o.m === c.m && o.l === c.l && o.ch === c.ch) continue;
    novidades++;
    if (pend.has(c.id) && c.n === 1) continue; // veio do data.json do repositório (revisado no commit), não de envio
    if (!c.r) { if (c.m && !ehItem(c.m)) barrados.push(`? = ${nm(c.a)} + ${nm(c.b)} (teste): material "${c.m}" não está na lista de itens`); continue } // testada: os slimes já foram conferidos no merge
    const desc = `${nm(c.r)} = ${nm(c.a)} + ${nm(c.b)}`, el = new Set([...K[c.a].el, ...K[c.b].el]);
    if (!K[c.r].el.some(e => el.has(e))) barrados.push(`${desc}: nenhum elemento em comum com os pais`);
    if (c.m && !ehItem(c.m)) barrados.push(`${desc}: material "${c.m}" não está na lista de itens`);
    if (c.l && !(/^\d{1,2}$/.test(c.l) && +c.l >= 1 && +c.l <= 40)) barrados.push(`${desc}: nível "${c.l}" fora do padrão`);
    else if (c.l && nivelBase.has(c.r) && !nivelBase.get(c.r).has(c.l)) barrados.push(`${desc}: nível ${c.l}, a base diz ${[...nivelBase.get(c.r)].join('/')}`);
    if (o && o.ch != null && c.ch != null && Math.abs(o.ch - c.ch) > 25) barrados.push(`${desc}: chance mudaria de ${o.ch}% para ${c.ch}%`);
  }
  removidos += antes.combos.filter(c => !ids.has(c.id) && !baseIdx.has(c.id.slice(2)) && !(c.r == null && PARES_COM_R.has(parT(c.a, c.b)))).length; // as que viraram base e as testadas que ganharam resultado não contam

  for (const [id, v] of Object.entries(agora.pc)) {
    const o = antes.pc[id]; if (o && o.ch === v.ch) continue;
    novidades++; if (o && Math.abs(o.ch - v.ch) > 25) barrados.push(`chance de ${descCid(id)}: mudaria de ${o.ch}% para ${v.ch}%`);
  }
  for (const [k, v] of Object.entries(agora.pt)) {
    const o = antes.pt[k]; if (o === v) continue;
    novidades++;
    if (o) barrados.push(`nome PT de ${nm(k)} trocaria de "${o}" para "${v}"`);
    else if (!/^\p{L}[\p{L} '-]{1,29}$/u.test(v)) barrados.push(`nome PT de ${nm(k)} — "${v}" tem caracteres fora do padrão`);
    else if (NOMES_EN.has(normI(v))) barrados.push(`nome PT de ${nm(k)} — "${v}" é nome de slime em inglês`);
  }
  for (const [k, v] of Object.entries(agora.num)) {
    const o = antes.num[k]; if (o === v) continue;
    novidades++;
    if (o != null) barrados.push(`número de ${nm(k)} trocaria de #${o} para #${v}`);
    else if (v > 300) barrados.push(`número #${v} de ${nm(k)} acima de 300`);
  }
  for (const [mapa, ks] of Object.entries(agora.loc)) { const o = new Set(antes.loc[mapa] || []), n = ks.filter(k => !o.has(k)).length; novidades += n;
    if (n && !MAPAS.has(mapa)) barrados.push(`mapa novo "${mapa}" (nome lido da tela: confira antes de aprovar)`);
    for (const k of ks) if (k[0] === '-' && !o.has(k)) barrados.push(`tirar ${nm(k.slice(1))} de "${mapa}" (corrige a base: confira)`) }
  for (const [mapa, ks] of Object.entries(antes.loc)) { const n = new Set(agora.loc[mapa] || []); removidos += ks.filter(k => !n.has(k)).length }
  novidades += agora.conf.filter(id => !antes.conf.includes(id)).length; // confirmar é sempre ok
  for (const id of agora.apagadas) if (!antes.apagadas.includes(id)) { novidades++; barrados.push(`apagar ${descCid(id)} (confira antes de aprovar)`) }

  // skills: skill da lista, com elemento do slime e nível estável entram sozinhas; skill nova e nome trocado → revisão
  const Sk = require('../skills.js'), lista = [...SKILLS.values()];
  for (const [s, o] of Object.entries(agora.sk)) for (const [k, v] of Object.entries(o)) {
    const a = (antes.sk[s] || {})[k]; if (a && a.l === v.l) continue;
    novidades++;
    const sk = SKILLS.get(k), c = agora.skc.find(x => x.k === k), desc = `skill ${sk ? sk.en : c ? c.nm : k} em ${nm(s)}`;
    if (!sk) { const p = c ? Sk.parecidas(c.nm, lista)[0] : null; barrados.push(`${desc}: skill nova cadastrada (${c ? c.el : '?'})${p ? `, parece com ${p.en}` : ''}: confira`) }
    else if (K[s] && !K[s].el.includes(sk.el)) barrados.push(`${desc}: elemento ${sk.el}, o slime é ${K[s].el.join('/')}`);
    if (a && a.l != null && v.l != null && Math.abs(a.l - v.l) > 10) barrados.push(`${desc}: nível mudaria de ${a.l} para ${v.l}`);
  }
  for (const [s, o] of Object.entries(antes.sk)) for (const k of Object.keys(o)) if (!(agora.sk[s] || {})[k]) removidos++;
  for (const [k, v] of Object.entries(agora.skn)) {
    const o = antes.skn[k]; if (o === v) continue;
    novidades++; const en = (SKILLS.get(k) || {}).en || k;
    if (o) barrados.push(`nome PT da skill ${en} trocaria de "${o}" para "${v}"`);
    else if (!/^\p{L}[\p{L} '-]{1,39}$/u.test(v)) barrados.push(`nome PT da skill ${en} — "${v}" tem caracteres fora do padrão`);
  }
  removidos += Object.keys(antes.skn).filter(k => !(k in agora.skn)).length;
  for (const [k, v] of Object.entries(agora.skd)) { // texto livre: sempre passa pelo Lucas
    const o = antes.skd[k]; if (o === v) continue;
    novidades++; barrados.push(`descrição da skill ${(SKILLS.get(k) || {}).en || k}${o ? ` trocaria de "${o}" para` : ':'} "${v}"`);
  }
  removidos += Object.keys(antes.skd).filter(k => !(k in agora.skd)).length;
  // apelido para um mapa da base entra sozinho; para um nome fora da lista (mapa novo lido da tela), revisão
  for (const [l, v] of Object.entries(agora.mapap)) { if (antes.mapap[l] === v) continue; novidades++; if (!MAPAS.has(v)) barrados.push(`apelido de mapa "${l}" → "${v}": mapa fora da lista, confira`) }
  for (const [k, v] of Object.entries(agora.per)) { const o = antes.per[k]; if (o === v) continue; novidades++; if (o) barrados.push(`dia/noite de ${nm(k)} trocaria de ${o} para ${v}`) }
  for (const n of ['pc', 'pt', 'num', 'per']) removidos += Object.keys(antes[n]).filter(k => !(k in agora[n])).length;
  if (removidos > 3) barrados.push(`${removidos} itens já aprovados sairiam de uma vez`);
  if (novidades > 30) barrados.push(`${novidades} novidades num dia só (limite 30)`);
  return { barrados, novidades, removidos };
}
