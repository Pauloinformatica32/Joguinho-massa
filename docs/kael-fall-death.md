# Correção de queda e morte de Kael

## Queda

`fall.png` agora contém oito cópias exatas do último quadro aéreo aprovado de `jump.png`, em células de 145×114, com transparência. É uma pose temporariamente estável: evita o tronco de reação a dano que existia na antiga sequência. Nenhuma pose foi redesenhada. Os pixels foram copiados diretamente, sem interpolação ou alteração do alfa. O teste no navegador compara cada célula com a referência.

Não foi necessário mudar o config, player.js, world.js, AnimationManager, SpriteRenderer ou HTML: a seleção jump → fall → landing já estava correta. Os sprites idle, walk/run, melee, jump, dash, damage e death permanecem inalterados. Os testes de movimento incluem salto duplo, ataque aéreo, dash e movimento horizontal.

## Morte

`Engine.beginPlayerDeath()` inicia a sequência uma única vez, sem depender da visibilidade do overlay. Marca o jogador como morto, congela velocidades, cancela ações e efeitos temporários, limpa entradas e reseta a animação uma única vez. Mantém a simulação pausada e a interface de morte oculta. Pause, mapa, laboratório de assets, ataques e interações não interrompem a sequência.

O RAF continua chamando `renderPausedDeath(dt)`. O método avança o desenho no Canvas sem física, e só abre a tela/libera o botão ao terminar o tempo calculado do config. Respawn antecipado é rejeitado também no método do Engine; o botão não despausa o jogo antes da validação.

Duração configurada: **8 quadros ÷ 8 FPS + 0,3 s = 1,3 s**. Como o último quadro começa em 0,875 s, ele permanece visível aproximadamente 0,425 s no total (sua duração normal mais a espera adicional). No navegador, a abertura foi observada entre **1,301 e 1,317 s**, conforme a cadência do RAF.

Respawn reutiliza o checkpoint e o fluxo de persistência existente, limpando estágio, timers de morte, hazardTick, entradas e ações temporárias. Nenhuma alteração no formato do save ou conteúdo de checkpoints.

## Verificação

`node tests/browser-kael-death.mjs` executou o jogo real em localhost/towerTest, usando a IA do I-9 para duas mortes e um laser real do cenário para outra. As três sequências exibiram quadros 0–7, posição fixa, interface oculta durante a animação e retorno correto ao checkpoint. Tentativas de movimento, ataque, interação, pause/mapa/laboratório e respawn antecipado não interromperam o fluxo. Também foram confirmados pulo/queda sem dano e dano real no chão/no ar, com os cinco quadros de damage. Os cenários de teste não escrevem saves da campanha.

Capturas inspecionadas e gravação em `tests/`:

- `deathfix-fall-stable.png`.
- `deathfix-damage-ground.png`, `deathfix-damage-air.png`.
- `deathfix-0-enemy-{animation,last-frame,screen}.png`.
- `deathfix-1-hazard-{animation,last-frame,screen}.png`.
- `deathfix-2-enemy-{animation,last-frame,screen}.png`.
- `deathfix-gameplay.webm`, `deathfix-results.json`.

Testes aprovados: `player-death.mjs` (4177 verificações; três ciclos em cada uma das frequências 30/60/120 FPS), `player-animation.mjs`, `dash.mjs` (4592), `combat.mjs` (159), `campaign.mjs`, `tower.mjs` (27), `cybernetics.mjs` (111), teste real de navegador, sintaxe e `git diff --check`.

## Arquivos desta tarefa

- `assets/characters/protagonist/kael/spritesheets/fall.png`.
- `js/engine.js`, `js/main.js`.
- `tools/fix-kael-fall.ps1` (cópia reproduzível da pose); `tools/prepare-kael.ps1` (aplica a correção ao reconstruir os assets).
- `tests/player-death.mjs`, `tests/browser-kael-death.mjs`.
- `tests/browser-campaign.mjs`: cenário de respawn adaptado para respeitar os dois estágios; a suíte completa de navegador de campanha não foi executada nesta tarefa.
- Este relatório e as evidências acima.

Alterações anteriores dos inimigos foram preservadas. Sem commit ou push.
