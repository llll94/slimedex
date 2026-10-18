// Textos da interface em PT-BR e inglês. t('chave', {var}) troca {var} pelos valores.
const TXT = {
  pt: {
    search_ph: 'buscar slime', clear: 'Limpar busca', info: 'Dicas e idioma', new_title: 'Nova combinação',
    my_title: 'Meus dados (exportar / importar)', close_title: 'Fechar (Esc)', ico_title: 'Slimedex (Ctrl+Tab) — arraste para mover',
    back: '← voltar', back_title: 'Voltar (tecla V ou botão voltar do mouse)',
    recent: 'Recentes', all: 'Todos ({n})', nothing: 'Nada encontrado.',
    up: 'Funciona', down: 'Não funciona / não existe', lv: 'nv',
    community: 'comunidade', community_title: 'Enviada por {n} pessoas e confirmada no merge diário',
    contested: 'contestada', contested_title: 'Muita gente votou que não funciona',
    mine: 'meu', del_title: 'Apagar esta combinação', chance_title: 'Chance — clique para editar',
    elements: 'Elementos', green: 'verde', adv: 'vantagem', red: 'vermelho', disadv: 'desvantagem',
    attack: '⚔ Ataque', defense: '🛡 Defesa', neutral: 'neutro',
    atk_title: 'Golpes de {e}: verde = causa mais dano, vermelho = causa menos',
    def_title: 'Recebendo golpes: vermelho = toma mais dano, verde = toma menos',
    num_add: '✎ adicionar número', num_edit: '✎ editar número', num_ph: 'número', num_invalido: 'Use um número inteiro de 1 a 9999', num_dup: 'O #{n} já é do {s}',
    pt_add: '✎ adicionar nome em PT-BR', pt_edit: '✎ editar nome em PT-BR', pt_ph: 'nome em PT-BR',
    where: 'Onde nasce', no_loc: 'Sem local cadastrado', how: 'Como obter ({n})', no_combo: 'Sem combinação',
    used: 'Usado em ({n})', new_btn: '＋ Nova combinação',
    form_h: 'Nova combinação', result: 'Resultado', slime1: 'Slime 1', slime2: 'Slime 2', material: 'Material', level: 'Nível', chance: 'Chance %',
    pick_ph: 'digite e escolha', opt_ph: 'opcional', mat_ph: 'opcional — digite e escolha', cancel: 'Cancelar', save: 'Salvar',
    form_err: 'Escolha o resultado e os dois slimes da lista',
    form_tip: 'Para cadastrar várias de uma vez, use ⋯ → Importar com um CSV no formato da planilha (Result, ID, Level, Slime 1, Slime 2, Material, Chance).',
    send_h: 'Enviar minhas descobertas', send_counts: '{k} combinação(ões) · {c} chance(s) · {v} voto(s) · {n} nome(s) em PT-BR · {u} número(s)',
    send_info: 'Vai para a base colaborativa. Uma vez por dia os envios são revisados e o que for aprovado entra na base de todo mundo. Não vai nada pessoal — só um código aleatório deste PC.',
    send_empty: 'Você ainda não tem nada para enviar.', send_same: 'Isso já foi enviado. Cadastre ou vote em algo novo para enviar de novo.',
    send_btn: 'Enviar', sending: 'Enviando…', sent_ok: 'Enviado, obrigado! Vai aparecer pra todo mundo depois da revisão diária.', sent: 'Enviado',
    send_fail: 'Não consegui enviar: {e}', retry: 'Tentar de novo',
    my_h: 'Meus dados', my_counts: '{n} nome(s) em PT-BR · {u} número(s) · {p} chance(s) editada(s) · {c} combinação(ões) minha(s) · {v} voto(s)',
    my_where: 'Ficam só neste computador, em {p}, e não se perdem ao atualizar o app.',
    send_open: '⬆ Enviar minhas descobertas…', import: 'Importar JSON ou CSV…', export_json: 'Exportar backup (JSON)…', export_csv: 'Exportar combinações (CSV)…',
    csv_tip: 'CSV: mesmo formato da planilha da comunidade (Result, ID, Level, Slime 1, Slime 2, Material, Chance). Combinações que já existem não duplicam — só ganham a chance, se estiver faltando.',
    msg_backup: 'Backup exportado.', msg_nocombo: 'Você ainda não tem combinações próprias para exportar.', msg_csv_out: '{n} combinação(ões) exportada(s) em CSV.',
    msg_csv_in: 'CSV: {novas} combinação(ões) nova(s), {pcs} chance(s) completada(s), {ja} já existiam.', msg_unknown: ' Não reconheci: {l}',
    msg_invalid: 'Arquivo inválido.', msg_json_in: 'Importado: {n} nome(s), {c} chance(s), {k} combinação(ões) nova(s).',
    lang: 'Idioma', tray_quit: 'Sair',
    nova_base: 'há novidades da comunidade', reiniciar_btn: '✨ Base atualizada — clique em reiniciar', base_em_dia: '✓ Base da comunidade em dia', btn_app_curto: '⬆ Atualizar para a v{v}', btn_base_curto: '✨ Base nova: reiniciar',
    nova_versao: '⬆ Nova versão {v} disponível — Atualizar', nova_versao_baixar: '⬆ Nova versão {v} disponível — Baixar', nova_versao_tip: 'nova versão {v}',
    atualizando: 'Atualizando… {p}%', atualizado: '✓ Atualizado para a versão {v}', novidades_h: 'Novidades da versão {v}', novidades_varias: 'O que mudou desde a sua versão ({v})',
    versao_x: 'Versão {v}', confirma_atualizar: 'Atualizar para a versão {v} agora? O Slimedex vai fechar e abrir de novo sozinho.', confirma_baixar: 'Baixar a versão {v}? A página de download vai abrir no navegador.', atualizar_agora: 'Atualizar agora', baixar_mac: 'Baixar no GitHub', depois: 'Depois', sem_novidades: 'Melhorias e correções.', falha_atualizar: 'Não consegui atualizar ({e}) — tentar de novo',
    info_h: 'Dicas e idioma',
    info: `<h4>Abrir e fechar</h4><ul>
<li><kbd>Ctrl</kbd>+<kbd>Tab</kbd> abre e fecha de qualquer lugar, inclusive com o jogo em foco</li>
<li>Clique no ícone para abrir; <kbd>Esc</kbd> ou clicar fora do painel fecha</li>
<li>Arraste o ícone para mudar de lugar — a posição é lembrada</li></ul>
<h4>Buscar</h4><ul>
<li>Digite o nome (EN ou PT-BR), o número, um elemento ou um local</li>
<li><kbd>↓</kbd> <kbd>↑</kbd> escolhe e <kbd>Enter</kbd> abre a ficha · o <b>×</b> dentro do campo limpa a busca</li>
<li>Numa ficha, é só começar a digitar que a busca recomeça</li></ul>
<h4>Voltar</h4><ul>
<li>Tecla <kbd>V</kbd>, botão <b>voltar do mouse</b> ou o link <b>← voltar</b></li></ul>
<h4>Na ficha</h4><ul>
<li><b>Como obter</b>: combinações, da maior chance para a menor — clique no <b>%</b> para editar</li>
<li><b>👍 / 👎</b>: diga se a combinação funciona; o número ao lado é o placar da comunidade</li>
<li><b>＋ Nova combinação</b>: cadastre o que você descobriu (com sugestões de slimes e materiais)</li>
<li><b>✎ nome em PT-BR</b> e <b>✎ número</b>: dê um nome em português e o número da Slimepedia do jogo</li>
<li><b>Elementos</b> (abre e fecha): contra quem o ataque é forte/fraco e de quem ele toma mais/menos dano</li></ul>
<h4>Seus dados (⋯)</h4><ul>
<li>Ficam só no seu PC e não se perdem ao atualizar</li>
<li>Importe/exporte CSV no formato da planilha da comunidade ou faça backup em JSON</li></ul>
<h4>Base colaborativa</h4><ul>
<li><b>⋯ → Enviar minhas descobertas</b> manda suas combinações, chances, votos e nomes</li>
<li>Uma vez por dia os envios são revisados e o que for aprovado entra para todo mundo (selo <b>comunidade</b>); os 👎 tiram o que estiver errado</li>
<li>Nada pessoal é enviado — só um código aleatório deste PC</li></ul>`,
    info_foot: 'Slimedex v{v} · dados da World of Slime Wiki e da comunidade · código aberto em github.com/llll94/slimedex',
    err: {}
  },
  en: {
    search_ph: 'search slime', clear: 'Clear search', info: 'Tips & language', new_title: 'New combination',
    my_title: 'My data (export / import)', close_title: 'Close (Esc)', ico_title: 'Slimedex (Ctrl+Tab) — drag to move',
    back: '← back', back_title: 'Back (V key or mouse back button)',
    recent: 'Recent', all: 'All ({n})', nothing: 'Nothing found.',
    up: 'Works', down: "Doesn't work / doesn't exist", lv: 'lv',
    community: 'community', community_title: 'Sent by {n} people and confirmed in the daily merge',
    contested: 'disputed', contested_title: 'Many people voted that it does not work',
    mine: 'mine', del_title: 'Delete this combination', chance_title: 'Chance — click to edit',
    elements: 'Elements', green: 'green', adv: 'advantage', red: 'red', disadv: 'disadvantage',
    attack: '⚔ Attack', defense: '🛡 Defense', neutral: 'neutral',
    atk_title: '{e} attacks: green = deal more damage, red = deal less',
    def_title: 'Taking hits: red = takes more damage, green = takes less',
    num_add: '✎ add number', num_edit: '✎ edit number', num_ph: 'number', num_invalido: 'Use a whole number from 1 to 9999', num_dup: '#{n} already belongs to {s}',
    pt_add: '✎ add Portuguese name', pt_edit: '✎ edit Portuguese name', pt_ph: 'Portuguese name',
    where: 'Where it spawns', no_loc: 'No location registered', how: 'How to get ({n})', no_combo: 'No combination',
    used: 'Used in ({n})', new_btn: '＋ New combination',
    form_h: 'New combination', result: 'Result', slime1: 'Slime 1', slime2: 'Slime 2', material: 'Material', level: 'Level', chance: 'Chance %',
    pick_ph: 'type and pick', opt_ph: 'optional', mat_ph: 'optional — type and pick', cancel: 'Cancel', save: 'Save',
    form_err: 'Pick the result and both slimes from the list',
    form_tip: 'To add many at once, use ⋯ → Import with a CSV in the spreadsheet format (Result, ID, Level, Slime 1, Slime 2, Material, Chance).',
    send_h: 'Send my discoveries', send_counts: '{k} combination(s) · {c} chance(s) · {v} vote(s) · {n} Portuguese name(s) · {u} number(s)',
    send_info: 'It goes to the collaborative database. Once a day submissions are reviewed, and whatever is approved is added for everyone. Nothing personal is sent — only a random code for this PC.',
    send_empty: "You don't have anything to send yet.", send_same: 'This was already sent. Add or vote on something new to send again.',
    send_btn: 'Send', sending: 'Sending…', sent_ok: 'Sent, thank you! It will show up for everyone after the daily review.', sent: 'Sent',
    send_fail: 'Could not send: {e}', retry: 'Try again',
    my_h: 'My data', my_counts: '{n} Portuguese name(s) · {u} number(s) · {p} edited chance(s) · {c} combination(s) of mine · {v} vote(s)',
    my_where: 'Stored only on this computer, in {p}, and kept when you update the app.',
    send_open: '⬆ Send my discoveries…', import: 'Import JSON or CSV…', export_json: 'Export backup (JSON)…', export_csv: 'Export combinations (CSV)…',
    csv_tip: "CSV: same format as the community spreadsheet (Result, ID, Level, Slime 1, Slime 2, Material, Chance). Combinations that already exist aren't duplicated — they only get the chance if it's missing.",
    msg_backup: 'Backup exported.', msg_nocombo: "You don't have combinations of your own to export yet.", msg_csv_out: '{n} combination(s) exported to CSV.',
    msg_csv_in: 'CSV: {novas} new combination(s), {pcs} chance(s) filled in, {ja} already existed.', msg_unknown: ' Not recognized: {l}',
    msg_invalid: 'Invalid file.', msg_json_in: 'Imported: {n} name(s), {c} chance(s), {k} new combination(s).',
    lang: 'Language', tray_quit: 'Quit',
    nova_base: 'community updates available', reiniciar_btn: '✨ Database updated — click to restart', base_em_dia: '✓ Community database up to date', btn_app_curto: '⬆ Update to v{v}', btn_base_curto: '✨ New data: restart',
    nova_versao: '⬆ New version {v} available — Update', nova_versao_baixar: '⬆ New version {v} available — Download', nova_versao_tip: 'new version {v}',
    atualizando: 'Updating… {p}%', atualizado: '✓ Updated to version {v}', novidades_h: "What's new in {v}", novidades_varias: 'What changed since your version ({v})',
    versao_x: 'Version {v}', confirma_atualizar: 'Update to version {v} now? Slimedex will close and reopen by itself.', confirma_baixar: 'Download version {v}? The download page will open in your browser.', atualizar_agora: 'Update now', baixar_mac: 'Download from GitHub', depois: 'Later', sem_novidades: 'Improvements and fixes.', falha_atualizar: 'Update failed ({e}) — try again',
    info_h: 'Tips & language',
    info: `<h4>Open and close</h4><ul>
<li><kbd>Ctrl</kbd>+<kbd>Tab</kbd> opens and closes it from anywhere, even with the game focused</li>
<li>Click the icon to open; <kbd>Esc</kbd> or clicking outside the panel closes it</li>
<li>Drag the icon to move it — its position is remembered</li></ul>
<h4>Search</h4><ul>
<li>Type a name (EN or PT-BR), a number, an element or a location</li>
<li><kbd>↓</kbd> <kbd>↑</kbd> select and <kbd>Enter</kbd> opens the entry · the <b>×</b> inside the field clears the search</li>
<li>On an entry, just start typing to search again</li></ul>
<h4>Back</h4><ul>
<li><kbd>V</kbd> key, the <b>mouse back button</b> or the <b>← back</b> link</li></ul>
<h4>On an entry</h4><ul>
<li><b>How to get</b>: combinations, highest chance first — click the <b>%</b> to edit it</li>
<li><b>👍 / 👎</b>: say whether a combination works; the number next to it is the community score</li>
<li><b>＋ New combination</b>: add something you discovered (with slime and material suggestions)</li>
<li><b>✎ Portuguese name</b> and <b>✎ number</b>: give the slime a Portuguese name and its in-game Slimepedia number</li>
<li><b>Elements</b> (collapsible): what its attacks are strong/weak against and what hurts it more/less</li></ul>
<h4>Your data (⋯)</h4><ul>
<li>Stored only on your PC and kept across updates</li>
<li>Import/export CSV in the community spreadsheet format, or back up everything as JSON</li></ul>
<h4>Collaborative database</h4><ul>
<li><b>⋯ → Send my discoveries</b> uploads your combinations, chances, votes and names</li>
<li>Once a day submissions are reviewed and approved ones are added for everyone (<b>community</b> badge); 👎 votes remove wrong ones</li>
<li>Nothing personal is sent — only a random code for this PC</li></ul>`,
    info_foot: 'Slimedex v{v} · data from the World of Slime Wiki and the community · open source at github.com/llll94/slimedex',
    err: { 'limite diário de envios atingido': 'daily upload limit reached', 'muitos envios agora, tente mais tarde': 'too many uploads right now, try again later',
      'formato inválido': 'invalid format', 'votos inválido': 'invalid votes', 'combos inválido': 'invalid combinations', 'sem conexão com a internet': 'no internet connection' }
  }
};
let LANG = (() => { try { const l = localStorage.getItem('lang'); if (l === 'pt' || l === 'en') return l } catch {} return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en' })();
function t(k, v) { let s = TXT[LANG][k] ?? TXT.pt[k] ?? k; if (v) s = s.replace(/\{(\w+)\}/g, (_, n) => v[n] ?? ''); return s }
const erroT = e => TXT[LANG].err[e] || e; // mensagens do servidor vêm em PT
// elementos (a base guarda em PT)
const EL_EN = { Fogo: 'Fire', 'Água': 'Water', Terra: 'Ground', Vento: 'Wind', Grama: 'Grass', Metal: 'Steel', 'Elétrico': 'Electric', Gelo: 'Ice', Magia: 'Magic', Poder: 'Power', Luz: 'Light', Sombrio: 'Dark', Veneno: 'Poison' };
const elN = e => (LANG === 'en' ? EL_EN[e] || e : e);
