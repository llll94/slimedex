# Slimedex — leitor do nome do mapa (só Windows; só roda com "Slimes do mapa" ligado no ⋯).
# Olha as teclas Tab e Esc sem segurá-las (o jogo continua recebendo normalmente). No Tab, recorta só o bloco
# abaixo do minimapa da janela em primeiro plano, separa o texto azul (região) do branco (mapa) e lê com o OCR
# do próprio Windows. Nada é gravado nem enviado: o resultado vai como uma linha JSON para o Slimedex.
param([int]$pai = 0)
$ErrorActionPreference = 'Stop'
function Manda($o) { [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress)); [Console]::Out.Flush() }
try {
  Add-Type -AssemblyName System.Drawing
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class LeitorTela {
  [DllImport("user32.dll")] static extern short GetAsyncKeyState(int k);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
  public static bool Apertada(int k) { return (GetAsyncKeyState(k) & 0x8000) != 0; }
  public static int[] Janela() { IntPtr h = GetForegroundWindow(); RECT r; GetWindowRect(h, out r); uint pid; GetWindowThreadProcessId(h, out pid);
    return new int[] { r.L, r.T, r.R - r.L, r.B - r.T, (int)pid }; }
  // recorta (x,y,w,h) da tela, amplia 'esc' vezes e grava duas máscaras: texto azul e texto branco em preto sobre branco
  public static void Mascaras(int x, int y, int w, int h, int esc, string azul, string branco) {
    using (var tela = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
      using (var g = Graphics.FromImage(tela)) g.CopyFromScreen(x, y, 0, 0, new Size(w, h));
      using (var big = new Bitmap(w * esc, h * esc, PixelFormat.Format32bppArgb)) {
        using (var g = Graphics.FromImage(big)) { g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic; g.DrawImage(tela, new Rectangle(0, 0, w * esc, h * esc)); }
        var rect = new Rectangle(0, 0, big.Width, big.Height); var d = big.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var px = new byte[d.Stride * big.Height]; Marshal.Copy(d.Scan0, px, 0, px.Length); big.UnlockBits(d);
        var a = new byte[px.Length]; var b = new byte[px.Length];
        for (int i = 0; i < px.Length; i += 4) { int B = px[i], G = px[i + 1], R = px[i + 2];
          bool br = R > 185 && G > 185 && B > 185 && Math.Abs(R - B) < 40, az = B > 170 && G > 120 && B - R > 45;
          byte va = (byte)(az ? 0 : 255), vb = (byte)(br ? 0 : 255);
          a[i] = a[i + 1] = a[i + 2] = va; b[i] = b[i + 1] = b[i + 2] = vb; a[i + 3] = b[i + 3] = 255; }
        Grava(a, big.Width, big.Height, d.Stride, azul); Grava(b, big.Width, big.Height, d.Stride, branco);
      } } }
  static void Grava(byte[] px, int w, int h, int stride, string arq) { using (var bm = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
    var d = bm.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb); Marshal.Copy(px, 0, d.Scan0, px.Length); bm.UnlockBits(d); bm.Save(arq, ImageFormat.Png); } }
}
'@
  [void][LeitorTela]::SetProcessDPIAware()
  $null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
  $null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
  $null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]
  $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
  function Espera($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
  $lang = [Windows.Globalization.Language]::new('pt-BR')
  $ocr = if ([Windows.Media.Ocr.OcrEngine]::IsLanguageSupported($lang)) { [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang) } else { [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages() }
  if (-not $ocr) { Manda @{ ev = 'erro'; msg = 'sem OCR no Windows' }; exit 1 }
  function Le($arq) {
    $f = Espera ([Windows.Storage.StorageFile]::GetFileFromPathAsync($arq)) ([Windows.Storage.StorageFile])
    $s = Espera ($f.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    try { $d = Espera ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($s)) ([Windows.Graphics.Imaging.BitmapDecoder])
      $b = Espera ($d.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
      $r = Espera ($ocr.RecognizeAsync($b)) ([Windows.Media.Ocr.OcrResult]); ($r.Lines | ForEach-Object { $_.Text }) -join ' ' } finally { $s.Dispose() }
  }
  $tmp = Join-Path ([IO.Path]::GetTempPath()) 'slimedex-mapa'; [void](New-Item -ItemType Directory -Force $tmp)
  $fa = Join-Path $tmp 'azul.png'; $fb = Join-Path $tmp 'branco.png'
  $meus = @('Slimedex', 'electron')
  Manda @{ ev = 'pronto'; ocr = $ocr.RecognizerLanguage.LanguageTag }
  $tab = $false; $esc = $false; $volta = 0
  while ($true) {
    Start-Sleep -Milliseconds 20
    if ($pai -and ++$volta % 100 -eq 0 -and -not (Get-Process -Id $pai -ErrorAction SilentlyContinue)) { exit 0 } # o Slimedex fechou
    $t = [LeitorTela]::Apertada(0x09); $e = [LeitorTela]::Apertada(0x1B)
    if ($e -and -not $esc) { # Esc no próprio Slimedex só fecha o painel; os slimes do mapa ficam
      $je = [LeitorTela]::Janela(); $ne = try { (Get-Process -Id $je[4]).ProcessName } catch { '' }
      if ($meus -notcontains $ne) { Manda @{ ev = 'esc' } } }
    # Tab sozinho: com Ctrl (atalho do Slimedex), Alt (Alt+Tab, trocar de janela) ou a tecla Windows, ignora
    $mod = [LeitorTela]::Apertada(0x11) -or [LeitorTela]::Apertada(0x12) -or [LeitorTela]::Apertada(0x5B) -or [LeitorTela]::Apertada(0x5C)
    if ($t -and -not $tab -and -not $mod) {
      $j = [LeitorTela]::Janela()
      $nome = try { (Get-Process -Id $j[4]).ProcessName } catch { '' }
      if ($meus -notcontains $nome -and $j[2] -gt 200 -and $j[3] -gt 200) {
        Manda @{ ev = 'tab-ini' } # avisa já: o Slimedex abre a janelinha enquanto a tela é lida
        $ini = Get-Date
        try {
          # bloco abaixo do minimapa: x 88,5–99,5% e y 16,3–23,8% da janela (medido em prints de 2560x1440)
          [LeitorTela]::Mascaras([int]($j[0] + $j[2] * 0.885), [int]($j[1] + $j[3] * 0.163), [int]($j[2] * 0.11), [int]($j[3] * 0.075), 3, $fa, $fb)
          Manda @{ ev = 'tab'; azul = (Le $fa); branco = (Le $fb); ms = [int]((Get-Date) - $ini).TotalMilliseconds; jogo = $nome }
        } catch { Manda @{ ev = 'erro'; msg = $_.Exception.Message } }
      } else { Manda @{ ev = 'tab-ignorado'; jogo = $nome } }
    }
    $tab = $t; $esc = $e
  }
} catch { Manda @{ ev = 'erro'; msg = $_.Exception.Message }; exit 1 }
