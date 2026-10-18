// Mac: assinatura "ad-hoc" (grátis, sem conta de desenvolvedor Apple), aplicada logo depois de montar o .app.
// Sem ela, Macs com chip Apple dizem que o app "está danificado". Não substitui a notarização:
// na primeira abertura o usuário ainda libera em Ajustes do Sistema → Privacidade e Segurança → Abrir mesmo assim.
const { execFileSync } = require('child_process'), path = require('path');
exports.default = async ctx => {
  if (ctx.electronPlatformName !== 'darwin') return; // no Windows não faz nada
  const app = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
  console.log('  • assinatura ad-hoc aplicada em', app);
};
