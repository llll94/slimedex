<p align="center"><img src="icon.png" width="96" alt=""></p>

# Slimedex

[![VirusTotal 1/57](https://img.shields.io/badge/VirusTotal-1%2F57_%28falso_positivo%29-brightgreen?logo=virustotal&logoColor=white)](https://www.virustotal.com/gui/file/3912cbaa628b15536972dd06877315c178444129a431e68990c5ef40343478cb/detection)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)

Overlay para Windows e macOS com a Slimepédia do **World of Slime** sempre à mão, por cima do jogo: busca rápida, onde cada slime nasce, como obter (combinações com % de chance), em que ele é usado e as vantagens de elemento — e deixa você cadastrar suas próprias descobertas.

> Projeto de fã, sem vínculo com os desenvolvedores do jogo. Dados e imagens vêm da [World of Slime Wiki](https://world-of-slime-wiki.vercel.app).

## Como usar

1. Baixe na aba [Releases](../../releases):
   - **Windows:** `Slimedex-x.y.z-portable.exe` — é só executar, não precisa instalar;
   - **macOS:** `Slimedex-x.y.z-mac-arm64.dmg` (Mac com chip Apple, M1 em diante) ou `Slimedex-x.y.z-mac-x64.dmg` (Mac Intel) — abra o .dmg e arraste o Slimedex para Aplicativos.
2. Um ícone de livro aparece no canto da tela, sempre por cima das outras janelas.

| Ação | Como |
|---|---|
| Abrir / fechar | **Ctrl+Tab** (de qualquer lugar) ou clique no ícone |
| Buscar | digite o nome, número, elemento ou local |
| Navegar | **↓ / ↑** e **Enter** para abrir a ficha |
| Voltar | tecla **V**, botão **voltar do mouse** ou **← voltar** |
| Fechar | **Esc**, **Ctrl+Tab** ou clique fora do painel |
| Mover o ícone | arraste (a posição é lembrada) |
| Dicas e idioma | botão **i** ao lado da busca — atalhos, recursos e **idioma (Português / English)** |
| Limpar a busca | **×** dentro do campo |
| Sair | botão direito no ícone da bandeja → **Sair** |

Com a busca vazia aparecem as 3 últimas fichas abertas e a lista completa.

### Na ficha de cada slime

- **Como obter** — combinações ordenadas pela maior chance, com selo de % (ex.: `~70%`). Clique no selo para editar a chance.
- **Usado em** — combinações em que ele é ingrediente.
- **Elementos** (seção recolhível) — contra quais elementos o ataque dele é forte/fraco e de quais ele toma mais/menos dano.
- **＋ Nova combinação** — cadastra uma combinação que você descobriu (resultado, slimes, material, nível e chance), com sugestões de nomes e dos materiais.
- **✎ nome em PT-BR** — dá um nome em português ao slime; a busca passa a achar pelos dois.

### Seus dados (botão ⋯)

O que você cadastra fica **só no seu PC**, separado da base do app, em `%APPDATA%\slime-overlay\meus-dados.json`, e não se perde ao atualizar o `.exe`. Pelo botão **⋯** dá para:

- **Importar CSV** no formato da planilha da comunidade (`Result, ID, Level, Slime 1, Slime 2, Material, Chance`) — combinações que já existem não duplicam, só ganham a chance se estiver faltando;
- **Exportar** suas combinações em CSV (mesmo formato) ou fazer backup de tudo em JSON, e **importar** de volta.

### Atualizações

A partir da 1.5.0 o Slimedex confere de hora em hora se há novidades e avisa no **rodapé do painel** (e com uma bolinha verde no ícone):

- **versão nova:** mostra o que mudou (inclusive das versões puladas) e pede confirmação; no Windows ele baixa o `.exe` novo para a mesma pasta, **confere o SHA-256 informado pelo GitHub**, reinicia na versão nova e apaga a antiga — o progresso aparece num anel com porcentagem no ícone. No Mac o botão abre a página de download;
- **base nova da comunidade:** um clique reinicia o app já com as combinações novas;
- se houver as duas ao mesmo tempo, você escolhe qual fazer.

O que mudou em cada versão, escrito para quem joga, fica em [`novidades.json`](novidades.json); os detalhes técnicos ficam na descrição de cada release.

### Base colaborativa

Em **⋯ → Enviar minhas descobertas** você manda suas combinações, chances, votos 👍/👎 e nomes em PT-BR para a base da comunidade. Uma vez por dia, um processo automático ([`scripts/merge-comunidade.js`](scripts/merge-comunidade.js), rodando no GitHub Actions) consolida os envios em [`comunidade.json`](comunidade.json), que o app baixa ao abrir:

- uma **combinação nova** entra a partir do primeiro envio, depois de revisada (aparece com o selo *comunidade* e o número de pessoas que a enviaram);
- a **chance** vira a mediana dos relatos;
- um **nome em PT-BR** entra com o nome mais usado;
- o **número do slime** (para os que não têm na base) entra com o número mais enviado — número que já é de outro slime é descartado;
- os **votos** viram placar; combinação com muitos 👎 é marcada como *contestada* (e, se for da comunidade, sai da base) — é assim que dados errados são corrigidos;
- cada atualização passa por um Pull Request revisado antes de valer.

**Privacidade:** o envio leva só os dados acima e um código aleatório gerado no seu PC (para contar "pessoas diferentes"). Nenhum dado pessoal é coletado; o IP não é guardado (apenas um hash, usado para limitar spam a 10 envios por dia). A estrutura do banco e as regras de acesso estão em [`supabase/schema.sql`](supabase/schema.sql) — o app só consegue **inserir** envios, nunca ler os de outras pessoas.

> **Atenção:** enquanto o app está aberto, o atalho Ctrl+Tab fica reservado para ele (não troca abas no navegador).
> Para o painel aparecer por cima do jogo, use o modo **janela sem borda** (borderless) em vez de tela cheia exclusiva.

### Primeira vez no macOS

O app não é notarizado pela Apple (isso exige uma conta paga de desenvolvedor), então na primeira vez o macOS avisa que não pode verificar o app:

1. Tente abrir o Slimedex normalmente e feche o aviso;
2. Vá em **Ajustes do Sistema → Privacidade e Segurança**, role até o fim e clique em **Abrir mesmo assim**;
3. Confirme. Das próximas vezes ele abre direto.

No Mac o Slimedex fica fora do Dock: o ícone aparece na barra de menu e o painel abre por cima do jogo, inclusive em tela cheia. O atalho é o mesmo, **Control+Tab**. Os `.dmg` são gerados automaticamente no GitHub Actions ([`build-mac.yml`](.github/workflows/build-mac.yml)) a partir deste código.

## Segurança do executável

O `.exe` **não é assinado digitalmente** (certificado de assinatura é pago), então o Windows pode mostrar o aviso do SmartScreen: clique em *Mais informações → Executar assim mesmo*. Para conferir que o arquivo é o mesmo publicado aqui:

| Versão | SHA-256 | VirusTotal |
|---|---|---|
| 1.5.1 (Windows) | `8A213946F486096B2194436380C3557B3C8841484A492C0DB475E40C2584A4F3` | _em análise_ |
| 1.5.0 (Windows) | `3912CBAA628B15536972DD06877315C178444129A431E68990C5EF40343478CB` | [**1/57** — ver análise](https://www.virustotal.com/gui/file/3912cbaa628b15536972dd06877315c178444129a431e68990c5ef40343478cb/detection) |
| 1.5.0 (Mac, chip Apple) | `900BB94C4B05115E79B01555D20428F14516AC2A07A80B266296B285403CDB4F` | — |
| 1.5.0 (Mac, Intel) | `CE9DA87612F6282E05C691E0A2F368EFAFD366EA01F7C309A09B47E75F31B2F8` | — |
| 1.4.0 (Windows) | `722E0AD8E8617426C5F258FB01649D801E9BA8CF1844B7225560AF019BEB8B97` | [**1/67** — ver análise](https://www.virustotal.com/gui/file/722e0ad8e8617426c5f258fb01649d801e9ba8cf1844b7225560af019beb8b97/detection) |
| 1.4.0 (Mac, chip Apple) | `FA5E96398F21408E4A40210A00B946A01B5D1E8F6C6BFD90CCFAA30753A543A3` | — |
| 1.4.0 (Mac, Intel) | `BEFB47468140B32031CD304A0C6043EC12A3501F46BF43AFFAEDE504F6636392` | — |
| 1.3.0 | `8D80E04130DCCFE7941F22374B148B45309B274A958A364C080C16B4AA68CE8A` | [**1/67** — ver análise](https://www.virustotal.com/gui/file/8d80e04130dccfe7941f22374b148b45309b274a958a364c080c16b4aa68ce8a/detection) |
| 1.2.0 | `C87790E346D46E6732DB5964D6731BBC809B20D588588C6A9A7E60EBA9912AC3` | [**1/68** — ver análise](https://www.virustotal.com/gui/file/c87790e346d46e6732db5964d6731bbc809b20d588588c6a9a7e60eba9912ac3/detection) |
| 1.1.0 | `F7CE0ECFFA7DF80223EE064E04FF999BEEB1A7E76A73F76DF1E5B8DE5962CFA3` | [**1/68** — ver análise](https://www.virustotal.com/gui/file/f7ce0ecffa7df80223ee064e04ff999beeb1a7e76a73f76df1e5b8de5962cfa3/detection) |
| 1.0.0 | `0B0CA238299E3430D662F3733EA6FCCFCB9EE3669C3FE1F02899E1F3902EF2DB` | [**1/67** — ver análise](https://www.virustotal.com/gui/file/0b0ca238299e3430d662f3733ea6fccfcb9ee3669c3fe1f02899e1f3902ef2db/detection) |

> **Sobre o alerta único:** nas duas versões, o único alerta é da McAfee, com uma detecção do tipo `Ti!<começo do hash>` (ex.: `Ti!0B0CA238299E` na 1.0.0). Ela não identifica vírus nenhum: é a regra de **reputação** da McAfee ("Threat Intelligence"), que marca qualquer executável novo, pouco baixado e sem assinatura digital — repare que o "nome" da detecção é só o começo do hash do próprio arquivo, e por isso ela reaparece a cada versão nova. Todos os outros antivírus e o Windows Defender não acusam nada, e o código-fonte completo está neste repositório.

Os hashes dos `.dmg` de Mac ficam no arquivo `SHA256-mac.txt` gerado junto pelo build (aba Actions) e na descrição do release.

```powershell
Get-FileHash .\Slimedex-x.y.z-portable.exe -Algorithm SHA256   # até a 1.1.0 o arquivo se chamava Slimepedia-…
```

O app só acessa a internet para carregar as imagens da wiki, baixar a base da comunidade e conferir/baixar versões novas no GitHub; não captura tela nem teclado (só registra o atalho Ctrl+Tab) e guarda apenas a posição do ícone, o histórico e os seus dados em `%APPDATA%\slime-overlay`. Arquivos fora dessa pasta só são lidos/gravados quando você usa Importar/Exportar.

## Rodar a partir do código

Requer [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm start          # roda em modo desenvolvimento
npm run dist       # gera dist/Slimedex-x.y.z-portable.exe
```

| Arquivo | O que é |
|---|---|
| `main.js` | janela, ícone da bandeja, atalho global, posição, leitura/gravação dos seus dados |
| `overlay.html` | interface (busca, lista, ficha, nova combinação, importar/exportar) |
| `data.js` / `data.json` | base de slimes, combinações, materiais e tabela de elementos |

## Licença

[MIT](LICENSE)
