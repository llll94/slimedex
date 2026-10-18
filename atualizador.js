// Atualização do Slimedex a partir dos releases do GitHub. Sem Electron (dá para testar só com Node).
// Windows (.exe portátil): baixa o .exe novo para a mesma pasta, confere o SHA-256 informado pelo GitHub e
// o main reinicia nele. Mac: só avisa (a Apple não deixa app sem assinatura paga se atualizar sozinho).
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const NOME = /^Slimedex-(\d+\.\d+\.\d+)-portable\.exe$/;                       // só aceita o .exe portátil oficial
const DOWNLOAD = /^https:\/\/github\.com\/llll94\/slimedex\/releases\/download\//; // e só baixa do próprio repo
const PAGINA = 'https://github.com/llll94/slimedex/releases/latest';

// compara "1.10.0" com "1.9.2" numericamente; > 0 se a for mais nova
function compara(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}

// consulta o último release; devolve null se não houver versão mais nova
async function verificar(url, atual, plataforma) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Slimedex', Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const rel = await r.json();
  if (!rel || rel.draft || rel.prerelease) return null;
  const versao = String(rel.tag_name || '').replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(versao) || compara(versao, atual) <= 0) return null;
  const pagina = /^https:\/\/github\.com\/llll94\/slimedex\//.test(rel.html_url || '') ? rel.html_url : PAGINA;
  let arquivo = null;
  if (plataforma === 'win32') {
    const a = (rel.assets || []).find(x => NOME.test(x.name));
    if (a && /^sha256:[0-9a-f]{64}$/.test(a.digest || '') && DOWNLOAD.test(a.browser_download_url || ''))
      arquivo = { nome: a.name, url: a.browser_download_url, sha256: a.digest.slice(7), tamanho: a.size || 0 };
  }
  return { versao, pagina, arquivo };
}

// baixa para <pasta>/<nome>.part conferindo o SHA-256 enquanto baixa; só renomeia se bater
async function baixar(arq, pasta, progresso) {
  if (!arq || !NOME.test(arq.nome) || !DOWNLOAD.test(arq.url) || !/^[0-9a-f]{64}$/i.test(arq.sha256)) throw new Error('arquivo inválido');
  const destino = path.join(pasta, arq.nome), tmp = destino + '.part';
  const r = await fetch(arq.url, { headers: { 'User-Agent': 'Slimedex' } });
  if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
  const total = +r.headers.get('content-length') || arq.tamanho, hash = crypto.createHash('sha256'), out = fs.createWriteStream(tmp);
  let feito = 0, ultimo = -1;
  try {
    for await (const parte of r.body) {
      hash.update(parte); feito += parte.length;
      if (!out.write(parte)) await new Promise(ok => out.once('drain', ok));
      const p = total ? Math.min(100, Math.floor(feito * 100 / total)) : 0;
      if (p !== ultimo) { ultimo = p; if (progresso) progresso(p) }
    }
    await new Promise((ok, erro) => out.end(e => (e ? erro(e) : ok())));
  } catch (e) { out.destroy(); fs.rmSync(tmp, { force: true }); throw e }
  if (hash.digest('hex') !== arq.sha256.toLowerCase()) { fs.rmSync(tmp, { force: true }); throw new Error('o arquivo baixado não confere (SHA-256)') }
  fs.renameSync(tmp, destino);
  return destino;
}

// depois de atualizar: apaga o .exe antigo (só se for um Slimedex portátil na mesma pasta do novo)
function removerAntigo(antigo, atual, tentativas = 20) {
  if (!antigo || !atual || !NOME.test(path.basename(antigo))) return false;
  const a = path.resolve(antigo), b = path.resolve(atual);
  if (a === b || path.dirname(a) !== path.dirname(b)) return false;
  const tenta = n => { try { fs.rmSync(a, { force: true }) } catch { if (n > 0) setTimeout(() => tenta(n - 1), 1500) } }; // o antigo pode ficar preso alguns segundos
  setTimeout(() => tenta(tentativas), 2000);
  return true;
}

module.exports = { compara, verificar, baixar, removerAntigo, NOME };
