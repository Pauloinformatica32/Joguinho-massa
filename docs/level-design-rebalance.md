# Nova Aurora — reorganização de rotas e checkpoints

Implementado no mapa local, sem aumentar o mundo: **15600×900**, com o limite superior já existente de -720. A física, sprites, controles, ataques, dimensões das arenas e as 12 perguntas foram preservados.

## 1. Auditoria da geometria realmente gerada

Antes de editar, foi executado `buildMap()` completo, após `buildTower()`, `expandWorld()` e a associação de terminais. O resultado original está em `tests/level-design-before.json`. O resultado atual está em `tests/level-design-after.json`.

| Elemento | Antes | Agora |
| --- | ---: | ---: |
| Plataformas/solids | 146 | 88 |
| Âncoras | 36 | 33 |
| Checkpoints físicos | 12 | 9 |
| Terminais | 21 | 21 |
| Recompensas/segredos | 13 | 13 |

As definições de abrigos em map.js, world-design.js e tower-layout.js foram substituídas pelo registro único `js/checkpoints.js`. As escadarias adicionais de expandWorld foram removidas. As plataformas/âncoras de exploração agora estão em `js/level-routes.js`; map.js mantém chão, coberturas e arenas; tower-layout.js mantém os andares, paredes, barreiras, elevadores e objetos de história. O renderizador arquitetônico usa as posições finais das plataformas e âncoras para seus suportes.

**X=5390:** a duplicata relatada existia como sobreposição de fontes, mas não no resultado combinado que encontrei: a filtragem de map.js já eliminava uma delas. Não contei uma duplicata inexistente como remoção. Agora há uma única definição, um ID e uma instância final.

## 2. Checkpoints antes e depois

| Região/andar | Lista original (X) | Lista atual (X) |
| --- | --- | --- |
| Setor 9 | 310, 680, 1440 | 310, 1440 |
| Industrial | 2570, 3330, 4380 | 2570, 4380 |
| Torre 1 | 5390, 7050 | 5390, 7050 |
| Torre 2 | 9090, 11200 | 9090, 11200 |
| Torre 3 | 13520, 13810 | 13810 |

- **310:** entrada e retorno a Yara; 680 duplicava o corredor seguro do tutorial e foi consolidado aqui.
- **1440:** após os telhados, antes de Matrona. Ao ativá-lo com o gancho adquirido, libera a passagem de retorno pelo bloqueio (`s9-quarantine-return`). A primeira subida continua obrigatória; o tutorial mantém seu bloqueio independente de altura.
- **2570:** chegada à fábrica. 3330 ficava sobreposto à cobertura sólida de X=3260–3340; migra para este abrigo.
- **4380:** depois da manutenção/contenção, antes de Warden.
- **5390:** entrada da segurança corporativa, com floor ID correto.
- **7050:** recuperação entre as duas partições, após a primeira seção de segurança.
- **9090:** chegada ao laboratório.
- **11200:** após a primeira barreira EMP, antes da segunda seção vertical.
- **13810:** após a subida do núcleo, imediatamente antes de Véspera. O antigo 13520 foi consolidado aqui.

Matrona, Warden e Véspera mantêm abrigos fora da arena e imediatamente antes do combate. Não é preciso repetir a subida para tentar novamente o boss.

A primeira chegada ao andar 3 usa um **spawn transitório em X=13210**, junto ao elevador, com ID `tower-core-arrival`. Não é outro checkpoint físico, não tem quiosque nem ativação. Evita conceder o abrigo de X=13810 antes de o jogador fazer a subida. Depois de ativar 13810, as próximas viagens preservam esse abrigo avançado.

## 3. Rotas principais e opcionais

**Setor 9:** chão/balcões iniciais → Yara → pergunta existente de DNS → gancho fácil a partir do terminal → telhado de recuperação largo → terminal dos telhados → passarela superior → travessia por cima do bloqueio → abrigo de Matrona. O ramo da antena comunitária tem três patamares e destino claro: registro e recompensas. O abrigo pré-boss abre o retorno pelo portão, sem exigir outra escalada para voltar a Yara/Oren. O atalho de passarela existente foi preservado.

**Industrial:** entrada e Oren → montagem/M-4 → registro e Téo → manutenção/Íris → passarelas sobre refrigerante → contenção/prensa → abrigo de Warden. O ramo do guindaste leva ao registro superior; o balcão de turnos é outro destino opcional. A ponte restaurada por Téo agora ocupa **X=3980, Y=590, largura=180**, ligando os dois lados da prensa de X=4010–4080. Evita salto, gancho e exposição à prensa na volta. Chão, coberturas, espaços dos inimigos e arena de Warden foram preservados.

