# Mainframe central da Torre Aurora

## Causa do visual anterior

O computador não estava oculto por uma camada incorreta. Havia um único terminal funcional, `tower-central-shutdown`, em **(15440, 790)**, e um gabinete provisório de 100×180 desenhado perto dele. Esse ponto fica depois do limite direito da arena de Véspera (**15300**), portanto não aparece no enquadramento normal do combate. Dentro da arena, o terceiro andar desenhava apenas painéis escuros repetidos com faixas vermelhas. Não existia um mainframe central na parede da luta, nem um sprite apropriado nos backgrounds locais.

O terminal e sua posição foram mantidos. O gabinete provisório e o desenho genérico de “E · LER” foram substituídos por uma única representação dedicada do console. Não há terminal duplicado.

## Arquivos desta alteração

- `js/tower-core-visuals.js`: mainframe, arquitetura de fundo, servidores, monitores, cabos, núcleo, console e leitura do estado visual.
- `js/tower.js`: usa o novo fundo somente no andar 3; expõe progresso visual temporário durante o desligamento e faz um breve enquadramento da máquina durante essa sequência.
- `js/world.js`: desenha o console dedicado no lugar do terminal genérico e desativa a chuva somente no andar 3.
- `tests/tower-core-browser.js` e `tests/browser-tower-core.mjs`: verificações e captura dos seis estados.
- `tests/tower-core-standby.png`, `tower-core-phase1.png`, `tower-core-phase2.png`, `tower-core-critical.png`, `tower-core-shutdown.png`, `tower-core-off.png`: capturas do navegador.
- Este relatório.

Os arquivos de geometria, câmera de combate, colisão, IA/ataques de Véspera, sprites e saves não foram alterados nesta tarefa. As alterações locais anteriores de chefes/inimigos foram preservadas. Não houve commit ou push.

## Apresentação

O processador fica no centro horizontal da arena: **X=14600**. O chassi principal tem 760 px de largura, com molduras externas de aproximadamente 800 px, entre **Y=350 e 706**. O núcleo é uma matriz retangular de processadores com placas, encaixes e identificação Aurora Dynamics, sem tanque, líquido ou formato de reator.

O fundo usa recessos corporativos, vigas, suportes e teto. No plano intermediário ficam o mainframe grafite, inserções metálicas claras, seis grandes cabos de energia, dois conjuntos de servidores, monitores ciano, barramentos, grelhas, ventilação e marcações industriais discretas. Um cabo contínuo conecta a máquina ao console existente.

Tudo usa Canvas com coordenadas arredondadas, cores planas e nearest-neighbor. Não há imagens geradas externamente, novos sprites, blur ou gradientes no desenho novo. A decoração permanece em coordenadas de mundo; não foi adicionado parallax.

A renderização da maquinaria ocorre antes de plataformas, pontos de gancho, terminais, inimigos, Véspera, NEXUS-01 e Kael. A faixa junto ao piso (**Y=700–790**) permanece escura e com detalhes de baixo contraste, para destacar os personagens e os avisos ciano/vermelhos. O núcleo ocupa a região superior da máquina, acima das silhuetas terrestres. Os ataques e sua geometria não foram alterados.

## Estados do computador

| Estado | Aparência |
| --- | --- |
| Antes do combate | Núcleo vermelho com pulsação lenta, monitores em espera e cabos parcialmente iluminados |
| Fase 1 | Atividade de rede, alerta de acesso hostil e indicadores dos servidores |
| Fase 2 | Pulsação mais rápida, cabos alternados, corrupção em um monitor, pequenos arcos restritos à região do núcleo |
| Véspera derrotada | Núcleo ainda energizado e instável, alerta de rede crítica e instrução de aplicação do EMP |
| Desligamento | Energia e indicadores reduzem por etapas, monitores diminuem atividade, núcleo perde iluminação |
| Rede desconectada | Núcleo escuro, monitores desligados e indicadores sem emissão vermelha |

Os estados são derivados das flags existentes do chefe e do evento persistente `tower-central-shutdown`. `map.coreShutdownProgress` é somente apresentação transitória; não foi acrescentado ao formato de save. Um save já desligado reconstrói diretamente o visual apagado.

## Console e sequência final

O console permanece em **(15440, 790)**, no piso sólido existente, **140 px depois da arena** e fora das hitboxes do chefe. Agora possui base metálica, tela, teclado, apoios e indicadores de trava/EMP.

Durante o combate e a animação de morte ele permanece bloqueado. Após a derrota completa, uma indicação no cenário aponta para o console; ao se aproximar aparece:

`[E] DESATIVAR NÚCLEO CENTRAL`

Sem a habilidade adquirida com Íris, aparece a exigência de EMP. A autorização usa a mesma distância de interação e o mesmo terminal da campanha. O EMP não é consumido.

A sequência existente continua durando 1,5 s. A apresentação agora mostra o desligamento em vez de cobrir a máquina com uma tela vermelha. A câmera leva 0,4 s para enquadrar o mainframe; Kael não muda de posição e o combate permanece suspenso pelo mecanismo existente. Ao terminar, a câmera normal é restaurada e o final existente é aberto. Não é possível disparar essa sequência antes da derrota completa.

## Testes

- `node tests/browser-tower-core.mjs`: **42 verificações** no Edge e seis capturas. Verifica diferenças visuais entre estados, câmera, ordem de camadas, geometria e arena intactas, terminal único sobre piso sólido, trava antes da derrota e durante a morte, exigência de EMP, prompt correto, queda de energia, enquadramento temporário sem mover Kael, abertura do final e persistência após normalizar o save.
- O teste também confirma que a chuva continua nas outras quatro regiões/seções verificadas e é removida somente do andar 3.
- `node tests/browser-vespera.mjs`: **72 verificações** da luta, animações, drone, EMP e final.
- Regressões de inicialização, torre, mapas, campanha, Matrona, Warden, Véspera e inimigos executadas.
- Sintaxe dos módulos e `git diff --check`.
- Capturas dos estados inspecionadas visualmente no navegador.

Os testes de navegador usam contexto descartável, estado com gravação desativada e saves sintéticos. Não acessam nem alteram o progresso pessoal do jogador.

## Limitações

O ambiente é procedural, sem arte externa ou efeitos sonoros novos. Como o console foi preservado depois da arena para manter sua posição segura, parte da máquina fica fora da tela quando Kael está junto dele; o enquadramento de desligamento mostra o mainframe inteiro. A máquina é decorativa e não cria plataformas ou colisores novos. Uma revisão humana durante uma luta completa ainda é útil para avaliar contraste e acabamento em diferentes monitores.
