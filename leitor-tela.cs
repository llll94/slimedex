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
using System.Runtime.CompilerServices;
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
      using (var g = Graphics.FromImage(tela)) { if (arquivo != null) g.DrawImage(arquivo, new Rectangle(0, 0, w, h), new Rectangle(x, y, w, h), GraphicsUnit.Pixel); else g.CopyFromScreen(x, y, 0, 0, new System.Drawing.Size(w, h)); }
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
    Escolhe(OcrLinhas(a, W, H), OcrLinhas(b, W, H), out azul, out branco);
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
  struct Linha { public string T; public double Y0, Y1; }
  static System.Collections.Generic.List<Linha> OcrLinhas(byte[] bgra, int w, int h) {
    var sb = SoftwareBitmap.CreateCopyFromBuffer(CryptographicBuffer.CreateFromByteArray(bgra), BitmapPixelFormat.Bgra8, w, h);
    var r = Espera(ocr.RecognizeAsync(sb)); var l = new System.Collections.Generic.List<Linha>();
    foreach (var ln in r.Lines) { if (ln.Words.Count == 0) continue;
      double y0 = ln.Words.Min(p => p.BoundingRect.Y), y1 = ln.Words.Max(p => p.BoundingRect.Y + p.BoundingRect.Height);
      l.Add(new Linha { T = ln.Text, Y0 = y0, Y1 = y1 }); }
    return l.OrderBy(x => x.Y0).ToList();
  }
  // o bloco do jogo: a linha azul (região) e, coladas logo abaixo, as linhas brancas do nome do mapa. A área lida é maior que o
  // bloco (a interface do jogo não escala igual em toda resolução), então fica de fora o que não é dele: "Tab", "CH 01", ícones
  // e o texto da missão logo abaixo (separado por um espaço maior)
  static bool Lixo(string t) { var u = (t ?? "").Trim(); return u.Length < 3 || u.Equals("Tab", StringComparison.OrdinalIgnoreCase) || u.Count(char.IsLetter) < 3; }
  static void Escolhe(System.Collections.Generic.List<Linha> az, System.Collections.Generic.List<Linha> br, out string azul, out string branco) {
    if (Environment.GetEnvironmentVariable("LEITOR_DEBUG") == "1") { foreach (var x in az) Console.Error.WriteLine("  azul   " + (int)x.Y0 + "-" + (int)x.Y1 + " " + x.T); foreach (var x in br) Console.Error.WriteLine("  branco " + (int)x.Y0 + "-" + (int)x.Y1 + " " + x.T); }
    br = br.Where(x => !Lixo(x.T)).ToList(); az = az.Where(x => !Lixo(x.T)).ToList();
    azul = ""; branco = "";
    // azul: a linha azul que tem uma linha branca logo abaixo (a região fica em cima do nome do mapa)
    foreach (var a in az) {
      double h = Math.Max(1, a.Y1 - a.Y0);
      var lista = br.Where(b => b.Y0 >= a.Y0 + h * 0.5 && b.Y0 <= a.Y1 + h * 1.6).ToList();
      if (lista.Count == 0) continue;
      var nome = new System.Collections.Generic.List<Linha> { lista[0] };
      foreach (var b in br.Where(b => b.Y0 > lista[0].Y0).OrderBy(b => b.Y0)) { var u = nome[nome.Count - 1]; if (b.Y0 - u.Y1 <= (u.Y1 - u.Y0) * 1.6 && nome.Count < 3) nome.Add(b); else break; } // linhas coladas = mesmo nome
      azul = a.T; branco = string.Join(" ", nome.Select(x => x.T)); return;
    }
    // sem a linha azul: as primeiras linhas brancas coladas
    if (br.Count > 0) { var nome = new System.Collections.Generic.List<Linha> { br[0] };
      foreach (var b in br.Skip(1)) { var u = nome[nome.Count - 1]; if (b.Y0 - u.Y1 <= (u.Y1 - u.Y0) * 1.6 && nome.Count < 3) nome.Add(b); else break; }
      branco = string.Join(" ", nome.Select(x => x.T)); }
    if (az.Count > 0) azul = az[0].T;
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
      Le((int)(W * 0.84), (int)(H * 0.12), (int)(W * 0.156), (int)(H * 0.19), 3, out azul, out branco);
      Manda("{\"arquivo\":" + J(System.IO.Path.GetFileName(p)) + ",\"azul\":" + J(azul) + ",\"branco\":" + J(branco) + ",\"ms\":" + sw.ElapsedMilliseconds + "}");
    }
    return 0;
  }
  // baú: atalhos com o jogo em primeiro plano — X abre/fecha o baú, V fecha, Ctrl+X captura. Só olha essas teclas (sem
  // segurar: o jogo continua recebendo); com Alt, Shift (no Ctrl+X) ou a tecla Windows não conta; no próprio Slimedex quem
  // cuida é o painel. Também avisa quando o botão esquerdo do mouse é apertado (sem posição: o Slimedex confere onde está o
  // cursor), para fechar o baú com um clique fora dele
  static int Teclas(string[] args) {
    int pai = 0; for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "-pai") int.TryParse(args[i + 1], out pai);
    Console.OutputEncoding = new UTF8Encoding(false);
    bool x = false, v = false, m = false; int volta = 0;
    while (true) {
      Thread.Sleep(25);
      if (pai != 0 && ++volta % 80 == 0) { try { Process.GetProcessById(pai); } catch { return 0; } } // o Slimedex fechou
      bool ax = Apertada(0x58), av = Apertada(0x56), ctrl = Apertada(0x11), outro = Apertada(0x12) || Apertada(0x5B) || Apertada(0x5C);
      string k = null;
      if (((ax && !x) || (av && !v)) && !ctrl && !outro) k = ax && !x ? "x" : "v";
      else if (ax && !x && ctrl && !outro && !Apertada(0x10)) k = "cx";
      if (k != null) {
        string nome = NomeDe(Janela()[4]);
        if (nome.IndexOf("slime", StringComparison.OrdinalIgnoreCase) >= 0 && !Meus.Contains(nome)) Manda("{\"ev\":\"tecla\",\"k\":\"" + k + "\"}");
      }
      bool am = Apertada(0x01); if (am && !m) Manda("{\"ev\":\"clique\"}");
      x = ax; v = av; m = am;
    }
  }
  // baú: para cada recorte (o rodapé de uma carta), o texto escuro ("LV12" azul-marinho) vira preto no branco, ampliado 3×, e vai pro OCR
  static int Niveis(string[] a) {
    Console.OutputEncoding = new UTF8Encoding(false);
    ocr = OcrEngine.TryCreateFromLanguage(new Language("pt-BR")) ?? OcrEngine.TryCreateFromUserProfileLanguages();
    var l = new System.Collections.Generic.List<string>();
    using (var img = new Bitmap(a[0])) foreach (var r in a.Skip(1)) {
      var n = r.Split(',').Select(int.Parse).ToArray(); string t;
      try { t = Escuro(img, n[0], n[1], n[2], n[3]); } catch { t = ""; }
      l.Add(t);
    }
    Manda("{\"niveis\":[" + string.Join(",", l.Select(J)) + "]}");
    return 0;
  }
  static string Escuro(Bitmap img, int x, int y, int w, int h) {
    int esc = 3, W = w * esc, H = h * esc; byte[] px;
    using (var big = new Bitmap(W, H, PixelFormat.Format32bppArgb)) {
      using (var g = Graphics.FromImage(big)) { g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic; g.DrawImage(img, new Rectangle(0, 0, W, H), new Rectangle(x, y, w, h), GraphicsUnit.Pixel); }
      var d = big.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      px = new byte[W * H * 4];
      for (int lin = 0; lin < H; lin++) Marshal.Copy(d.Scan0 + lin * d.Stride, px, lin * W * 4, W * 4);
      big.UnlockBits(d);
    }
    for (int i = 0; i < px.Length; i += 4) { byte v = (byte)((px[i] + px[i + 1] + px[i + 2]) / 3 < 120 ? 0 : 255); px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255; }
    return Ocr(px, W, H);
  }
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] static extern bool AttachThreadInput(uint de, uint para, bool liga);
  [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte sc, uint f, UIntPtr e);
  [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
  // Ctrl+Tab com o jogo em primeiro plano: o Windows trava a troca de janela ativa (o cursor pisca no Slimedex mas as teclas vão pro jogo).
  // Junta a entrada desta thread à da janela da frente para poder passar o primeiro plano; se ainda falhar, um toque de Alt libera a trava
  static int Foco(IntPtr h) {
    for (int t = 0; t < 2 && GetForegroundWindow() != h; t++) {
      if (t == 1) { keybd_event(0x12, 0, 0, UIntPtr.Zero); keybd_event(0x12, 0, 2, UIntPtr.Zero); }
      uint pid, frente = GetWindowThreadProcessId(GetForegroundWindow(), out pid), eu = GetCurrentThreadId();
      bool junto = frente != 0 && frente != eu && AttachThreadInput(eu, frente, true);
      BringWindowToTop(h); SetForegroundWindow(h);
      if (junto) AttachThreadInput(eu, frente, false);
      Thread.Sleep(30);
    }
    return GetForegroundWindow() == h ? 0 : 1;
  }
  // Main só despacha: o modo -foco não pode esperar o .NET carregar o OCR (o JIT de Leitor carrega o WinRT)
  static int Main(string[] args) {
    int ifo = Array.IndexOf(args, "-foco"); long hw; // leitor-tela.exe -foco <hwnd>
    if (ifo >= 0) return ifo + 1 < args.Length && long.TryParse(args[ifo + 1], out hw) ? Foco(new IntPtr(hw)) : 2;
    if (Array.IndexOf(args, "-teclas") >= 0) return Teclas(args); // baú: atalhos X/V (sem OCR)
    return Leitor(args);
  }
  [MethodImpl(MethodImplOptions.NoInlining)]
  static int Leitor(string[] args) {
    int pai = 0; for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "-pai") int.TryParse(args[i + 1], out pai);
    int ia = Array.IndexOf(args, "-arquivo"); // teste: leitor-tela.exe -arquivo print1.png print2.png ...
    if (ia >= 0) return Teste(args.Skip(ia + 1).ToArray());
    int inv = Array.IndexOf(args, "-niveis"); // baú: leitor-tela.exe -niveis print.png x,y,w,h x,y,w,h ...
    if (inv >= 0) return Niveis(args.Skip(inv + 1).ToArray());
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
              // canto de cima à direita, em volta do bloco abaixo do minimapa: x 84–99,6% e y 12–31% da janela (o bloco muda de lugar
              // conforme a resolução: em 1080p a interface fica ~0,81 do 2K, não 0,75); Escolhe separa o bloco do resto
              string azul, branco;
              Le((int)(j[0] + j[2] * 0.84), (int)(j[1] + j[3] * 0.12), (int)(j[2] * 0.156), (int)(j[3] * 0.19), 3, out azul, out branco);
              Manda("{\"ev\":\"tab\",\"azul\":" + J(azul) + ",\"branco\":" + J(branco) + ",\"ms\":" + sw.ElapsedMilliseconds + ",\"jogo\":" + J(nome) + "}");
            } catch (Exception ex) { Manda("{\"ev\":\"erro\",\"msg\":" + J(ex.GetBaseException().Message) + "}"); }
          } else Manda("{\"ev\":\"tab-ignorado\",\"jogo\":" + J(nome) + "}");
        }
        tab = t; esc = e;
      }
    } catch (Exception ex) { Manda("{\"ev\":\"erro\",\"msg\":" + J(ex.GetBaseException().Message) + "}"); return 1; }
  }
}