**Torre 1:** passagem primária pelas duas partições e pelo laser; ramo separado de vigilância/auditoria. A plataforma de fixação da S-6 permanece na altura correta (455+18=473), mantendo seu suporte e linha de tiro.

**Torre 2:** entrada → subida da primeira partição → registro viral → descida ao painel EMP → recuperação → segunda subida → descida ao segundo painel EMP → elevador. Três patamares de retorno permitem voltar às passarelas a partir do chão, sem depender de um salto de altura impossível. O segundo suporte da S-6 permanece em 445+18=463. Os ramos de funcionários/consentimento ficam do lado autorizado das barreiras. As duas barreiras continuam fechando de -720 ao chão; a rota elevada não as contorna.

**Torre 3:** manutenção → travessia da coluna de alimentação → patamar de descida baixo → abrigo pré-Véspera. Console de rede e mapa de alimentação são ramos opcionais. A coluna adicionada fica em **X=13440, Y=490, 70×300**, antes da arena; dá função à subida. Nenhum deck ou gancho foi adicionado dentro da arena de Véspera. Computador final e sequência EMP continuam acessíveis.

Os itens Dados de distribuição (3210,590) e Auditoria de vigilância (7390,-315) ficaram separados dos respectivos consoles: a prioridade de interação da pergunta não pode engolir a coleta. Todos os 13 itens foram coletados pelo Engine no teste de navegador.

## 4. Âncoras e coordenadas exatas

Cada uma das **31 âncoras de exploração** tem ID, plataforma de origem, recuperação e função explícitos. As duas âncoras de Warden conservam suas coordenadas e recarga de 3 s. As âncoras de exploração usam a recarga local existente de **4 s**, permitindo passar ao próximo ponto do relé sem o ponto inferior imediatamente recapturar o comando. Isso é configuração dos pontos; alcance **380**, impulso, energia e física globais não foram modificados.

O navegador testou a seleção normal de âncora mais próxima (`useImplant()`), incluindo relés inferiores quando necessários; não apenas chamadas diretas a activateHook(). As posições antigas sem ID foram comparadas por coordenada: a lista auditável identifica posições mantidas, removidas e novas, sem inventar correspondências de IDs que antes não existiam.

- [Auditoria completa de checkpoints e plataformas atuais](level-design-coordinate-audit.md).
- [Todas as plataformas removidas/adicionadas, com X/Y/largura/altura](level-platform-changes.csv).
- [Todas as posições de âncoras e seus destinos/funções](level-anchor-changes.csv).

O CSV registra 115 definições antigas retiradas e 57 novas; 31 geometrias foram mantidas. Isso resulta em 88 solids/decks finais, sem expandir o mundo.

## 5. Saves, viagens e retorno

- Saves continuam em versão 2 e na mesma chave. Progresso, itens, créditos, perguntas e vitórias são preservados.
- IDs estáveis e aliases migram 680→310, 3330→2570, 13520→13810; também permanecem as compatibilidades antigas de 1580/3980 e demais layouts.
- `WORLD_DESIGN=2` identifica a alteração de geometria. Um save sobre um deck antigo que não existe mais retoma num abrigo seguro do mesmo andar/região, em vez de cair num reservatório.
- Checkpoints do andar da torre são resolvidos pelo andar do jogador; uma morte não o manda para outro andar por causa de um checkpoint antigo incoerente.
- `checkpointHistory` lembra o abrigo de cada região/andar. Voltar por uma porta/elevador conserva o abrigo já ativado no destino. O histórico é validado na leitura do save.
- checkpointFor(), ativação, vitórias, travessias e chegadas usam o mesmo registro.
- Normalização foi testada em todos os 12 checkpoints originais, incluindo morte, leitura repetida e conservação de créditos/eventos. Cada um dos nove abrigos atuais foi ativado, seguido de morte, respawn e normalização no navegador.

## 6. Matemática e gameplay real

`tests/level-traversal.js` usa createPlayer/updatePlayer/moveBody/activateHook reais: gravidade 1850, salto -660, salto duplo -590, velocidade horizontal 250, dash 760 e alcance 380. O grafo separa chão por paredes e perigos, inclui aterrissagens laterais, tetos, colisões e rejeita contato com hazards nas arestas simuladas.

