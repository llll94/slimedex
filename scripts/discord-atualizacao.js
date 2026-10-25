// Posta no canal #atualizações do Discord (webhook guardado no secret DISCORD_WEBHOOK_ATUALIZACOES, nunca no código).
//   node scripts/discord-atualizacao.js versao v2.1.0   -> novidades da versão (novidades.json, em PT) + link do release
//                                                          + galeria com até 4 prints da cartilha (campo prints da versão)
//   node scripts/discord-atualizacao.js aviso "texto"   -> aviso avulso
//   node scripts/discord-atualizacao.js teste           -> mensagem de teste
// Sem DISCORD_WEBHOOK: só mostra o que seria enviado (para conferir localmente).
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..'), REPO = 'llll94/slimedex';
const [tipo, arg] = process.argv.slice(2);
const COR = 0x4aa8e8, ICONE = `https://raw.githubusercontent.com/${REPO}/main/icon.png`;

async function mensagem() {
  if (tipo === 'versao') {
    const v = String(arg || '').replace(/^v/, '');
    const n = JSON.parse(fs.readFileSync(path.join(RAIZ, 'novidades.json'), 'utf8')).versoes.find(x => x.v === v);
    if (!n) throw new Error('versão ' + v + ' não está no novidades.json');
    const url = `https://github.com/${REPO}/releases/tag/v${v}`;
    const lista = n.pt.map(l => '• ' + l).join('\n').slice(0, 3800); // limite da descrição do embed: 4096
    return { content: `🆕 **Slimedex ${v}** saiu!`, embeds: [{
      title: `Slimedex ${v} — novidades`, url, color: COR, description: lista,
      fields: [
        { name: 'Como atualizar', value: 'Abra o Slimedex: ele avisa da versão nova e atualiza sozinho (Windows). No Mac, baixe o `.dmg` no link.' },
        { name: 'Download', value: `[Windows e Mac](${url})` }],
      footer: { text: 'Seus dados (combinações, skills, fixados) continuam depois de atualizar.' } }], prints: await prints(v, n.prints) };
  }
  if (tipo === 'aviso') {
    const t = String(arg || '').trim();
    if (!t) throw new Error('aviso sem texto');
    return { embeds: [{ description: t.slice(0, 4000), color: COR }] };
  }
  if (tipo === 'teste') return { content: '✅ Teste do webhook do Slimedex: as atualizações vão aparecer aqui.' };
  throw new Error('tipo desconhecido: ' + tipo);
}

// prints da cartilha da própria tag (o post continua mostrando as telas daquela versão); só os que existem
async function prints(v, nomes) {
  const ok = [];
  for (const p of (nomes || []).slice(0, 4)) {
    const img = `https://raw.githubusercontent.com/${REPO}/v${v}/guia/pt-${p}.webp`;
    const r = await fetch(img, { method: 'HEAD' }).catch(() => null);
    if (r && r.ok) ok.push(img); else console.log('print não encontrado, pulado:', img);
  }
  return ok;
}

(async () => {
  const { prints: imgs = [], ...m } = await mensagem();
  // galeria: embeds com o mesmo url viram um só no Discord, com até 4 imagens
  if (imgs.length && m.embeds && m.embeds[0]) { m.embeds[0].image = { url: imgs[0] }; m.embeds.push(...imgs.slice(1).map(u => ({ url: m.embeds[0].url, image: { url: u } }))) }
  const corpo = { username: 'Slimedex', avatar_url: ICONE, allowed_mentions: { parse: [] }, ...m }; // sem @everyone/@here acidental
  const url = process.env.DISCORD_WEBHOOK;
  if (!url) { console.log('(sem DISCORD_WEBHOOK, não enviado)\n' + JSON.stringify(corpo, null, 2)); return }
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  if (!r.ok) throw new Error('Discord respondeu ' + r.status + ': ' + (await r.text()).slice(0, 300));
  console.log('enviado ao Discord (' + tipo + ')');
})().catch(e => { console.error(e.message); process.exit(1) });
