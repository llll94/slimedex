<p align="center"><img src="icon.png" width="96" alt=""></p>

# Slimepédia overlay

[![VirusTotal 1/67](https://img.shields.io/badge/VirusTotal-1%2F67_%28falso_positivo%29-brightgreen?logo=virustotal&logoColor=white)](https://www.virustotal.com/gui/file/0b0ca238299e3430d662f3733ea6fccfcb9ee3669c3fe1f02899e1f3902ef2db/detection)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)

Overlay para Windows que mostra a Slimepédia do **World of Slime** por cima do jogo: busca rápida, onde cada slime nasce, como obter (combinações) e em que ele é usado.

> Projeto de fã, sem vínculo com os desenvolvedores do jogo. Dados e imagens vêm da [World of Slime Wiki](https://world-of-slime-wiki.vercel.app).

## Como usar

1. Baixe o `Slimepedia-x.y.z-portable.exe` na aba [Releases](../../releases) e execute (não precisa instalar).
2. Um ícone de livro aparece no canto da tela, sempre por cima das outras janelas.

| Ação | Como |
|---|---|
| Abrir / fechar | **Ctrl+Tab** (de qualquer lugar) ou clique no ícone |
| Buscar | digite o nome, número, elemento ou local |
| Navegar | **↓ / ↑** e **Enter** para abrir a ficha · **Esc** fecha |
| Mover o ícone | arraste (a posição é lembrada) |
| Sair | botão direito no ícone da bandeja → **Sair** |

Com a busca vazia aparecem as 3 últimas fichas abertas e a lista completa.

> **Atenção:** enquanto o app está aberto, o atalho Ctrl+Tab fica reservado para ele (não troca abas no navegador).
> Para o painel aparecer por cima do jogo, use o modo **janela sem borda** (borderless) em vez de tela cheia exclusiva.

## Segurança do executável

O `.exe` **não é assinado digitalmente** (certificado de assinatura é pago), então o Windows pode mostrar o aviso do SmartScreen: clique em *Mais informações → Executar assim mesmo*. Para conferir que o arquivo é o mesmo publicado aqui:

| Versão | SHA-256 | VirusTotal |
|---|---|---|
| 1.0.0 | `0B0CA238299E3430D662F3733EA6FCCFCB9EE3669C3FE1F02899E1F3902EF2DB` | [**1/67** — ver análise](https://www.virustotal.com/gui/file/0b0ca238299e3430d662f3733ea6fccfcb9ee3669c3fe1f02899e1f3902ef2db/detection) |

> **Sobre o 1/67:** o único alerta é da McAfee, com a detecção `Ti!0B0CA238299E`. Ela não identifica vírus nenhum: é a regra de **reputação** da McAfee ("Threat Intelligence"), que marca qualquer executável novo, pouco baixado e sem assinatura digital — repare que o "nome" da detecção é só o começo do hash do próprio arquivo. Os outros 66 antivírus e o Windows Defender não acusam nada, e o código-fonte completo está neste repositório.

```powershell
Get-FileHash .\Slimepedia-1.0.0-portable.exe -Algorithm SHA256
```

O app não acessa a internet além de carregar as imagens da wiki, não captura tela nem teclado (só registra o atalho Ctrl+Tab) e guarda apenas a posição do ícone e o histórico em `%APPDATA%\slime-overlay`.

## Rodar a partir do código

Requer [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm start          # roda em modo desenvolvimento
npm run dist       # gera dist/Slimepedia-x.y.z-portable.exe
```

| Arquivo | O que é |
|---|---|
| `main.js` | janela, ícone da bandeja, atalho global, posição |
| `overlay.html` | interface (busca, lista, ficha) |
| `data.js` / `data.json` | base de slimes e combinações |

## Licença

[MIT](LICENSE)
