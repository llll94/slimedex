// Compila leitor-tela.cs -> leitor-tela.exe com o csc do .NET Framework que já vem no Windows (sem instalar nada).
// Roda antes do build (npm run dist). Em outro sistema (Mac) não faz nada: o leitor é só do Windows.
const { execFileSync } = require('child_process'), path = require('path'), fs = require('fs');
if (process.platform !== 'win32') { console.log('leitor-tela: só no Windows, pulando'); process.exit(0) }
const NET = path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319'), WINMD = path.join(process.env.WINDIR || 'C:\\Windows', 'System32', 'WinMetadata');
const csc = path.join(NET, 'csc.exe'), RAIZ = path.join(__dirname, '..');
if (!fs.existsSync(csc)) throw new Error('csc.exe não encontrado em ' + NET);
const refs = ['System.Drawing.dll', 'System.Runtime.dll'].map(r => '/r:' + path.join(NET, r))
  .concat(['Windows.Foundation', 'Windows.Media', 'Windows.Graphics', 'Windows.Globalization', 'Windows.Storage', 'Windows.Security'].map(r => '/r:' + path.join(WINMD, r + '.winmd')));
execFileSync(csc, ['/nologo', '/optimize+', '/target:exe', '/platform:x64', '/out:' + path.join(RAIZ, 'leitor-tela.exe'), ...refs, path.join(RAIZ, 'leitor-tela.cs')], { stdio: 'inherit' });
console.log('leitor-tela.exe ok');
