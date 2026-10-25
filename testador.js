// Testador de combinações: estima o resultado de slime A + slime B (+ material) a partir das combinações conhecidas.
// Sem DOM nem Electron: o overlay usa window.Testador, os testes rodam no Node (require).
// Regras tiradas da base: o resultado quase sempre tem elemento em comum com os pais (99%) e quase sempre só elementos
// dos pais (87%); às vezes repete a espécie (21%); quase nunca é um dos pais nem sobe de tier; resultado já conhecido é mais provável.
(function (g) {
  const P = { el: 1, todos: 1, especie: 1, pai: 2, freq: 1, tier: 1, mat: 2, T: 0.55 }; // pesos e temperatura do softmax: T calibrado para a chance média do 1º ficar perto da taxa real de acerto (scripts/testa-testador.js)

  // a, b: slimes ({k, el, sp, st}); slimes: todos; combos: conhecidas com resultado ({r, m}); m: material digitado (opcional)
  // matK: material -> chave comparável (o mesmo material aparece em PT, EN ou "PT (EN)")
  function estimar(a, b, slimes, combos, m, matK) {
    if (!a || !b) return [];
    const k = matK || (x => (x || '').toString().trim().toLowerCase());
    const pais = new Set([...a.el, ...b.el]), freq = {}, porMat = {};
    for (const c of combos) {
      if (!c.r) continue;
      freq[c.r] = (freq[c.r] || 0) + 1;
      if (c.m) (porMat[k(c.m)] = porMat[k(c.m)] || new Set()).add(c.r);
    }
    const mat = m ? porMat[k(m)] : null, stMax = Math.max(a.st || 0, b.st || 0);
    const l = [];
    for (const r of slimes) {
      const com = r.el.filter(e => pais.has(e)).length;
      if (!com) continue; // nenhum elemento em comum: fora
      let s = P.el * com;
      if (r.el.every(e => pais.has(e))) s += P.todos;
      if (r.sp === a.sp || r.sp === b.sp) s += P.especie;
      if (r.k === a.k || r.k === b.k) s -= P.pai;
      s += P.freq * Math.log1p(freq[r.k] || 0);
      if ((r.st || 0) > stMax) s -= P.tier;
      if (mat && mat.has(r.k)) s += P.mat;
      l.push({ k: r.k, s });
    }
    l.sort((x, y) => y.s - x.s);
    const top = l.length ? l[0].s : 0, soma = l.reduce((t, x) => t + Math.exp((x.s - top) / P.T), 0);
    for (const x of l) x.p = Math.exp((x.s - top) / P.T) / soma; // chance estimada (0–1)
    return l;
  }

  const api = { estimar, P };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.Testador = api;
})(typeof window !== 'undefined' ? window : this);
