# Animações melhoradas da Torre Aurora

As seis folhas foram copiadas byte a byte de `Torre_Aurora_Animacoes_Melhoradas.zip` para os caminhos de runtime existentes. Nenhum idle foi substituído. Os três idles foram comparados com HEAD e permanecem idênticos.

## Integração

- I-9 e H-0: walk/attack com 8 células de 160×192.
- S-6: walk/attack com 6 células de 128×96.
- Os configs existentes foram mantidos. Única alteração: `animations.attack.nativeFacing: 1` no I-9 e H-0. As folhas novas estendem o braço de ataque para a direita, ao contrário da orientação nativa de idle/walk. A exceção por animação alinha o golpe com o lado da hitbox, sem alterar escala, origem, colisão ou orientação das outras animações.
- `walkTime` agora avança somente quando há deslocamento físico, ou rastreamento da S-6. A fase fica preservada durante idle, windup e recovery; desenhar várias vezes não avança nem reinicia a animação. O relógio de efeitos continua independente.
- O I-9 atinge no quadro 4 (índice começando em zero), o H-0 nos quadros 3–5, e a S-6 nos quadros 3–4. Janelas de dano, hitboxes, dano, velocidades, cooldowns, posições de spawn e progressão não foram alterados.
- S-6 permanece na posição original, com compensação do suporte ao espelhar. O laser longo, sua mira, colisão com obstáculos e dano continuam no Canvas; a folha contém apenas o efeito curto da lente.
- Nearest-neighbor permanece ativo. Nenhum arquivo de Kael, Matrona, Warden, Véspera ou de outras mecânicas foi modificado nesta integração.

## Verificação dentro do jogo

`node tests/browser-tower-upgraded.mjs` executa o RAF e o caminho real Engine → World → renderEnemy → renderTowerEnemy → SpriteRenderer em localhost/towerTest, sem avançar manualmente os quadros dos inimigos. Aproxima o alvo para deixar a própria IA iniciar os ataques. Usa HP/invulnerabilidade de teste, sem salvar a campanha. Cada inimigo foi observado dos dois lados.

Resultados: os humanoides exibiram todos os 8 quadros de walk e attack nas duas direções; S-6 exibiu os 6 de cada animação nas duas direções, sem sair do suporte. Nenhuma falha de draw ou coordenada inválida. As amostras de impacto ocorreram no quadro 4 para I-9 e 3 para H-0/S-6. As seis capturas de combate foram inspecionadas visualmente.

Evidências em `tests/`:

- `upgraded-tower-enemies.webm`: gravação em tempo real dos seis cenários.
- `upgraded-interceptor_i9-left.png` e `upgraded-interceptor_i9-right.png`.
- `upgraded-synaptic_h0-left.png` e `upgraded-synaptic_h0-right.png`.
- `upgraded-optic_s6-left.png` e `upgraded-optic_s6-right.png`.
- `upgraded-tower-results.json`: quadros, direção, posição e janela ativa de cada cenário.
- `tower-enemies-atlas-preview.png`: todos os quadros, alternando direções.

Testes aprovados:

- `node tests/tower-enemies.mjs`: 430 verificações em 30/60/120 FPS, incluindo relógio sem reinicialização e sincronização de dano.
- `node tests/browser-tower-enemies.mjs`: 176 verificações de carregamento, transparência, recortes, espelhamento e suporte fixo.
- `node tests/browser-tower-upgraded.mjs`: seis cenários reais de IA/renderização aprovados.
- `node tests/combat.mjs`: 159 verificações.
- `node tests/tower.mjs`: 27 verificações de travessia/persistência.
- Sintaxe de `js/tower-enemies.js` e `git diff --check`: aprovados.

## Limitações da arte fornecida

- Os ataques de I-9 nos quadros 3–5 e H-0 nos quadros 4–5 alcançam a última coluna da célula (X=159). Há risco visual de ponta/efeito truncado na origem. Não ampliamos nem redesenhamos as imagens.
- O braço ataca para a direita enquanto o rosto da arte original aponta para a esquerda. A correção de orientação por animação preserva o lado do golpe, mas uma mudança do tronco/rosto ainda é perceptível ao entrar/sair do ataque. Para eliminar isso por completo, a própria folha precisa manter rosto, tronco e membro atacante coerentes com a orientação nativa original.
- As rotações articuladas têm algumas junções rígidas em ombros/pernas; os pés dos humanoides oscilam cerca de 1–2 pixels de jogo. Não foi identificada falha de transparência ou fundo opaco. Isso não é uma validação artística de cada pixel.

## Arquivos desta tarefa

Runtime: as seis folhas `walk.png`/`attack.png` de `assets/enemies/{interceptor_i9,synaptic_h0,optic_s6}/`; os configs de I-9 e H-0; `js/tower-enemies.js`.

Verificação: `tests/tower-enemies.mjs`, `tests/tower-enemies-browser.js`, `tests/tower-enemy-assets.json`, `tests/browser-tower-upgraded.mjs`, as evidências acima e este relatório. O teste de integridade passou a usar fingerprints dos assets instalados, sem depender da pasta de extração antiga que já estava removida no workspace antes desta tarefa.

Nenhum commit ou push realizado.
