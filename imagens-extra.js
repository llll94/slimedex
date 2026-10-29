// Fotos próprias para slimes cuja imagem da wiki não bate com o jogo (recortadas do jogo, sem fundo, em imagens/).
// Carregado logo depois do data.js: troca a imagem mostrada no app; a da wiki continua valendo como 2ª referência no
// reconhecimento do baú (imWiki).
window.IMG_EXTRA = {
  SL_Cattle_PowerLight: 'imagens/SL_Cattle_PowerLight.png', // Tau: na wiki está a forma com chifres; no jogo ele é a vaquinha sem chifre
};
for (const s of (window.D && D.slimes) || []) if (IMG_EXTRA[s.k]) { s.imWiki = s.im; s.im = IMG_EXTRA[s.k] }
// endereço da imagem: caminho da wiki ("/sprites/...") ou arquivo do próprio app ("imagens/...")
window.urlIm = p => p ? (p[0] === '/' ? 'https://world-of-slime-wiki.vercel.app' + p : p) : null;
