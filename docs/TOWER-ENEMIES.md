# Inimigos da Torre Aurora

I-9, S-6 e H-0 foram integrados somente aos sete slots já existentes dos andares 1 e 2. Nenhum inimigo foi acrescentado ao núcleo de Véspera. Os IDs originais dos slots foram preservados para não duplicar recompensas de créditos em saves existentes.

O pacote estava em `Torre_Aurora_3_Inimigos_Sprites/assets/enemies/`; as três pastas ainda não existiam no diretório ativo `assets/enemies/`. Os nove PNGs foram copiados integralmente, sem edição, recorte, redimensionamento ou remoção de transparência. Os configs de referência foram convertidos para o esquema real `sheet`, `columns`, `count`, `frameWidth`, `frameHeight`, `origin`, `scale`, `collision`.

## Arquivos desta integração

- `js/tower-enemies.js`: configurações de combate e posicionamento, máquinas de estado, colisão de feixes, ataques, desenho, morte e respawn.
- `js/enemies.js`: atribuição dos slots e despacho de atualização/renderização somente para os novos asset IDs.
- `js/config/assets.js`: registro dos três assets na região corporativa/núcleo, usando o carregador existente.
- `js/combat-debug.js`: caixas de ataque, segmento do laser e estado no F3.
- `assets/enemies/interceptor_i9/`, `optic_s6/`, `synaptic_h0/`: nove PNGs copiados e três configs adaptados.
- `tests/tower-enemies.mjs`, `tests/tower-enemies-browser.js`, `tests/browser-tower-enemies.mjs`: testes novos.
- `tests/tower-enemies-atlas-preview.png`: todos os quadros e exemplo do laser na geometria real.
- Este relatório.

Os arquivos de Véspera, Warden, M-4, E-7, V-3, save, física, controles e engine não foram alterados nesta integração. As mudanças de Véspera que já estavam na árvore de trabalho foram preservadas. Não houve commit, reset ou push.

## Configurações visuais

| Inimigo | Quadro original | Escala uniforme | Retângulo desenhado | Colisor | Origem |
| --- | --- | --- | --- | --- | --- |
| Interceptor I-9 | 160×192 | 0,36 | 58×69 | 26×60 | (80; 182), pés |
| Sentinela Óptica S-6 | 128×96 | 0,60 | 77×58 | 42×44 | (64; 10), suporte no teto |
| Protótipo Sináptico H-0 | 160×192 | 0,36 | 58×69 | 28×60 | (80; 182), pés |

Todos usam `nativeFacing: -1`; o mesmo renderer espelha a imagem, sem esticá-la. Nearest-neighbor permanece ativo. As caixas são menores que o retângulo transparente completo; os efeitos desenhados nos PNGs não viram colisão corporal.

| Inimigo | Idle | Walk / tracking | Attack |
| --- | --- | --- | --- |
| I-9 | 1 quadro, 1 FPS, loop | 8 quadros, 10 FPS, loop | 8 quadros, 12 FPS, sem loop |
| S-6 | 1 quadro, 1 FPS, loop | 6 quadros, 7 FPS, loop; rastreio fixo | 6 quadros, 10 FPS, sem loop |
| H-0 | 1 quadro, 1 FPS, loop | 8 quadros, 8 FPS, loop | 8 quadros, 10 FPS, sem loop |

Os quadros vêm do relógio da simulação via `frameOverride`. Desenhar/abrir menus não reinicia ataques nem cria dano extra. A S-6 nunca recebe velocidade ou gravidade: sua posição é restabelecida no ponto de montagem a cada atualização, inclusive após ser atingida.

## Posicionamento

Coordenadas abaixo são o canto superior esquerdo do colisor. Os humanoides começam em Y=730 e usam a física do piso em Y=790.

| Andar | ID estável do slot | Asset | X | Y | Limites de patrulha X |
| --- | --- | --- | --- | --- | --- |
| 1 | `2-500-shooter` | I-9 | 5700 | 730 | 5580–5900 |
| 1 | `2-1100-sentinel` | S-6 | 6210 | 473 | Fixa, sob a passarela em Y=455 |
| 1 | `2-1480-heavy` | I-9 | 6680 | 730 | 6470–6770 |
| 2 | `2-4200-drone` | I-9 | 9400 | 730 | 9280–9660 |
| 2 | `2-4850-shooter` | H-0 | 10050 | 730 | 9980–10230 |
| 2 | `2-6000-sentinel` | S-6 | 11275 | 463 | Fixa, sob a passarela em Y=445 |
| 2 | `2-6500-heavy` | H-0 | 11700 | 730 | 11620–11820 |

Esses limites também valem durante perseguição: impedem atravessar divisórias, entrar nas poças e invadir as chegadas/abrigos. Ataques são cancelados quando Kael sai do andar, morre ou fica distante. As transições de elevador continuam suspendendo o combate pelo sistema existente.

## Ataques e dano

Estados exclusivos: patrulha/rastreio, aviso, ataque, recuperação e morte. Dano/stun/EMP cancelam ataques pendentes. A direção fica travada durante o golpe. Todos os ataques acertam no máximo uma vez por execução e respeitam a invulnerabilidade de Kael.