**93 apoios e 88 ligações de uma floresta de entrada** foram validados em 30/60/120 FPS, com habilidades por etapa. A validação de barreiras fechadas é separada da conectividade após autorização. O retorno dos laboratórios e do Setor 9 também foi validado no sentido inverso.

`tests/browser-level-routes.mjs`, com `LEVEL_REALTIME=1`, fez uma passagem de **33 ligações principais** no Engine/Canvas, aguardando frames reais. Começou na entrada do Setor 9 sem gancho/salto duplo, conversou com Yara e resolveu a pergunta real para liberar o gancho. Percorreu a fábrica e os três andares; autorizou os dois painéis e utilizou os elevadores. Bosses foram marcados derrotados nas transições para isolar a exploração; seus movesets são cobertos pelas suítes próprias. Foram carregadas **52 imagens, zero falhas/erros de assets**.

`tests/browser-level-hooks.mjs` verificou no Engine os 31 ganchos e aterrissagens, todos os NPCs principais, os 13 itens, os nove abrigos, bloqueio do tutorial mesmo acima do portão, ida/volta fábrica↔torre preservando os abrigos avançados e o desligamento final. A suíte de rede verificou todas as perguntas, recompensas e elevadores bidirecionais.

## 7. Debug e evidências visuais

**Shift+F3** alterna o overlay de level design; F3 mantém a depuração de combate. O novo overlay mostra colisores, IDs dos decks/checkpoints, círculos de 380 das âncoras, perigos, interações e marcações principal/opcional. Fica oculto no jogo normal.

Capturas do Canvas inspecionadas em `tests/`:

- `level-sector9-quarantine.png`, `level-matrona-checkpoint.png`.
- `level-factory-coolant.png`, `level-factory-service-hook.png`, `level-factory-crane-3.png`, `level-warden-checkpoint.png`.
- `level-security-route.png`, `level-security-archive-3.png`.
- `level-lab-route.png`, `level-lab-employees-hook.png`, `level-lab-consent-2.png`.
- `level-core-ascent.png`, `level-core-terminal-hook.png`, `level-vespera-checkpoint.png`.
- `level-design-overlay.png`.

Resultados reproduzíveis: `level-browser-results.json`, `level-hooks-results.json`, `level-traversal-results.json`, e os snapshots before/after.

## 8. Regressões e limites

Aprovados: level-design, world-design (30/60/120), factory, tower, campaign, sector9, network-terminals, tower-enemies, M-4, Matrona, Warden, Warden arena/rework, Véspera, animação/dash/morte do jogador, testes de navegador de rotas/ganchos/rede e git diff --check. Os testes antigos que fixavam plataformas/âncoras removidas foram atualizados para a geometria nova, sem retirar seus testes de combate/persistência.

**Limite de avaliação:** a execução de exploração usa invulnerabilidade e vitórias de boss como fixtures, não representa uma campanha inteira jogada manualmente com HP normal. No percurso automatizado, a entrada→pré-Matrona levou aproximadamente 12 s e a seção industrial aproximadamente 20 s; são tempos de travessia sem lutar ou ler. Não afirmo que todas as distâncias tenham sido medidas como 30–90 s de combate real. O trecho de ensino foi deliberadamente curto; a dificuldade final e o tempo humano entre checkpoints ainda merecem playtest. Não foram encontrados bloqueios de travessia, coleta ou respawn nos cenários testados.

## 9. Arquivos desta tarefa

Runtime: novos `js/checkpoints.js`, `js/level-routes.js`, `js/level-debug.js`; alterados `js/map.js`, `js/world-design.js`, `js/tower-layout.js`, `js/campaign.js`, `js/save.js`, `js/tower.js`, `js/region-transitions.js`, `js/engine.js`, `js/world.js`, `js/main.js`.

Validação: novos `tests/level-design.mjs`, `tests/level-traversal.js`, `tests/level-browser.js`, `tests/level-hooks-browser.js`, `tests/browser-level-routes.mjs`, `tests/browser-level-hooks.mjs`; ajustes em `tests/world-design.mjs`, `tests/factory.mjs`, `tests/tower.mjs`, `tests/network-browser-cases.js`; `scripts/report-level-design.mjs`, relatórios/CSVs e evidências acima. A suíte de rede também regenera suas capturas/resultados existentes.

As alterações anteriores do workspace foram mantidas. Nenhum sprite foi alterado nesta tarefa. Sem commit ou push.
