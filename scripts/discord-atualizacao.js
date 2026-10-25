// Posta nos canais do Discord como mensagem normal (texto com a formatação do Discord + prints anexados), sem a caixa de "embed".
// Os webhooks ficam nos secrets do GitHub (DISCORD_WEBHOOK_ATUALIZACOES, DISCORD_WEBHOOK_DOWNLOAD), nunca no código.
//   node scripts/discord-atualizacao.js versao v2.1.0   -> #atualizações: novidades da versão (novidades.json, em PT) + link
//                                                          + até 4 prints da cartilha anexados (campo prints da versão)
//   node scripts/discord-atualizacao.js download [tag]  -> #download: qual arquivo baixar (Windows, Mac chip Apple, Mac Intel)
//   node scripts/discord-atualizacao.js aviso "texto"   -> aviso avulso
//   node scripts/discord-atualizacao.js apagar <id>     -> apaga uma mensagem que o webhook postou (o id sai no log de cada post)
//   node scripts/discord-atualizacao.js teste           -> mensagem de teste
// Sem DISCORD_WEBHOOK: só mostra o que seria enviado (para conferir localmente).
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..'), REPO = 'llll94/slimedex';
const [tipo, arg] = process.argv.slice(2);
const ICONE = `https://raw.githubusercontent.com/${REPO}/main/icon.png`;
const LIMITE = 2000; // tamanho máximo de uma mensagem normal

// "Skills: anote..." → "**Skills:** anote..." (só quando o começo é um rótulo curto)
const negrito = l => l.replace(/^([^:]{2,30}):\s/, '**$1:** ');

async function versao() {
  const v = String(arg || '').replace(/^v/, '');
  const n = JSON.parse(fs.readFileSync(path.join(RAIZ, 'novidades.json'), 'utf8')).versoes.find(x => x.v === v);
  if (!n) throw new Error('versão ' + v + ' não está no novidades.json');
  const url = `https://github.com/${REPO}/releases/tag/v${v}`;
  const fim = `\n\n**Como atualizar:** abra o Slimedex, ele avisa da versão nova e atualiza sozinho (Windows). No Mac, baixe o arquivo novo no canal de download.\n🔗 <${url}>`;
  let itens = n.pt.map(l => '- ' + negrito(l));
  const monta = () => `# 🆕 Slimedex ${v}\n` + itens.join('\n') + fim;
  while (monta().length > LIMITE && itens.length > 1) itens.pop(); // novidades demais: corta as últimas
  return { content: monta(), arquivos: await prints(v, n.prints) };
}

async function download() {
  const rel = await (await fetch(`https://api.github.com/repos/${REPO}/releases/${arg ? 'tags/' + arg : 'latest'}`, { headers: { 'User-Agent': 'slimedex' } })).json();
  if (!rel.tag_name) throw new Error('release não encontrado');
  const v = rel.tag_name.replace(/^v/, ''), a = re => rel.assets.find(x => re.test(x.name));
  const lk = x => x ? `[${x.name}](<${x.browser_download_url}>)` : '_(ainda não disponível)_'; // <> = sem prévia do link
  const exe = a(/-portable\.exe$/), arm = a(/-mac-arm64\.dmg$/), x64 = a(/-mac-x64\.dmg$/);
  return { content: [
    `# ⬇️ Baixar o Slimedex ${v}`,
    `🪟 **Windows** → ${lk(exe)}`,
    '-# É só abrir, não precisa instalar. Se o Windows avisar, clique em *Mais informações → Executar assim mesmo*.',
    `🍎 **Mac com chip Apple** (M1, M2, M3, M4…) → ${lk(arm)}`,
    `🍎 **Mac com processador Intel** → ${lk(x64)}`,
    '',
    '**Qual é o meu Mac?** Clique na maçã no canto de cima da tela → **Sobre Este Mac**. Se aparecer *Chip Apple M…*, é chip Apple; se aparecer *Processador Intel*, é Intel.',
    '**Primeira vez no Mac:** abra o `.dmg` e arraste o Slimedex para **Aplicativos**. Se o macOS avisar que não pode verificar o app, vá em **Ajustes do Sistema → Privacidade e Segurança** e clique em **Abrir mesmo assim**.',
    '',
    'Depois de instalado, o próprio app avisa quando sair versão nova. Abre e fecha com **Ctrl+Tab** (no Mac, **Control+Tab**).'
  ].join('\n') };
}

// prints da cartilha da própria tag (o post continua mostrando as telas daquela versão), baixados para anexar
async function prints(v, nomes) {
  const ok = [];
  for (const p of (nomes || []).slice(0, 4)) {
    const img = `https://raw.githubusercontent.com/${REPO}/v${v}/guia/pt-${p}.webp`;
    const r = await fetch(img).catch(() => null);
    if (r && r.ok) ok.push({ nome: `${p}.webp`, dados: Buffer.from(await r.arrayBuffer()) }); else console.log('print não encontrado, pulado:', img);
  }
  return ok;
}

async function mensagem() {
  if (tipo === 'versao') return versao();
  if (tipo === 'download') return download();
  if (tipo === 'aviso') { const t = String(arg || '').trim(); if (!t) throw new Error('aviso sem texto'); return { content: t.slice(0, LIMITE) } }
  if (tipo === 'teste') return { content: '✅ Teste do webhook do Slimedex.' };
  throw new Error('tipo desconhecido: ' + tipo);
}

(async () => {
  const hook = process.env.DISCORD_WEBHOOK;
  if (tipo === 'apagar') {
    if (!/^\d{10,25}$/.test(String(arg))) throw new Error('id inválido');
    if (!hook) throw new Error('sem DISCORD_WEBHOOK');
    const r = await fetch(`${hook}/messages/${arg}`, { method: 'DELETE' });
    if (r.status !== 204) throw new Error('Discord respondeu ' + r.status + ': ' + (await r.text()).slice(0, 200));
    return console.log('mensagem apagada:', arg);
  }
  const { arquivos = [], ...m } = await mensagem();
  const corpo = { username: 'Slimedex', avatar_url: ICONE, allowed_mentions: { parse: [] }, ...m }; // sem @everyone/@here acidental
  if (!hook) { console.log('(sem DISCORD_WEBHOOK, não enviado)\n' + corpo.content + '\n' + arquivos.map(a => `[anexo ${a.nome} · ${a.dados.length} bytes]`).join('\n')); return }
  const fd = new FormData();
  fd.append('payload_json', JSON.stringify({ ...corpo, attachments: arquivos.map((a, i) => ({ id: i, filename: a.nome })) }));
  arquivos.forEach((a, i) => fd.append(`files[${i}]`, new Blob([a.dados], { type: 'image/webp' }), a.nome));
  const r = await fetch(hook + '?wait=true', { method: 'POST', body: fd }); // wait=true: devolve a mensagem (com o id)
  if (!r.ok) throw new Error('Discord respondeu ' + r.status + ': ' + (await r.text()).slice(0, 300));
  const id = (await r.json()).id;
  console.log(`enviado (${tipo}) · id da mensagem: ${id}`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Discord (${tipo}): mensagem **${id}** (para apagar: tipo \`apagar\`, valor \`${tipo === 'download' ? 'download:' : ''}${id}\`)\n`);
})().catch(e => { console.error(e.message); process.exit(1) });
