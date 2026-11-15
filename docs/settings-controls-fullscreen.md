# Configurações de controles e vídeo

## Implementação

O início e a pausa abrem o mesmo painel existente, com abas CONTROLES e VÍDEO. As 15 ações configuráveis são esquerda, direita, baixo, salto duplo/salto, ataque, dash, gancho/EMP, interação, três seleções de implante, alternância, ativação, mapa e pausa. Os padrões existentes, setas, clique de ataque e Escape de emergência foram preservados.

`ActionInput` traduz `KeyboardEvent.code` em ações; o motor e os comandos de interface consomem essas ações. Shift esquerdo/direito são equivalentes. Eventos discretos não repetem ao segurar a tecla. Captura, menus, diálogos, quizzes, perda de foco e transições de tela cheia isolam ou limpam a entrada. Nos quizzes, 1–4 continuam independentes dos controles do jogo.

Conflitos exigem confirmação. Ao substituir uma tecla, a outra ação mantém alternativas ou recebe a tecla anterior da ação remapeada, explicitada no aviso. Nenhuma ação fica sem teclado. Restaurar padrões também exige confirmação. Escape cancela captura; F3, G e atalhos do navegador ficam reservados.

Preferências versionadas e validadas usam exclusivamente `nova-aurora-settings-v1` no localStorage. Nova Jornada, morte, respawn e campanha não apagam essa chave. Dados inválidos recuperam os padrões. Prompts Canvas, rodapé, HUD de implantes e instruções de diálogo consultam as preferências.

## Tela cheia

A Fullscreen API é solicitada somente por clique/ativação do usuário na `.stage`. Há controles no cabeçalho, na aba VÍDEO e dentro da tela cheia. `fullscreenchange` sincroniza rótulos e limpa teclas. Falhas e ausência da API têm mensagens próprias; nenhuma transição reinicia o jogo.

Canvas mantém 960×540 lógicos. CSS ajusta apenas a apresentação para 16:9 com barras pretas, pixels nítidos e HUD alinhado aos limites visuais do Canvas. Menus continuam roláveis em telas pequenas. Não houve alterações em coordenadas, colisões ou câmera.

## Arquivos desta tarefa

- Criados: `js/input.js`, `js/settings-ui.js`, `js/display-mode.js`, `css/settings.css`.
- Alterados: `index.html`, `js/main.js`, `js/engine.js`, `js/ui.js`, `js/network-hacking.js`, `js/world.js`, `js/tower.js`, `js/region-transitions.js`, `js/tower-core-visuals.js`.
- Testes: `tests/input-settings.mjs`, `tests/browser-settings.mjs`, `tests/settings-browser-results.json` e capturas `tests/settings-*.png`.
- Relatório: este arquivo. Testes de regressão também atualizaram suas capturas/resultados existentes.

## Verificação

Edge real em modo headless, com cliques e teclas via CDP: 51 verificações aprovadas, zero exceções JavaScript. Inclui todas as ações remapeadas no motor real; conflitos; restauração; persistência; Nova Jornada; morte/respawn; save existente; quiz e ajuda da Yara; diálogo; entrada/saída efetiva de tela cheia; clique de ataque em tela cheia; API indisponível/rejeitada; limpeza de teclas e alinhamento do HUD. Viewports 1280×900, 390×640 e 640×360.

Capturas inspecionadas: `settings-controls-desktop.png`, `settings-controls-390x640.png`, `settings-game-fullscreen.png`. Também foram geradas capturas de conflito, tela cheia no título e layout 640×360.

Regressões aprovadas: input-settings, player-animation, player-death (4177), dash (4592), campaign, cybernetics (111), implant-equipment (85), network-terminals (159), yara-hints (93), dialogue-portraits, tower (27), tower-enemies (430), vespera (3802), level-design. Browser-network passou nas 12 questões, ajuda da Yara, implantes, saves, EMP e elevadores; browser-dialogue-portraits passou em 17 vistas, sem erros.

## Limites

A versão local não possui descida por plataformas. Baixo + Salto remapeados estão expostos e testados na camada de ações; nenhuma física nova foi introduzida. O menu informa isso.

Fullscreen depende de suporte, permissão e gesto do usuário. Escape/F11 podem ser tratados pelo navegador; F11 não é interceptado. A saída externa da API foi testada; o comportamento nativo de Escape deve ser conferido também em navegadores com janela. Não houve teste em Safari/iOS, Firefox ou aparelhos físicos. Nenhum commit ou push foi feito.
