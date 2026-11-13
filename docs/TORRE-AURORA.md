# Torre Aurora — protótipo de três andares

Os andares são seções lógicas isoladas dentro da região `corporate`, conservando os IDs das três regiões, salas 6/7/8, física horizontal e versão 2 do save. A viagem de elevador representa a mudança de altura; não existe corredor entre os andares. Todas as coordenadas abaixo são coordenadas de mundo. O piso permanece em Y=790 e a altura útil do mundo é 900 px.

| Andar | Limites X | Dimensão | Checkpoint X | Identidade / rota |
| --- | --- | --- | --- | --- |
| `tower_floor_1` | 5200–8400 | 3200 × 900 | 5390 | Segurança ciano, divisórias, plataformas em vários níveis e arquivo opcional elevado |
| `tower_floor_2` | 8800–12600 | 3800 × 900 | 9090 | Contenção vermelha, tanques, rota elevada, gancho, plataforma instável e barreiras temporárias |
| `tower_floor_3` | 13000–15600 | 2600 × 900 | 13520 | Servidores, aproximação curta e arena final |

Checkpoints aparecem no piso. A posição de respawn é `(checkpointX, 790 − alturaKael − 3)`, normalmente Y=733. Cada chegada também seleciona o checkpoint seguro do destino; E restaura vida/energia no abrigo.

| Elevador | Painéis X / Y | Chegadas X / Y |
| --- | --- | --- |
| `tower_elevator_1_2` | 8190 e 8940 / 790 | 8130 e 8990 / 733 |
| `tower_elevator_2_3` | 12370 e 13150 / 790 | 12310 e 13210 / 733 |

E interage até 86 px horizontalmente e 90 px do piso. A primeira autorização consulta `abilities.emp`, não consome o implante nem energia e persiste o ID do elevador em `events`. Depois disso, ambos os sentidos funcionam sem nova autorização. A sequência dura 1,5 s, abre as portas, mostra faíscas e oculta o reposicionamento. Não atualiza combate, inimigos, dano ou entrada de movimento durante a viagem; há proteção breve na chegada. Paredes altas e limites de posição impedem alcançar outro andar pulando ou usando o gancho.

## Câmera, exploração e combate

`Camera.region` limita a câmera ao andar ativo. O controle da torre atualiza a câmera imediatamente na viagem, no respawn e na seleção de teste. A arena de Véspera usa X=13900–15300, piso Y=790, spawn X=14960. O checkpoint fica 380 px antes da entrada. A arena trava os dois lados durante o combate; a câmera usa a mesma lógica de arena dos outros chefes. Véspera conserva seus ataques e visuais existentes.

As distâncias entre as seções tornam os pontos de gancho de outros andares inalcançáveis. Inimigos distantes usam a suspensão existente. Os encontros ficam longe das chegadas; o terceiro andar não recebe patrulhas extras. As barreiras de laboratório em X=10620 e X=12020 possuem painéis em X=10540 e X=11940, Y=790. E com EMP desativa cada barreira por 9 s, com acesso aos controles pelos dois lados para permitir o retorno. A barreira aguarda Kael sair da sua área antes de se recompor.

## Progressão e terminais

Warden continua concedendo a credencial e sobrecarga. O EMP passa a ser entregue exclusivamente por Íris depois da vitória sobre Warden; a primeira conversa explica que Kael deve retornar. EMP já existente em saves antigos é preservado. A saída esquerda do primeiro andar permanece aberta para retornar ao complexo sem EMP.

Terminais da torre:

- `tower-security-log`: X=6230, Y=245.
- `log-3`: X=9960, Y=330, preserva o ID do registro da campanha.
- `tower-log-employees`: X=10150, Y=210.
- `tower-log-vespera`: X=11530, Y=330.
- `tower-lab-barrier-1` e `tower-lab-barrier-2`: painéis acima.
- `tower-central-shutdown`: X=15440, Y=790, após a arena.

Matar Véspera limpa o combate e libera o acesso ao computador, mas não dispara o final. E no computador exige EMP e a morte de Véspera, executa o desligamento e então adiciona `tower-central-shutdown` e `ending`. O fluxo existente de final é reutilizado. Textos dos novos terminais estão em português brasileiro.

## Save e compatibilidade

