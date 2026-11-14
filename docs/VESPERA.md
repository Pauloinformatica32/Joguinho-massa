# Véspera e NEXUS-01

Implementação integrada ao único `boss-3`, na arena existente do terceiro andar (`13900–15300`, piso `790`). O encontro conserva os elevadores, checkpoint, save e final por computador. Git foi conferido antes das edições: nenhum conflito ou marcador não resolvido; somente o pacote novo de sprites estava sem rastreamento. Nenhum commit, reset ou push foi executado.

## Arquivos

- `js/vespera.js`: estados, drone, seleção, danos, EMP, fases, desenho e restauração da derrota.
- `js/bosses.js`: criação, atualização, dano e renderização do chefe existente.
- `js/engine.js`: EMP, término da animação de morte e respawn.
- `js/config/assets.js`: Véspera deixa de ser procedural; registro de NEXUS-01.
- `js/combat-debug.js`: caixas de golpe, zonas, drone, estado e fase no F3.
- `js/main.js`: comandos de Véspera no modo local `towerTest` existente.
- `js/save.js`: pose final e drone inativo ao carregar uma vitória; posição da derrota preservada dentro da arena.
- `js/tower.js`: computador exige também o término da morte.
- `assets/bosses/vespera/config.json`, `drone/config.json`: configurações reais do motor.
- Sete PNGs e `sprite_manifest.json` copiados de `Vespera_Boss_Sprites_Codex/assets/bosses/vespera/` para o caminho ativo. O pacote original continua intacto.
- `tests/vespera.mjs`, `tests/vespera-browser.js`, `tests/browser-vespera.mjs`: testes novos.
- `tests/campaign.mjs`: o ensaio genérico de combate agora cobre Matrona/Warden; Véspera usa a suite específica para sua nova máquina de estados. As demais verificações de campanha continuam cobrindo os três chefes e saves.
- `tests/tower-cases.js`: espera a animação de morte antes de verificar vitória/computador.
- `tests/vespera-atlas-preview.png`: atlas renderizado com todos os quadros e confronto com caixas F3.

## Sprites e escala

Todas as animações usam quadros de **147×253**, uma linha, sem espaçamento, origem **(73,5; 251)** e escala uniforme **0,34**. O retângulo renderizado é **50×86 px**; o colisor é **26×80 px**. A capa não se torna uma parede de colisão. Kael conserva seu colisor de 30×54. A origem ancora os pés no piso, inclusive durante a queda e a pose ajoelhada. O renderer existente preserva nearest-neighbor e espelha em torno do mesmo ponto.

| Animação | Quadros | FPS | Loop |
| --- | --- | --- | --- |
| idle | 6 | 6 | Sim |
| walk | 8 | 10 | Sim |
| command | 6 | 10 | Não |
| attack | 8 | 12 | Não |
| hurt | 4 | 10 | Não |
| death | 8 | 8 | Não; mantém quadro 7 |

O tempo da simulação determina os quadros de combate, usando `frameOverride` do renderer existente. Renderizações extras, menus e taxas de atualização diferentes não disparam dano nem reiniciam animações. Idle/walk usam um relógio contínuo; os demais usam o tempo do estado. Os seis PNGs foram inspecionados e copiados sem reamostragem ou edição; hashes e dimensões são verificados pelos testes. Não foi gerada arte nova.

## Drone

NEXUS-01 é um componente de Véspera, com um único desenho e sem HP ou barra própria. Usa o PNG estático **54×48**, escala **0,55**, desenho **30×26** e origem (27; 24).

Fora dos ataques, seu alvo fica 37 px atrás da direção de Véspera e 73 px acima do piso, com oscilação de 4 px. Segue com interpolação exponencial independente da taxa de quadros. Durante Execução, vai para um ponto a 145 px na horizontal de Kael, com altura 145 px na fase 1 e 200 px na fase 2. Isolamento na fase 2 usa o centro a 230 px; Sobrecarga usa o centro a 285 px. Limites: 20 px de margem horizontal; altura entre 35 e 310 px acima do piso. Ao terminar retorna ao ombro. Depois da derrota permanece apagado e sem ataques.

Propulsores, indicador de mira, núcleo dos tiros, interrupção EMP, circuitos e efeitos dos ataques usam Canvas. Projéteis nascem da posição real do drone, registrada também em `originX/originY` para verificação.

## Estados e ataques

Estados exclusivos: `idle`, `walk`, `reposition` (suportado para controle/teste), `command`, `cyber_slash`, `isolation_protocol`, `network_overload`, `hurt`, `phase_transition`, `death`. A aproximação usa caminhada de 90 px/s, limitada a 1 s antes da escolha; não há teleporte. Golpe só é elegível perto do alvo. A lista de ataques remove a opção anterior quando ela já ocorreu duas vezes seguidas.

| Ataque | Aviso / janela | Dano / geometria |
| --- | --- | --- |
| Ordem de Execução | Primeiro tiro aos 0,8 s; mais dois a cada 0,3 s; mira congela 0,2 s antes de cada tiro | Tiros 10×10, velocidade 300 px/s, vida 2,5 s, dano 12/16 por fase |
| Corte Cibernético | Preparação pelos quadros 0–4; ativo em 5 e 6, de 0,417 a 0,583 s; animação de 0,667 s | 36×30 perto da mão e da faixa ciano visível, Y=716; dano 16/20. Corpo inteiro não causa contato |
| Ruptura da fase 2 | Surge depois do corte; aviso 0,72 s, ativa 0,24 s | 72×28 junto ao piso na direção do corte; dano 18 |
| Isolamento | Marca no piso/contorno por 1,3 s; barreira de energia ativa 0,55 s | Cinco faixas possíveis; quatro zonas 236×270 com corredor seguro de 264 px e margens. Dano 15 |
| Isolamento fase 2 | Segunda sequência começa em 2,05 s, com aviso próprio de 1,3 s | Corredor seguro alterna com faixa vizinha; sem sobreposição das janelas ativas |
| Sobrecarga, só fase 2 | Drone sobe; quatro nós e linhas avisam por 1,4 s; feixes ativos 0,65 s | Quatro faixas perigosas e uma passagem segura; dano 25; sem tiros simultâneos |

