// Skills: busca e semelhança de nomes (puro: funciona no Node e no navegador).
// A pessoa digita o nome como aparece no jogo em PT ("Barreira Aquática") e a base tem o nome
// da wiki em inglês ("Aqua Barrier"): cada palavra vira um "sentido" comum (água → water,
// barreira → barrier) e a ordem das palavras não importa.
(function () {
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  // grupos de palavras com o mesmo sentido; o 1º é o sentido
  const GRUPOS = [
    'water agua aqua aquatica aquatico hidro hydro', 'fire fogo flame chama chamas igneo flamejante', 'ice gelo glacial congelante frost',
    'ground terra earth rocha rock pedra stone terrestre', 'wind vento ar aereo air', 'grass grama folha leaf planta plant erva floral',
    'poison veneno toxico venenoso toxic', 'light luz sagrado holy divino divine luminoso', 'dark sombrio sombra trevas shadow escuro',
    'steel metal aco ferro iron metalico metallic', 'electric eletrico raio thunder trovao lightning volt eletrica', 'magic magia mistico mystic arcano magico',
    'power poder forca force', 'heal cura curar', 'dash investida avanco arrancada', 'barrier barreira', 'shield escudo', 'claw garra garras',
    'blade lamina', 'ball bola', 'orb orbe esfera', 'cutter corte cortador cut', 'wave onda', 'vortex vortice redemoinho', 'pillar pilar coluna',
    'dome domo cupula', 'shot tiro disparo', 'rain chuva', 'drain dreno drenar', 'quake terremoto tremor', 'blizzard nevasca', 'tempest tempestade storm',
    'swing giro balanco', 'smash esmagar golpe', 'prison prisao', 'trap armadilha', 'crystal cristal', 'needle agulha espinho', 'boomerang bumerangue',
    'dance danca', 'crescent crescente meia lua', 'bang explosao estouro', 'pulse pulso', 'discharge descarga', 'shock choque', 'step passo',
    'dive mergulho diving mergulhar', 'fly voo voar', 'swim nadar nado', 'dig cavar', 'ride montaria montar', 'aura', 'cross cruz', 'sonic sonico',
    'boom estrondo', 'flash clarao', 'spread espalhar', 'slide deslize', 'scatter dispersar', 'volley saraivada rajada', 'breath sopro bafo',
    'upper uppercut gancho', 'drive impulso', 'burst rajada', 'bless bencao', 'energy energia', 'spike espeto', 'tunnel tunel', 'shatter despedacar',
  ];
  const SENTIDO = {};
  GRUPOS.forEach(g => { const p = g.split(' '); p.forEach(w => SENTIDO[w] = p[0]) });
  const VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'of', 'the', 'a', 'o', 'e', 'and', 'especialidade', 'speciality', 'specialty']);
  const EL = { water: 'Água', fire: 'Fogo', ice: 'Gelo', ground: 'Terra', wind: 'Vento', grass: 'Grama', poison: 'Veneno', light: 'Luz', dark: 'Sombrio', steel: 'Metal', electric: 'Elétrico', magic: 'Magia', power: 'Poder' };

  // distância de edição (erro de digitação)
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    let p = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const c = [i];
      for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = c;
    }
    return p[b.length];
  }
  // palavra → sentido; se não conhece, tenta achar um sentido com 1–2 letras de diferença
  function sentido(w) {
    if (SENTIDO[w]) return SENTIDO[w];
    if (w.length >= 5) { const lim = w.length >= 8 ? 2 : 1; for (const k in SENTIDO) if (k.length >= 4 && lev(w, k) <= lim) return SENTIDO[k] }
    return w;
  }
  const sentidos = s => [...new Set(norm(s).split(' ').filter(w => w && !VAZIAS.has(w)).map(sentido))];
  const parecido = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && lev(a, b) <= (Math.min(a.length, b.length) >= 7 ? 2 : 1));

  // 0..1: quanto os nomes batem (palavras em comum pelo sentido, sem ordem)
  function semelhanca(a, b) {
    const A = sentidos(a), B = sentidos(b);
    if (!A.length || !B.length) return 0;
    let n = 0; const usado = new Set();
    for (const x of A) { const i = B.findIndex((y, j) => !usado.has(j) && parecido(x, y)); if (i >= 0) { usado.add(i); n++ } }
    return n / Math.max(A.length, B.length);
  }
  // nomes de uma skill para comparar: inglês, PT da wiki, PT da comunidade, PT da pessoa
  const nomes = (s, pt) => [s.en, s.pw, s.nm, pt && pt[s.k]].filter(Boolean);

  // skills que parecem com o nome digitado (para "é essa?" no cadastro)
  function parecidas(nome, lista, pt, min = 0.5) {
    return lista.map(s => ({ s, p: Math.max(...nomes(s, pt).map(n => semelhanca(nome, n))) }))
      .filter(x => x.p >= min).sort((a, b) => b.p - a.p).map(x => x.s);
  }
  // busca da lista: pedaço do nome primeiro, depois todas as palavras começando o nome, depois semelhança
  // (semelhança fraca só aparece quando não tem nada melhor: "aqua barr" não traz todas as Aqua)
  function busca(q, lista, pt) {
    const n = norm(q), qw = n.split(' ');
    if (!n) return lista.slice();
    const r = [];
    for (const s of lista) {
      const ns = nomes(s, pt).map(norm);
      let p = 0;
      if (ns.some(x => x.startsWith(n) || x.split(' ').some(w => w.startsWith(n)))) p = 3;
      else if (qw.length > 1 && ns.some(x => { const ws = x.split(' '); return qw.every(q => ws.some(w => w.startsWith(q))) })) p = 2.5;
      else if (ns.some(x => x.includes(n)) || (qw.length === 1 && EL[sentido(n)] === s.el)) p = 2; // "água" também acha todas de Água
      else { const m = Math.max(...ns.map(x => semelhanca(n, x))); if (m >= 0.5) p = 1 + m * 0.9 }
      if (p) r.push({ s, p });
    }
    const melhor = Math.max(0, ...r.map(x => x.p)), corte = Math.min(melhor, 1.6);
    return r.filter(x => x.p >= corte).sort((a, b) => b.p - a.p).map(x => x.s);
  }
  // elemento sugerido pelo nome ("Barreira Aquática" → Água)
  function elementoDe(nome) { for (const w of sentidos(nome)) if (EL[w]) return EL[w]; return '' }

  const api = { norm, semelhanca, parecidas, busca, elementoDe };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else window.Skills = api;
})();