O save mantém a chave `nova-aurora-save-v1`, a versão 2 e todos os eventos anteriores. Acrescenta `towerLayout: 1` e `towerFloor`; elevadores, leituras, uso de painéis e desligamento usam IDs estáveis em `events`. Os chefes e `abilities.emp` continuam nos campos originais. Timers temporários de barreira não persistem; voltam à condição protegida após carregar. Posições antigas da torre sem `towerLayout` retornam à entrada segura do primeiro andar. Campanhas antigas já encerradas preservam o final e recebem o evento de desligamento correspondente. A migração legada v1 continua funcionando.

O normalizador valida checkpoints contra o mapa e corrige o abrigo para o andar físico de Kael quando necessário. Saves de morte usam o checkpoint salvo. Desbloqueios não se duplicam, e respawn não recria elevadores.

## Arquivos

Criados: `js/tower-layout.js` (geometria e definições), `js/tower.js` (interação, transição, câmera e desenho), `tests/tower.mjs`, `tests/tower-cases.js`, `tests/browser-tower.mjs` e este relatório. O teste de navegador produz `tests/tower-lab-preview.png`.

Alterados: `js/map.js`, `js/world.js`, `js/engine.js`, `js/camera.js`, `js/campaign.js`, `js/bosses.js`, `js/enemies.js`, `js/save.js`, `js/main.js`. Expectativas em `tests/campaign.mjs` e `tests/factory.mjs` foram ajustadas para a nova largura do mundo, localização do núcleo e checkpoint por andar. A alteração local anterior em `js/config/assets.js` e os arquivos de Íris foram preservados. Não há `js/progression.js`; a progressão existente está em `js/campaign.js`. Física, controle do jogador e arte não foram reconstruídos.

## Testes executados

- `node tests/tower.mjs`: 27 verificações de gancho, salto duplo, colisão, persistência real com armazenamento em memória, saves de morte e isolamento do modo de teste, a 30/60/120 FPS.
- `node tests/browser-tower.mjs`: 37 verificações no Edge via CDP, incluindo negação sem EMP, autorização, retorno sem nova autorização, quatro viagens, barreiras temporárias, checkpoint/reload/respawn nos três andares, câmera, ativação/trava da arena, desligamento condicionado a EMP, recompensa de Íris e migração da torre antiga. Executa também 4592 verificações existentes de movimento.
- `node tests/sector9.mjs`, `node tests/matrona.mjs`, `node tests/factory.mjs`, `node tests/warden.mjs`, `node tests/campaign.mjs`: aprovados, incluindo chefes e movimentação a 30/60/120 FPS, vinte cenários de migração legada e câmera.
- `node tests/combat.mjs`: 159 verificações aprovadas.
- `node tests/dash.mjs`: 4592 verificações aprovadas.
- Verificação de sintaxe dos módulos alterados e `git diff --check`.
- Captura do laboratório inspecionada visualmente no navegador.

O teste de navegador requer servidor local na porta 8765 e navegador com CDP na porta 9222. Os testes usam sessões descartáveis e não escrevem no save normal do navegador.

## Modo de desenvolvimento

Somente em `localhost` ou `127.0.0.1`, abrir `index.html?towerTest=1` inicia uma sessão de teste com saves desativados. No console:

```js
towerTest.floor(1);          // 1, 2 ou 3
towerTest.emp(true);         // false para negar acesso
towerTest.elevator(1);       // 1 ou 2; segundo argumento true para retorno
towerTest.final();           // simula vitória e tenta o computador; EMP ainda exigido
```

Sem esse parâmetro, a API não é instalada. Seleção de andar não concede EMP. O modo de teste marca os chefes anteriores como vencidos somente na sessão descartável. O guard em `saveGame` impede inclusive os salvamentos automáticos dessa sessão.

## Validação manual pendente e limites

Ainda é necessário jogar os três andares continuamente, percorrer as rotas opcionais com teclado, ajustar o equilíbrio dos inimigos e tempo das barreiras e derrotar Véspera manualmente. A validação automatizada da sequência final simula a vitória; as suites de chefes exercitam os ataques e dano existentes. Não foi feita uma campanha completa do início aos créditos por um jogador humano.

Os interiores, portas, tanques e computador são geometria Canvas provisória; não há arte externa nova. A elevação dos andares é lógica, apresentada pelos elevadores, e não um mundo vertical contínuo. Barreiras temporárias perdem o timer ao carregar. Véspera continua com o encontro funcional existente, sem redesign ou novos ataques. O acabamento cinematográfico, novos inimigos e arte final permanecem fora desta implementação.
