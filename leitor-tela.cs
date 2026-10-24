// Slimedex — leitor do nome do mapa (só Windows; só roda com "Slimes do mapa" ligado no ⋯).
// Mesma lógica do antigo leitor-tela.ps1, compilado (csc do .NET Framework que já vem no Windows): bem mais leve.
// Olha as teclas Tab e Esc sem segurá-las (o jogo continua recebendo normalmente). No Tab, recorta só o bloco
// abaixo do minimapa da janela em primeiro plano, separa o texto azul (região) do branco (mapa) e lê com o OCR
// do próprio Windows, direto da memória. Nada é gravado nem enviado: o resultado vai como uma linha JSON para o Slimedex.
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using Windows.Globalization;
using Windows.Graphics.Imaging;
using Windows.Foundation;
using Windows.Media.Ocr;
using Windows.Security.Cryptography;

static class LeitorTela {
  [DllImport("user32.dll")] static extern short GetAsyncKeyState(int k);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }

  static OcrEngine ocr;
  static readonly string[] Meus = { "Slimedex", "electron" }; // Tab/Esc no próprio Slimedex não contam

  static bool Apertada(int k) { return (GetAsyncKeyState(k) & 0x8000) != 0; }
  static int[] Janela() {
    IntPtr h = GetForegroundWindow(); RECT r; GetWindowRect(h, out r); uint pid; GetWindowThreadProcessId(h, out pid);
    return new[] { r.L, r.T, r.R - r.L, r.B - r.T, (int)pid };
  }
  static string NomeDe(int pid) { try { return Process.GetProcessById(pid).ProcessName; } catch { return ""; } }

  static void Manda(string json) { Console.Out.WriteLine(json); Console.Out.Flush(); }
  static string J(string s) {
    var b = new StringBuilder("\"");
    foreach (char c in s ?? "") { if (c == '"' || c == '\\') b.Append('\\').Append(c); else if (c < 32) b.AppendFormat("\\u{0:x4}", (int)c); else b.Append(c); }
    return b.Append('"').ToString();
  }

  // recorta (x,y,w,h) da tela, amplia 'esc' vezes e devolve o texto azul e o branco (OCR de cada máscara)
  static Bitmap arquivo; // só no teste (-arquivo): recorta de um print em vez da tela
  static void Le(int x, int y, int w, int h, int esc, out string azul, out string branco) {
    int W = w * esc, H = h * esc; byte[] px;
    using (var tela = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
      using (var g = Graphics.FromImage(tela)) { if (arquivo != null) g.DrawImage(arquivo, new Rectangle(0, 0, w, h), new Rectangle(x, y, w, h), GraphicsUnit.Pixel); else g.CopyFromScreen(x, y, 0, 0, new Size(w, h)); }
      using (var big = new Bitmap(W, H, PixelFormat.Format32bppArgb)) {
        using (var g = Graphics.FromImage(big)) { g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic; g.DrawImage(tela, new Rectangle(0, 0, W, H)); }
        var d = big.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        px = new byte[W * H * 4];
        for (int lin = 0; lin < H; lin++) Marshal.Copy(d.Scan0 + lin * d.Stride, px, lin * W * 4, W * 4);
        big.UnlockBits(d);
      }
    }
    var a = new byte[px.Length]; var b = new byte[px.Length];
    for (int i = 0; i < px.Length; i += 4) {
      int B = px[i], G = px[i + 1], R = px[i + 2];
      bool br = R > 185 && G > 185 && B > 185 && Math.Abs(R - B) < 40, az = B > 170 && G > 120 && B - R > 45;
      byte va = (byte)(az ? 0 : 255), vb = (byte)(br ? 0 : 255);
      a[i] = a[i + 1] = a[i + 2] = va; b[i] = b[i + 1] = b[i + 2] = vb; a[i + 3] = b[i + 3] = 255;
    }
    azul = Ocr(a, W, H); branco = Ocr(b, W, H);
  }
  // espera uma operação do Windows terminar (sem as extensões .AsTask(), que pedem o SDK do Windows para compilar)
  static T Espera<T>(IAsyncOperation<T> op) {
    using (var fim = new ManualResetEventSlim(false)) {
      op.Completed = (o, s) => fim.Set();
      fim.Wait();
      if (op.Status != AsyncStatus.Completed) throw op.ErrorCode ?? new Exception("OCR: " + op.Status);
      return op.GetResults();
    }
  }
  static string Ocr(byte[] bgra, int w, int h) {
    var sb = SoftwareBitmap.CreateCopyFromBuffer(CryptographicBuffer.CreateFromByteArray(bgra), BitmapPixelFormat.Bgra8, w, h);
    var r = Espera(ocr.RecognizeAsync(sb));
    return string.Join(" ", r.Lines.Select(l => l.Text));
  }

  static int Teste(string[] prints) {
    Console.OutputEncoding = new UTF8Encoding(false);
    ocr = OcrEngine.TryCreateFromLanguage(new Language("pt-BR")) ?? OcrEngine.TryCreateFromUserProfileLanguages();
    foreach (var p in prints) using (arquivo = new Bitmap(p)) {
      int W = arquivo.Width, H = arquivo.Height; string azul, branco; var sw = Stopwatch.StartNew();
      Le((int)(W * 0.885), (int)(H * 0.163), (int)(W * 0.11), (int)(H * 0.075), 3, out azul, out branco);
      Manda("{\"arquivo\":" + J(System.IO.Path.GetFileName(p)) + ",\"azul\":" + J(azul) + ",\"branco\":" + J(branco) + ",\"ms\":" + sw.ElapsedMilliseconds + "}");
    }
    return 0;
  }
  static int Main(string[] args) {
    int pai = 0; for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "-pai") int.TryParse(args[i + 1], out pai);
    int ia = Array.IndexOf(args, "-arquivo"); // teste: leitor-tela.exe -arquivo print1.png print2.png ...
    if (ia >= 0) return Teste(args.Skip(ia + 1).ToArray());
    Console.OutputEncoding = new UTF8Encoding(false);
    try {
      SetProcessDPIAware();
      var lang = new Language("pt-BR");
      ocr = OcrEngine.IsLanguageSupported(lang) ? OcrEngine.TryCreateFromLanguage(lang) : OcrEngine.TryCreateFromUserProfileLanguages();
      if (ocr == null) { Manda("{\"ev\":\"erro\",\"msg\":\"sem OCR no Windows\"}"); return 1; }
      Manda("{\"ev\":\"pronto\",\"ocr\":" + J(ocr.RecognizerLanguage.LanguageTag) + "}");
      bool tab = false, esc = false; int volta = 0;
      while (true) {
        Thread.Sleep(20);
        if (pai != 0 && ++volta % 100 == 0) { try { Process.GetProcessById(pai); } catch { return 0; } } // o Slimedex fechou
        bool t = Apertada(0x09), e = Apertada(0x1B);
        if (e && !esc && !Meus.Contains(NomeDe(Janela()[4]))) Manda("{\"ev\":\"esc\"}"); // Esc no próprio Slimedex só fecha o painel
        // Tab sozinho: com Ctrl (atalho do Slimedex), Alt (Alt+Tab, trocar de janela) ou a tecla Windows, ignora
        bool mod = Apertada(0x11) || Apertada(0x12) || Apertada(0x5B) || Apertada(0x5C);
        if (t && !tab && !mod) {
          var j = Janela(); string nome = NomeDe(j[4]);
          if (!Meus.Contains(nome) && j[2] > 200 && j[3] > 200) {
            Manda("{\"ev\":\"tab-ini\"}"); // avisa já: o Slimedex abre a janelinha enquanto a tela é lida
            var sw = Stopwatch.StartNew();
            try {
              // bloco abaixo do minimapa: x 88,5–99,5% e y 16,3–23,8% da janela (medido em prints de 2560x1440)
              string azul, branco;
              Le((int)(j[0] + j[2] * 0.885), (int)(j[1] + j[3] * 0.163), (int)(j[2] * 0.11), (int)(j[3] * 0.075), 3, out azul, out branco);
              Manda("{\"ev\":\"tab\",\"azul\":" + J(azul) + ",\"branco\":" + J(branco) + ",\"ms\":" + sw.ElapsedMilliseconds + ",\"jogo\":" + J(nome) + "}");
            } catch (Exception ex) { Manda("{\"ev\":\"erro\",\"msg\":" + J(ex.GetBaseException().Message) + "}"); }
          } else Manda("{\"ev\":\"tab-ignorado\",\"jogo\":" + J(nome) + "}");
        }
        tab = t; esc = e;
      }
    } catch (Exception ex) { Manda("{\"ev\":\"erro\",\"msg\":" + J(ex.GetBaseException().Message) + "}"); return 1; }
  }
}