O corredor seguro do primeiro padrão fica numa faixa vizinha da posição inicial de Kael; o da segunda sequência volta à faixa inicial. Não exige travessia impossível de toda a arena. Os testes percorrem todas as cinco posições iniciais, com física real e sem invulnerabilidade artificial, nos três FPS testados.

Há recuperação de 1,05 s após os ataques, ou 1,65 s após Sobrecarga, além do encerramento visual do padrão. Execução termina somente depois dos três tiros e da limpeza dos projéteis. Cada ataque limpa efeitos anteriores; zonas não se sobrepõem a projéteis de outro ataque. Tiros da fase 2 ajustam a direção a no máximo 0,85 rad/s durante os primeiros 0,35 s; depois seguem trajetória fixa.

## Fases, dano e EMP

Até mais de 50% de HP, usa os três ataques iniciais. Ao atingir **50% ou menos**, uma flag exclusiva dispara a transição de **2,8 s**, limpa ataques e protege o chefe durante a fala:

“Você ainda não compreendeu, Kael. Eu não controlo este sistema...”

“Eu sou o sistema.”

A arena escurece; as falas são desenhadas na área visível da câmera. Fase 2 muda posições do drone, adiciona circuitos vermelhos, rastreio limitado, ruptura, segunda sequência de isolamento e Sobrecarga. Reutiliza a mesma arte.

Véspera recebe dano durante ataques e recuperação, com intervalo mínimo de **0,18 s** entre acertos. HURT dura **0,4 s**, exibindo os quatro quadros; só interrompe estados neutros e tem resistência de **1,4 s** a nova reação. Isso evita cancelar cada ataque por ticks de dano. A transição é a única proteção longa; a morte elimina todos os danos.

O K original continua acionando EMP, com habilidade e custo de **35 de energia** existentes. Se o drone está a até **280 px**, EMP o desativa por **2,6 s**, limpa tiros/zonas e cancela os ataques que dependem dele. Há **7 s** de resistência a outro pulso. O impacto causa somente **12 HP** em Véspera, respeitando proteção de dano; não é uma execução. O corte independente não é cancelado. A habilidade e o item de história permanecem adquiridos.

## Morte, save e final

Ao chegar a zero HP, o chefe entra imediatamente em `death`, limpa projéteis, zonas e ruptura, e desativa NEXUS-01. Durante **1 s**, os oito quadros continuam sendo atualizados antes de o engine registrar a vitória e apresentar o aviso do computador. A pose final permanece desenhada mesmo depois de liberar a arena.

Vencer o combate não adiciona `ending`. O computador existente precisa de chefe derrotado, animação concluída e EMP. O desligamento continua registrando `tower-central-shutdown` e acionando o final existente.

Não há chave ou formato novo de save. A normalização reconstrói a pose final e o drone inativo para chefes já derrotados, inclusive saves antigos. O computador pendente permanece pendente; desligamentos realizados permanecem realizados. Como nos chefes anteriores, um encontro não vencido reinicia ao carregar/respawnar. Testes de navegador usam contexto isolado e estado `devTowerTest`; não escrevem no save pessoal.

## Teste de desenvolvimento

Somente em localhost/127.0.0.1: abrir `index.html?towerTest=1` e usar o console:

```js
towerTest.vespera(1);                       // iniciar fase 1
towerTest.vespera(2);                       // iniciar fase 2
towerTest.vespera(2, 'network_overload');    // inspecionar padrão específico
towerTest.vespera(1, 'cyber_slash');
towerTest.emp(true);                        // habilitar EMP só na sessão de teste
```

F3 mostra caixas e estado. O parâmetro explícito é obrigatório; sem ele a API não existe. Esse modo desativa salvamentos e não altera habilidades da campanha normal. O comando de combate prepara a fase solicitada sem disparar a fala da transição; para testar a fala, iniciar fase 1 e reduzir HP em combate.

## Validação

- `node tests/vespera.mjs`: **2959 verificações**, a 30/60/120 FPS. Inclui hashes/grades, origem dos tiros, seleção sem repetição tripla, reação, transição única, morte completa, persistência, EMP reutilizável e esquiva real de todos os padrões.
- `node tests/browser-vespera.mjs`: **72 verificações** no Edge, **22 imagens carregadas sem erro**, todos os quadros, looping/pose final, espelhamento, escala, um único drone, K real, combate/morte pelo engine, save normalizado e desligamento pelo terminal. Gera o atlas de prévia.
- Suites existentes de inicialização, torre, campanha, mapas, Matrona, Warden, M-4, E-7, V-3, NPCs, combate e movimento executadas para regressão.
- Sintaxe dos módulos, JSON dos assets e `git diff --check`.
- Atlas com as seis animações e comparação com Kael inspecionado visualmente.

## Limitações restantes

Ainda falta uma avaliação humana de uma luta completa para ajustar dificuldade, leitura dos avisos e sensação da caminhada; os testes de esquiva comprovam rotas possíveis, não o equilíbrio para todos os jogadores. Os efeitos são Canvas provisório, sem som novo, partículas com sprites ou retrato de diálogo. A luta e o final estão funcionais; o acabamento audiovisual pode ser refinado sem trocar a arte original.