**I-9:** 48 HP, corrida de 150 px/s e detecção de 420 px. Aviso de 0,24 s antes de iniciar o sprite de ataque; impacto no quadro 4 (índice zero), ativo por 1/12 s. Janela total começa aproximadamente 0,573 s após o aviso inicial. A lâmina usa caixa curta de 28×22 px, à frente da mão, 44 px acima dos pés. Dano 14. Recuperação de 0,55 s; cooldown de 1,35 s após encerrar a animação. Não causa dano pelo corpo inteiro. Pode ser evitado pulando ou saindo do alcance.

**S-6:** 36 HP, alcance máximo de 650 px. O `walk.png` é exclusivamente rastreio: nenhuma locomoção. A mira acompanha Kael durante o aviso de 0,6 s e congela ao iniciar `attack`; o laser só causa dano nos quadros 3 e 4, aproximadamente 0,9 s após o aviso inicial, por 0,2 s. Dano 13, recuperação de 0,6 s, cooldown de 2,2 s.

O laser Canvas sai da lente real, alcança até 650 px e para no primeiro sólido/plataforma/barreira ativa. O aviso usa a mesma geometria, com linha fina tracejada; o disparo usa faixa de 8 px e núcleo claro. A colisão consulta o mesmo segmento, com raio de 4 px. A linha de visada impede iniciar ataques através de cobertura. O alvo pode escapar depois da trava da mira; não há rastreamento do feixe durante a janela de dano.

**H-0:** 72 HP, caminhada de 54 px/s e detecção de 340 px. Aviso de 0,35 s seguido pela carga do sprite. Descarga ativa nos quadros 3, 4 e 5, de 0,3 a 0,6 s da animação: aproximadamente 0,65 s após começar o aviso, por 0,3 s. Dano 16, recuperação de 0,8 s, cooldown de 2,2 s. A faixa elétrica tem até 140×18 px, parte à frente dos pés e é limitada por sólidos. Canvas mostra o aviso no chão e a descarga na mesma área; não atinge automaticamente plataformas altas. O salto existente permite escapar.

Todos os tempos estão centralizados em `TOWER_ENEMY_SPECS`. O EMP e os ataques de Kael usam as rotas existentes de dano, sem habilidade ou tecla nova.

## Morte e compatibilidade

O pacote não contém hurt/death. O dano usa uma breve atenuação da imagem. A morte congela a pose atual e a desvanece em 0,65 s, sem solicitar sprites inexistentes. Hitboxes, feixes e ataques pendentes são eliminados imediatamente. Os humanoides seguem os timers existentes de respawn (30 s na morte por combate, 8 s por EMP); os dois slots `sentinel` mantêm a política existente de não reaparecer naquela sessão. Não foi alterado o formato do save.

## Testes

- `node tests/tower-enemies.mjs`: **231 verificações**, a 30/60/120 FPS. Inclui hashes dos nove PNGs, dimensões, loops, slots, dano nos dois sentidos, impacto no quadro correto, recuperação, colisão em altura, EMP, morte, respawn, cobertura, montagem sob plataformas e esquiva com a física real dos três ataques.
- `node tests/browser-tower-enemies.mjs`: **176 verificações** no Edge. Todos os 47 quadros, ambos os sentidos, escalas/colisores, transparência, origem de recorte, ataque sem reset, morte sem assets ausentes e laser no mapa real. **31 imagens carregadas sem falhas**.
- Regressões de inicialização, torre, Véspera, campanha, mapas, Matrona, Warden, M-4, E-7, V-3, NPCs, combate e movimento.
- Sintaxe JavaScript, JSON e `git diff --check`.
- Atlas e montagem real da câmera inspecionados visualmente.

Os testes de navegador usam um contexto descartável e estado com saves desativados. Saves pessoais não são acessados nem escritos. Para executá-los, usar servidor na porta 5500 e navegador com CDP na porta 9222, como nas suites existentes. No jogo, F3 mostra as caixas e segmentos.

## Refinamento visual pendente

- As caminhadas de I-9 e H-0 usam principalmente deslocamentos da arte-base. Os pés sobem cerca de 3 px no arquivo em quadros intermediários (cerca de 1 px no mundo); podem parecer deslizar/flutuar. A origem é estável, e isso vem da arte fornecida.
- O ataque do H-0 apresenta mudanças bruscas na pose/composição do braço nos quadros intermediários. O atlas não encontrou recorte por configuração ou por limite de célula; o refinamento deve ser feito na animação original, preservada nesta integração.
- O ataque da S-6 contém um pequeno trecho horizontal de laser no próprio PNG. O laser Canvas mira em ângulo a partir da lente, então esse trecho pode formar uma pequena bifurcação visual. Uma versão futura sem o trecho pré-desenhado, ou com cabeça redesenhada em ângulos, alinharia melhor os efeitos.
- Não há animações originais de dano ou morte; o fade é a solução funcional atual.

Ainda é recomendável percorrer os dois andares jogando para ajustar dificuldade e leitura dos encontros. Os testes comprovam as janelas de dano e rotas de esquiva, mas não substituem essa avaliação humana.
