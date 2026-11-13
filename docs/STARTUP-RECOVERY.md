# Recuperação da inicialização após pull

## Causa reproduzida

O pull de `origin/main` iniciou um merge de `2a42c61240405baded9e2e261d63845e6eae77d5` sobre o commit local `f1db881` e deixou oito arquivos sem resolução. Não havia rebase em andamento. O ancestral comum era `c8c0611`. O ramo local tinha um commit exclusivo; o remoto tinha `c307c06` e `2a42c61`.

O HTML carregava normalmente e apontava para `js/main.js`, mas o import estático de `js/engine.js` falhava na linha 1: `SyntaxError: Unexpected token '<<'`. Marcadores de conflito em cinco módulos JS impediam a execução de `main.js`; os dois botões tinham `onclick === null`. Também havia JSON inválido na configuração de Íris e dois conflitos binários.

## Resolução

Foram combinadas as alterações locais da torre e remotas de inimigos, Warden e NPCs, sem substituir arquivos inteiros de gameplay por uma versão antiga:

- `js/engine.js`: imports da torre, E-7 e V-3; câmera da torre; limpeza dos novos efeitos de Warden; interação de Téo; recompensa EMP pós-Warden; resets dos inimigos e da torre.
- `js/bosses.js`: arena de Véspera no terceiro andar e estado inicial atualizado de Warden.
- `js/enemies.js`: encontros dos três andares e integrações M-4/E-7/V-3.
- `js/map.js`: construção da torre, NPC Téo, plataformas e ganchos recentes de Warden.
- `js/config/assets.js`: registros dos recursos das duas versões, incluindo Téo.
- `assets/characters/npcs/iris/config.json`, `assets/characters/npcs/iris/idle.png` e `tests/iris-preview.png`: par coerente da versão remota mais recente de Íris, 43×124, escala 0,48. A versão local 40×64 continua no commit local e no backup.

Acrescentado `tests/browser-startup.mjs`: reprodução do erro com `--diagnose` e testes da interface real via CDP. `--regressions` inclui as páginas de teste de M-4, E-7, V-3, Íris, Téo e a suite da torre. O teste de V-3 (`tests/v3-browser.js`) passou a contar drones somente na região industrial, já que a torre local também possui um drone. A expectativa continua exigindo exatamente um V-3 no local original.

`index.html`, `js/main.js` e `js/save.js` não precisaram de alterações. A chave e o formato dos saves foram mantidos.

## Proteção do histórico e dos dados

Antes das edições, foram guardadas as versões local/remota/de trabalho dos oito conflitos, o índice Git e os metadados do merge em:

`C:\Users\PAULOO~1\AppData\Local\Temp\nova-aurora-pre-startup-fix-umdmsx85`

Nenhum commit foi criado, apagado, reescrito ou enviado. Não foram usados reset, clean, abort, rebase, checkout de ramo ou pull adicional. `HEAD` permanece `f1db881`; `origin/main` permanece `2a42c61`. O merge fica aberto, aguardando uma decisão do usuário sobre o commit. As alterações já integradas automaticamente pelo pull foram preservadas.

Os oito arquivos conflitantes foram marcados como resolvidos no índice após os testes. A lista de arquivos não resolvidos está vazia. O novo teste de inicialização, este relatório e o ajuste do teste de V-3 permanecem disponíveis na árvore de trabalho, sem commit.

Os testes de navegador criam um contexto descartável isolado no Edge. Somente esse contexto recebe um save sintético para testar CONTINUAR e reload. O contexto é descartado ao terminar; o localStorage do navegador normal não é acessado nem alterado. Os testes Node usam armazenamento em memória.

## Verificações concluídas

- Reprodução no endereço solicitado `http://127.0.0.1:5500/index.html`: erro de sintaxe e botões sem handlers antes da resolução.
- `node tests/browser-startup.mjs --regressions`: 10 verificações de nova jornada, CONTINUAR com save válido, movimento, salto, reload repetido, conservação do save, ausência de exceções fatais e recursos HTTP sem falhas. Também aprovados M-4 (490 verificações próprias, 159 de combate e 4592 de movimento), E-7 (939), V-3 (1844), Íris (14), Téo (39) e torre (37 + 4592 de movimento).
- `tests/tower.mjs`, `tests/campaign.mjs`, `tests/factory.mjs`, `tests/warden.mjs`, `tests/warden-rework.mjs`, `tests/warden-arena.mjs`, `tests/warden-selection.mjs`, `tests/sector9.mjs`, `tests/matrona.mjs`, `tests/m4.mjs`, `tests/combat.mjs` e `tests/dash.mjs`: aprovados.
- Sintaxe dos 37 módulos JavaScript em `js/` e leitura de todos os JSON de assets: aprovadas.
- Busca de marcadores de conflito nos códigos/configurações e `git diff --check`: sem problemas de conteúdo.

## Observações

O commit local continua sem push. A conclusão do merge depende de um commit posterior autorizado pelo usuário; nenhuma operação remota foi realizada. Os testes de CONTINUAR usam um save sintético válido, não um save pessoal. Como os dois computadores possuem históricos divergentes, a sincronização entre eles deve ocorrer depois da conclusão deliberada deste merge. Pode ser necessário recarregar a página no navegador que ainda estiver exibindo a versão anterior dos módulos.
