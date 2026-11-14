# Retratos nos diálogos de Nova Aurora

## Assets e associações

Os cinco PNGs de 627×627 foram copiados sem alteração de `Retratos_Nova_Aurora_Pixelados.zip` para:

| Falante | Arquivo |
| --- | --- |
| Kael | `assets/ui/portraits/kael.png` |
| Yara | `assets/ui/portraits/yara.png` |
| Oren | `assets/ui/portraits/oren.png` |
| Dra. Íris Vale | `assets/ui/portraits/iris.png` |
| Téo | `assets/ui/portraits/teo.png` |

`js/dialogue-portraits.js` centraliza caminhos, IDs e aliases (incluindo protagonist, scientist, oren-slum/factory, teo-factory e os nomes completos com títulos). A resolução normaliza caixa/acentos e usa correspondências exatas, sem atribuir Kael a falantes desconhecidos. Também aceita `speakerId` em cada fala. Não foi necessário alterar os textos de `dialogue.js`.

## Interface

O diálogo existente recebe o retrato à esquerda, com moldura ciano/magenta, nome acima do texto e controles originais. Cada avanço atualiza o retrato pelo falante daquela fala, inclusive Yara → Kael → Yara. Fechar limpa imagem, nome, texto e índice temporários. Falantes sem cadastro ocultam a área; erro de imagem mantém uma moldura neutra sem interromper o diálogo.

Retratos de 96×96 no desktop e 64×64 no mobile, `object-fit: cover`, `image-rendering: pixelated`, sem filtros. O painel de conversa ocupa a parte inferior da viewport; textos longos têm rolagem vertical. Há limites de largura/altura e colunas com `minmax(0,1fr)` para evitar transbordamento. O painel de rede mantém sua estrutura anterior; a ajuda remota reaproveita o mesmo renderizador de retrato e estilo, com 64×64, sem modificar pergunta, quatro opções, hint, respostas ou recompensas.

Somente o fechamento do diálogo foi ajustado no Engine, para chamar a limpeza de UI. Não houve mudanças nesta tarefa em movimento, colisão, combate, sprites, falas, flags ou saves.

## Testes

- `node tests/dialogue-portraits.mjs`: IDs, aliases, desconhecidos e os cinco PNGs aprovados.
- `node tests/browser-dialogue-portraits.mjs`: 17 verificações de apresentação; conversas reais com Yara, Oren, Íris e Téo; resposta de Kael; avanço pelo botão e Enter; fechar/reabrir; troca de NPC; desconhecidos; tratamento de erro simulado; os cinco retratos decodificados; dica remota com quatro alternativas e estado intacto. Zero erros de console.
- Viewports: 1280×900, 390×640, 320×568 e 640×360. Sem overflow horizontal, distorção, retrato sobre texto ou botões fora da largura do painel. Texto longo pode exigir rolagem vertical.
- `node tests/browser-network.mjs`: aprovado. Testa as dicas antes e depois de erros nos 12 terminais (344 verificações de assistência), perguntas, recompensas, inventário, controles, persistência, EMP, elevadores e responsividade. Sem exceções JS.
- `node tests/browser-oren.mjs`: 49 verificações aprovadas, incluindo conversa, loja, compras e regressão de Yara.
- `yara-dialogue.mjs`, `yara-hints.mjs` (93), `oren.mjs`, `network-terminals.mjs` (159): aprovados.
- Sintaxe dos módulos e `git diff --check`: aprovados.

Limitação de teste encontrada: `node tests/browser-yara.mjs` é anterior à progressão atual dos terminais e falha em “single existing Yara preserved”, pois exige `n.ability === 'hook'`. O código atual em `network-terminals.js` remove essa entrega direta para conceder o gancho no tutorial. Nenhuma alteração foi feita nessa mecânica ou nesse teste legado. O fluxo atual foi validado pela suíte de rede e pelo teste específico dos retratos. Não foram identificadas pendências funcionais dos retratos nas verificações realizadas.

## Evidências visuais inspecionadas

Em `tests/`: `portraits-yara-desktop.png`, `portraits-kael-desktop.png`, `portraits-oren-desktop.png`, `portraits-iris-desktop.png`, `portraits-teo-desktop.png`; `portraits-{yara,kael}-{390x640,320x568,640x360}.png`; `portraits-yara-hint-desktop.png`, `portraits-yara-hint-mobile.png`; `portraits-results.json`.

## Arquivos desta tarefa

- Criados: os cinco PNGs em `assets/ui/portraits/`, `js/dialogue-portraits.js`, `css/dialogue-portraits.css`.
- Alterados: `index.html`, `js/ui.js`, `js/network-hacking.js`, `js/engine.js` (apenas limpeza do diálogo nesta tarefa).
- Testes: novos `tests/dialogue-portraits.mjs`, `tests/browser-dialogue-portraits.mjs`; atualizado `tests/yara-assistance-browser-cases.js` para esperar o retrato dedicado em vez do sprite 21×60.
- Evidências: os arquivos `tests/portraits-*` acima, `tests/network-browser-results.json`, capturas regeneradas em `tests/network-screenshots/`, `tests/oren-preview.png`, `tests/oren-shop-preview.png` e este relatório.

Alterações de tarefas anteriores no workspace foram preservadas. Nenhum commit ou push.
