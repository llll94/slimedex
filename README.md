<p align="center"><img src="icon.png" width="96" alt=""></p>

# Slimedex

[![VirusTotal 1/66](https://img.shields.io/badge/VirusTotal-1%2F66_%28falso_positivo%29-brightgreen?logo=virustotal&logoColor=white)](https://www.virustotal.com/gui/file/58a18c5effbe64783e0fe3414cc082438ea208f721fb35b724fb064ba0dd8493/detection)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)
[![Code signing policy](https://img.shields.io/badge/code_signing-policy-informational)](#code-signing-policy)

Overlay para Windows e macOS com a Slimepédia do **World of Slime** sempre à mão, por cima do jogo: busca rápida, onde cada slime nasce, como obter (combinações com % de chance), em que ele é usado e as vantagens de elemento — e deixa você cadastrar suas próprias descobertas.

> Projeto de fã, sem vínculo com os desenvolvedores do jogo. Dados e imagens vêm da [World of Slime Wiki](https://world-of-slime-wiki.vercel.app).

## Como usar

1. Baixe na aba [Releases](../../releases):
   - **Windows:** `Slimedex-x.y.z-portable.exe` — é só executar, não precisa instalar;
   - **macOS:** `Slimedex-x.y.z-mac-arm64.dmg` (Mac com chip Apple, M1 em diante) ou `Slimedex-x.y.z-mac-x64.dmg` (Mac Intel) — abra o .dmg e arraste o Slimedex para Aplicativos.
2. Ao abrir, uma tela procura atualizações (versão nova do app e base nova da comunidade) e depois abre o painel; se saiu versão nova, ele abre direto na tela de atualizar. Fechando o painel, fica o ícone no canto da tela, sempre por cima das outras janelas.

| Ação | Como |
|---|---|
| Abrir / fechar | **Ctrl+Tab** (de qualquer lugar) ou clique no ícone |
| Buscar | digite o nome, número, elemento ou local |
| Navegar | **↓ / ↑** e **Enter** para abrir a ficha |
| Voltar | tecla **V**, botão **voltar do mouse** ou **← voltar** |
| Fechar | **Esc**, **Ctrl+Tab** ou clique fora do painel |
| Mover o ícone | arraste (a posição é lembrada) |
| Cor do ícone | escolhida na primeira vez que o app abre (azul, vermelho, roxo, laranja ou verde, ou 5 **cores para daltônicos**: azul-escuro, amarelo, vermelhão, violeta e ciano); continua a mesma nas atualizações |
| Limpar recentes | vassourinha ao lado de **Recentes** (busca vazia) |
| Cartilha | botão **i** ao lado da busca — abre uma janela com o passo a passo de cada recurso, com prints (PT/EN) |
| Idioma | botão **⋯** → **Português / English** |
| Limpar a busca | **×** dentro do campo |
| Fixar na tela | **☆** numa combinação ou ao lado do nome do slime — vira uma janelinha por cima do jogo, arrastável (até 8). Na janelinha, **★** desfixa e **×** só esconde; em **Fixados** (busca vazia) cada um tem uma chave liga/desliga, e a vassourinha ao lado do título desafixa todos (com *Desfazer*) |
| Skills | botão de **raio** no topo — todas as skills, por elemento; na ficha, **+ Anotar skill** guarda em que nível o slime pega cada uma |
| Slimes do mapa (beta, Windows) | **⋯** → ligar; no jogo, **Tab** mostra os slimes que nascem no mapa atual |
| Sair | botão direito no ícone da bandeja → **Sair** |

Com a busca vazia aparecem as 3 últimas fichas abertas e a lista completa.

### Na ficha de cada slime

- **Dia e noite** — ícone ao lado do nome: nasce só de dia, só de noite ou nos dois. Clique para corrigir.
- **Onde nasce** — os mapas em que ele aparece (clique num mapa para ver ou editar os slimes dele).
- **Drops** — os itens que ele solta, com ícone.
- **Como obter** — combinações ordenadas pela maior chance (sem % por último), com selo de % (ex.: `~70%`). Clique no selo para editar a chance. **A ordem dos slimes importa**: A + B e B + A são combinações diferentes, cada uma com sua chance. O selo **teste** marca as que ninguém confirmou ainda (vindas da planilha ou sem resultado) — fez? cadastre igual e envie, que ela é confirmada. Combinação errada? **🗑** apaga (some do seu app na hora; ao enviar suas descobertas, vai para revisão e pode sumir para todos).
- **Usado em** — combinações em que ele é ingrediente: primeiro as em que ele é o **principal** (slime 1), depois as em que é o **secundário**, cada grupo da maior para a menor chance; as **testadas sem resultado** ficam no fim, recolhidas (e somem sozinhas quando o mesmo par ganha resultado), e logo abaixo os pares que **não combinam**.
- **Elementos** (seção recolhível) — contra quais elementos o ataque dele é forte/fraco e de quais ele toma mais/menos dano.
- **＋ Nova combinação** — cadastra uma combinação que você descobriu (resultado, slimes, material, nível e chance), com sugestões de nomes e dos materiais.
- **✎ nome em PT-BR** e **✎ número** — dá um nome em português e o número da Slimepedia do jogo; a busca acha pelos dois.
- **✎ em cada combinação** — corrige material, nível ou chance (fica no seu app, por cima da original; a lixeira desfaz). **⇄** junta uma combinação sua com outra igual; combinações suas iguais às da base/comunidade já aparecem juntas numa linha só.

### Testador de combinações (botão ⚗ no topo)

Escolha o **slime 1**, o **slime 2** e, se quiser, o **material**: o painel alarga e mostra à direita o que pode sair.

- **Já conhecidas** — combinações da base, da comunidade ou suas para esse par (na mesma ordem: A + B ≠ B + A), com a chance real;
- **Estimativas** — os outros resultados possíveis, do mais provável para o menos provável, calculados pelos elementos e espécies dos dois slimes e pelas combinações conhecidas (o resultado quase sempre tem elemento em comum com os pais). Nos testes com as combinações conhecidas, a certa ficou entre as 5 primeiras em ~9 de cada 10 casos;
- **Salvar teste** — guarda o que você fez, com resultado (clique numa possibilidade ou digite) ou sem ("sei que vira algo, mas não sei o quê"). Os testes ficam em **Meus testes** e na ficha dos slimes;
- **🚫 Não combina** — marca que o jogo não deixa juntar os dois slimes (nessa ordem). Fica em **Meus testes** e na ficha; quando o par está marcado (por você ou pela comunidade), o testador avisa em cima das possibilidades. Não aceita par que já tem resultado conhecido;
- **Compartilhar** — cada teste tem sua chave (começa como a chave geral de **⋯**): só os compartilhados vão no *Enviar minhas descobertas*. Teste compartilhado sem resultado entra na base da comunidade com o selo **teste**. Em **⋯** a chave geral liga/desliga todas as suas contribuições e vira o padrão das novas.

O botão **Testar combinação** na ficha abre o testador já com o slime no campo 1.

### Skills (botão de raio no topo)

As **skills do jogo** (lista da [World of Slime Wiki](https://world-of-slime-wiki.vercel.app), mais as que a wiki ainda não tem, em [`skills-extra.json`](skills-extra.json)), com ícone, elemento, tipo, MP e recarga. Busque em português ou inglês ("barreira" acha *Aqua Barrier*) e filtre por elemento. Clique numa skill para ver os detalhes e **quais slimes pegam ela, e em que nível**.

- **Na ficha** — seção **Skills** com as skills do slime, do menor nível para o maior, e de onde veio cada uma (**wiki**, **comunidade** ou **meu**).
- **+ Anotar skill** — escolha a skill (a lista começa nos elementos do slime) e o **nível** em que ele pegou. Ex.: Mud Bass pega a Barreira Aquática no nível 26.
- **Não achou?** — **cadastre uma nova** com nome e elemento; se o nome parecer com uma skill que já existe, o app pergunta "é essa?".
- **Nome no jogo (PT)** — enquanto ninguém manda o nome em português, aparece o nome em inglês da wiki; no detalhe da skill dá para corrigir.
- **✎ Escrever descrição** — no detalhe da skill, troque o texto pelo que o jogo diz (até 300 letras). A sua aparece com o selo **meu**; vai no envio e, como é texto livre, toda descrição nova passa pela revisão antes de valer para todos.
- **Compartilhar** — igual às combinações: cada anotação tem sua chave (começa como a chave geral de **⋯**) e a chave geral vale para tudo. Quando várias pessoas anotam níveis diferentes, a comunidade mostra o que mais gente mandou.

### Enciclopédia e Identificar (botão do livro no topo)

Todos os slimes com número, 5 por linha, mostrando o que **você** já fez no jogo: **não descoberto** (carta com o número e "?"), **descoberto** (foto em preto e branco), **capturado** (foto colorida) e **vínculo** (foto com fundo rosa). Os filtros no topo ligam e desligam (nenhum ligado mostra todos). Clique num slime para **Ir até o slime** ou **Identificar** (passando o mouse, descendo a seta ou clicando). O símbolo aparece também na lista do Ctrl+Tab (com os mesmos filtros) e na ficha, ao lado do nome. Fica só no seu computador.

### Baú · beta, só Windows

O Slimedex guarda o que está no seu **baú do jogo**, para consultar longe dele. Com o baú do jogo aberto, passe o mouse no ícone do Slimedex e clique em **Capturar baú** (ou aperte **Ctrl+X**): o Slimedex lê a tela, reconhece cada slime pelo desenho (comparando com as imagens da wiki), o nível e o coração de amizade, e conta num balão de fala o que achou. **Baú** no mesmo menu, o botão do baú no topo do painel ou a tecla **X** abrem o baú no painel; **V** fecha. Clique numa carta para marcar o coração (azul vazio: pode ficar amigável, abaixo de 20%; rosa: 20% ou mais); o botão direito abre a ficha. A foto da tela não é guardada nem enviada: só a lista de slimes, níveis e corações. Os atalhos ligam e desligam em **⋯ → Baú** (e ligam sozinhos quando você usa o baú pelo menu).

### Slimes do mapa (Tab) · beta, só Windows

Ligado em **⋯ → Slimes do mapa**, ao apertar **Tab** no jogo (o mapa ampliado) aparece uma janelinha com as fotos dos slimes que nascem no mapa em que você está — fundo off-white = dia, lilás = noite, os dois = dia e noite. Arraste para onde quiser; **Tab** de novo ou **Esc** no jogo esconde. A janelinha aparece e some no ritmo do mapa do jogo: como o jogo, ela ignora o Tab enquanto o mapa ainda está abrindo ou fechando (~0,5 s), então não sai de sincronia mesmo apertando Tab várias vezes rápido. **Adicionar / editar** abre a lista do mapa no painel: marque os slimes que você viu ou tire os que não nascem ali (inclusive os da base).

Como ele sabe o mapa: um processo pequeno ([`leitor-tela.ps1`](leitor-tela.ps1)) olha se o Tab foi apertado — **sem segurar a tecla**, o jogo recebe normalmente; Tab com Ctrl, Alt ou Windows é ignorado — e, só nesse momento, recorta o bloco abaixo do minimapa (região e nome do mapa) e lê com o **OCR do próprio Windows**. O texto lido é cruzado com a lista de mapas conhecidos, aceitando os erros comuns do OCR. Quando o app não tem certeza, a janelinha pergunta **Qual é este mapa?** com os 3 mais parecidos e a opção **É um mapa novo**; a resposta vira um apelido (o texto lido → o mapa) e da próxima vez ele já reconhece. Nada é gravado; só esses apelidos vão no envio para a comunidade, e um apelido passa a valer para todo mundo quando 2 pessoas respondem igual. Desligado, não roda nada.

### Seus dados e idioma (botão ⋯)

O que você cadastra fica **só no seu PC**, separado da base do app, em `%APPDATA%\slime-overlay\meus-dados.json`, e não se perde ao atualizar o `.exe`. Pelo botão **⋯** dá para:

- **Importar CSV** no formato da planilha da comunidade (`Result, ID, Level, Slime 1, Slime 2, Material, Chance`) — combinações que já existem não duplicam, só ganham a chance se estiver faltando;
- **Exportar** suas combinações em CSV (mesmo formato) ou fazer backup de tudo em JSON, e **importar** de volta.

### Atualizações

A partir da 1.5.0 o Slimedex confere de hora em hora se há novidades e avisa no **rodapé do painel** (e com uma bolinha verde no ícone). Desde a 2.4.0 ele também avisa num **balão de fala** ao lado do ícone:

- **versão nova:** o balão fica amarelo até você passar o mouse por cima; clicar nele (ou em **Atualizar**, no menu do ícone) atualiza direto e, no fim, mostra o que mudou (inclusive das versões puladas). Pelo rodapé, mostra o que mudou e pede confirmação. No Windows ele baixa o `.exe` novo para a mesma pasta, **confere o SHA-256 informado pelo GitHub**, reinicia na versão nova e apaga a antiga — o progresso aparece num anel com porcentagem no ícone. No Mac o botão abre a página de download;
- **base nova da comunidade:** o balão avisa que alguém subiu descobertas novas; um clique no rodapé reinicia o app já com as combinações novas;
- se houver as duas ao mesmo tempo, você escolhe qual fazer;
- o botão **⟳** no rodapé confere na hora, sem esperar a próxima hora.

O que mudou em cada versão, escrito para quem joga, fica em [`novidades.json`](novidades.json); os detalhes técnicos ficam na descrição de cada release.

### Base colaborativa

Em **⋯ → Enviar minhas descobertas** você manda suas combinações (só as com **Compartilhar** ligado), chances e nomes em PT-BR para a base da comunidade. A cada 15 minutos, um processo automático ([`scripts/merge-comunidade.js`](scripts/merge-comunidade.js), rodando no GitHub Actions) consolida os envios em [`comunidade.json`](comunidade.json), que o app baixa ao abrir:

- uma **combinação nova** entra a partir do primeiro envio, depois de revisada (aparece com o selo *comunidade* e o número de pessoas que a enviaram);
- a **chance** é a mais enviada (empate: fica a que já estava aprovada, senão a mais recente);
- um **nome em PT-BR** entra com o nome mais usado;
- o **número do slime** (para os que não têm na base) entra com o número mais enviado — número que já é de outro slime é descartado;
- **slimes vistos nos mapas** e **dia / noite** entram com o mais marcado; tirar um slime que a base põe num mapa, mapa novo (nome lido da tela) ou trocar um dia/noite já aprovado passam por revisão;
- cada atualização vira um Pull Request. Se **tudo** o que mudou segue o padrão da base, ele é aprovado sozinho: o resultado divide ao menos um elemento com os pais, o material é um item conhecido, o nível bate com o que a base já sabe daquele slime e nenhuma chance, nome ou número já aprovado muda de forma brusca. Qualquer coisa fora disso espera revisão manual — o motivo aparece no próprio PR;
- o que for ignorado de propósito (envio ruim, nome errado) fica em [`bloqueios.json`](bloqueios.json).

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

O `.exe` ainda **não é assinado digitalmente** (a assinatura gratuita pelo SignPath Foundation está em andamento; veja a [política de assinatura de código](#code-signing-policy)), então o Windows pode mostrar o aviso do SmartScreen: clique em *Mais informações → Executar assim mesmo*. Para conferir que o arquivo é o mesmo publicado aqui:

| Versão | SHA-256 | VirusTotal |
|---|---|---|
| 2.4.0 (Windows) | `BD96DBCBF783EA5F8EEB4E7FF743E6B7B7CA1A2CA9A4923439DE0383E29235AA` | em análise |
| 2.3.2 (Windows) | `58A18C5EFFBE64783E0FE3414CC082438EA208F721FB35B724FB064BA0DD8493` | [**1/66** — ver análise](https://www.virustotal.com/gui/file/58a18c5effbe64783e0fe3414cc082438ea208f721fb35b724fb064ba0dd8493/detection) |
| 2.3.1 (Windows) | `786D94742A7526AD9ACAD37873DB8BAFC980B006062A867D5AF45456A7A9649C` | [**1/58** — ver análise](https://www.virustotal.com/gui/file/786d94742a7526ad9acad37873db8bafc980b006062a867d5af45456a7a9649c/detection) |
| 2.3.0 (Windows) | `62D8066CF67057B5D3CBD3D9B4629B0BFD0C845A3CF421AAC23B9282A028288F` | [**1/66** — ver análise](https://www.virustotal.com/gui/file/62d8066cf67057b5d3cbd3d9b4629b0bfd0c845a3cf421aac23b9282a028288f/detection) |
| 2.2.1 (Windows) | `7F740746D94A437762A4E0DFFEDE4D69A6882C1308485E9265A60B91EF09698A` | [**1/63** — ver análise](https://www.virustotal.com/gui/file/7f740746d94a437762a4e0dffede4d69a6882c1308485e9265a60b91ef09698a/detection) |
| 2.2.1 (Mac, chip Apple) | `627C2686DB188DB7C10202D61A86E805113B4595B0CB13577B8E66D8F3A3C684` | — |
| 2.2.1 (Mac, Intel) | `35EB2DB3DCA0C1B3ADC3332E7446EE6BE8AD163E59673E903058DA2993836721` | — |
| 2.2.0 (Windows) | `8FE7CBCF60767241D6A6AD99AF9168F8CF7F66A6731DC1F8A7D6596FC98652A1` | [**1/62** — ver análise](https://www.virustotal.com/gui/file/8fe7cbcf60767241d6a6ad99af9168f8cf7f66a6731dc1f8a7d6596fc98652a1/detection) |
| 2.2.0 (Mac, chip Apple) | `23F07C7B5D02EB0F529C92A79D31D96FCDABC677CAC9C38373CE45F6696F08F3` | — |
| 2.2.0 (Mac, Intel) | `FCEEB748F3A83F799C7D0A389BB6172D35371FCF7DF6B66BE9D9CC198E98C03E` | — |
| 2.1.2 (Windows) | `FA6FB74F8E18D507D77B81D34EABD5E591247CFFE7AB0845A040A1902D5F6E1B` | [**1/64** — ver análise](https://www.virustotal.com/gui/file/fa6fb74f8e18d507d77b81d34eabd5e591247cffe7ab0845a040a1902d5f6e1b/detection) |
| 2.1.2 (Mac, chip Apple) | `BE0ED16CBFA37EDCEA708684CBD63F617B533E2DAEE36395F1628682E5A907EA` | — |
| 2.1.2 (Mac, Intel) | `D9939C7424D0EFCBCFE812D9FF76097BA5CBFCADA50E0AA8241095B719CF941A` | — |
| 2.1.1 (Windows) | `BD0DE955077D3B6ACD512B9680D00A3D3C83DA93E94CC1BAAD7C3B3F6CB3170D` | [**1/63** — ver análise](https://www.virustotal.com/gui/file/bd0de955077d3b6acd512b9680d00a3d3c83da93e94cc1baad7c3b3f6cb3170d/detection) |
| 2.1.1 (Mac, chip Apple) | `3A433137326A62B8AC716E1CB838CB6744B789DAACAE8D4E2438103C0088EF41` | — |
| 2.1.1 (Mac, Intel) | `16721B8FEE7F991475E290AB591A2F9E131ABAFC56EEE29817E388502CD399CC` | — |
| 2.1.0 (Windows) | `0C3D39253530817B00F46FFD5F037281DB68F6412A16C0454537C7E0EEE0C475` | [**1/55** — ver análise](https://www.virustotal.com/gui/file/0c3d39253530817b00f46ffd5f037281db68f6412a16c0454537c7e0eee0c475/detection) |
| 2.1.0 (Mac, chip Apple) | `1EC92305A0F0191712205181D83F34A45D1240739A33C4834AB3D86FA4CAA2DE` | — |
| 2.1.0 (Mac, Intel) | `D4418138E06024E32FC2B52D05BCF9B5D0D7C14BE8969CE7CF983F088A010C35` | — |
| 2.0.0 (Windows) | `4F9A94ADC888DE92498039B065D5F3CE95436BF30A911B26F7B29DAE49CD280B` | [**1/64** — ver análise](https://www.virustotal.com/gui/file/4f9a94adc888de92498039b065d5f3ce95436bf30a911b26f7b29dae49cd280b/detection) |
| 2.0.0 (Mac, chip Apple) | `2DEB3C7D6866F48DE80EAEF2F290122D486E147BB85870114D28EEAFF9A238DE` | — |
| 2.0.0 (Mac, Intel) | `337EE50DF12096028CFA6A2E07616654C855BDFFF4A9D78499956D1654377C03` | — |
| 1.6.3 (Windows) | `770691A19AA89956370D2645CD749E25928CABEB2FA7F88A5355406C94C37050` | em análise |
| 1.6.3 (Mac, chip Apple) | `00DF6C084C63ED56D86DCC1347BA93E386241104C2948BC3666F3BC6BCBC6ECB` | — |
| 1.6.3 (Mac, Intel) | `2ED37474F6B5F7EAADD6A8D3F19F4866583DDAA39DC68789C69A6D26C968EF2F` | — |
| 1.6.2 (Windows) | `C808B77DB13B8DA98F4FCB0B15C24EEC072FEA8BE80501A50BF71B68A7C0F71D` | [**1/66** — ver análise](https://www.virustotal.com/gui/file/c808b77db13b8da98f4fcb0b15c24eec072fea8be80501a50bf71b68a7c0f71d/detection) |
| 1.6.2 (Mac, chip Apple) | `2B76DB602D8F8B135C245645A3B25CD71518E756EF13A60A0C85055A69A01DFB` | — |
| 1.6.2 (Mac, Intel) | `43BD44861EEB5026197198079AED1C02FE578BFF1A2116091F10B021A4EB16D3` | — |
| 1.6.1 (Windows) | `852A2E3C9244C408D42B0DC9555CA2C955C74F5E6BDD406641CBE82F3EC86905` | [**1/66** — ver análise](https://www.virustotal.com/gui/file/852a2e3c9244c408d42b0dc9555ca2c955c74f5e6bdd406641cbe82f3ec86905/detection) |
| 1.6.1 (Mac, chip Apple) | `893C8A87E4F9467E3294A978A48F3738677F85011AA5D73CF70404975344A2C4` | — |
| 1.6.1 (Mac, Intel) | `BBD1D414D96BA0053EA146F721D45A52FC80D028369661606B0D3BB86961537C` | — |
| 1.6.0 (Windows) | `31D1D1A9588BD71EB304007C1780E186336529B35298FF67218A47C80002AF68` | [**1/67** — ver análise](https://www.virustotal.com/gui/file/31d1d1a9588bd71eb304007c1780e186336529b35298ff67218a47c80002af68/detection) |
| 1.6.0 (Mac, chip Apple) | `948049391ECAA4B8D2670157C3A07B2494D99FEF9F5DDB9C08BD2B06CABF852A` | — |
| 1.6.0 (Mac, Intel) | `0D818054F13846F7633B0F2071699CB55DAF246CF63BD7D388093166866B5A0E` | — |
| 1.5.2 (Windows) | `AAD1ABB01C0AF2E1CD14CBE44BF5957C713F450A12FBA9CCAE07103B5FEA5D01` | [**1/67** — ver análise](https://www.virustotal.com/gui/file/aad1abb01c0af2e1cd14cbe44bf5957c713f450a12fba9ccae07103b5fea5d01/detection) |
| 1.5.2 (Mac, chip Apple) | `05FE6052695EF7B99F759B435D2A05431F242EA1968F8B3B5D23D2B103E720F5` | — |
| 1.5.2 (Mac, Intel) | `09925518B9FB8C025E80512DB31A0702E3DECF30E6DA0B9B87DAE2DC34487E09` | — |
| 1.5.1 (Windows) | `8A213946F486096B2194436380C3557B3C8841484A492C0DB475E40C2584A4F3` | [**1/64** — ver análise](https://www.virustotal.com/gui/file/8a213946f486096b2194436380c3557b3c8841484a492c0db475e40c2584a4f3/detection) |
| 1.5.1 (Mac, chip Apple) | `217762DB9B695BA6D0C576DF4CCE7852ED47335475AC7475E46928F7DEEBB0BD` | — |
| 1.5.1 (Mac, Intel) | `755F2E7E26C51EC15382BB7788C4614F603066419E52310023EC0D298C1F0101` | — |
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

O app só acessa a internet para carregar as imagens da wiki, baixar a base da comunidade e conferir/baixar versões novas no GitHub; não captura tela nem teclado (só registra o atalho Ctrl+Tab; com os Slimes do mapa ligados, lê o bloco abaixo do minimapa quando você aperta Tab; com o Baú ligado, observa só as teclas X, V e Ctrl+X e o botão do mouse, e fotografa a tela apenas quando você clica em Capturar baú ou aperta Ctrl+X, sem guardar a foto) e guarda apenas a posição do ícone, o histórico e os seus dados em `%APPDATA%\slime-overlay`. Arquivos fora dessa pasta só são lidos/gravados quando você usa Importar/Exportar.

## Code signing policy

Windows releases (`Slimedex-x.y.z-portable.exe`) are built from this repository by GitHub Actions ([`build-windows.yml`](.github/workflows/build-windows.yml)). Only files built by that workflow are submitted for signing, and every signing request is approved manually before the file is signed. The private key is kept by SignPath in a hardware security module (HSM). macOS builds are not signed through SignPath.
Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

Contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

**Team roles**
- Committers and reviewers: [Lucas Schunck](https://github.com/llll94)
- Approvers: [Lucas Schunck](https://github.com/llll94)

**Privacy policy**
This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it.
- It downloads slime pictures from the [World of Slime Wiki](https://world-of-slime-wiki.vercel.app), and the community database and new versions from this GitHub repository (to show the data and check for updates).
- It sends data only when you click **Send my discoveries**: the combinations you chose to share, chances, names, numbers, map entries and skill notes, together with a random ID created on your computer (not your name or any account). It goes to the project's community database and nothing else is uploaded.

**What the app does on your computer**
- Registers one global shortcut, **Ctrl+Tab**, to open and close the panel.
- **Map slimes (Tab)** — optional, off by default, Windows only. While it is on, a small helper (`leitor-tela.exe`, built from [`leitor-tela.cs`](leitor-tela.cs)) checks only the state of the **Tab** and **Esc** keys. When you press Tab in the game, it reads a small area below the game's minimap with the OCR built into Windows to get the map name. The image stays in memory and is discarded right away; it is never saved or sent.
- **Chest** — optional, off by default, Windows only. While it is on, the helper checks only the **X**, **V** and **Ctrl+X** keys and the left mouse button (to open and close the chest in the panel, and Ctrl+X to capture) and only reacts while the game window is in front. When you click **Capture chest** (in the menu that shows when you hover the Slimedex icon) or press Ctrl+X, it takes one screenshot to read your in-game chest; the screenshot is used to recognize the slimes and their levels and is then deleted. Only the resulting list (slime and level) is kept, on your computer.
- It does not record what you type, does not read any other key, does not read or change the game's files or memory, does not inject anything into the game and does not change system settings.
- It is portable: nothing is installed. Your data stays in `%APPDATA%\slime-overlay`; deleting the app and that folder removes everything.
- Updates: when a new version is released, Slimedex shows a speech bubble and a button in the panel; the new `.exe` is downloaded from this repository's releases only when you click one of them.

### Política de assinatura de código (resumo em português)

O `.exe` do Windows é compilado a partir deste repositório pelo GitHub Actions, e cada assinatura é aprovada manualmente antes de o arquivo ser assinado. Assinatura gratuita por [SignPath.io](https://about.signpath.io), certificado do [SignPath Foundation](https://signpath.org). Autor, revisor e aprovador: [Lucas Schunck](https://github.com/llll94).

O que o app faz no seu computador: registra o atalho **Ctrl+Tab**; os **Slimes do mapa** (opcional, desligado por padrão) observam só as teclas Tab e Esc e, no Tab, leem com o OCR do Windows o bloco abaixo do minimapa, sem guardar a imagem; o **Baú** (opcional, desligado por padrão) observa só X, V, Ctrl+X e o botão esquerdo do mouse com o jogo na frente e tira **uma** foto da tela quando você clica em **Capturar baú** ou aperta Ctrl+X, apagada logo depois de ler — fica só a lista de slimes e níveis. Não grava o que você digita, não mexe nos arquivos nem na memória do jogo e não muda configurações do sistema. Só envia algo quando você clica em **Enviar minhas descobertas** (o que você marcou para compartilhar, com um código aleatório deste computador).

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
