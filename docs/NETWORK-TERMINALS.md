# Terminais de redes — implementação e verificação

Implementado no projeto local, preservando as alterações locais anteriores.
Nenhum commit ou push foi realizado.

## Conteúdo autoral e diálogo

O pacote `Nova_Aurora_Terminais_Redes.zip` foi extraído na raiz. O banco utilizado
diretamente pelo jogo é `Nova_Aurora_Terminais_Redes/data/network_questions.json`.
Seus 12 enunciados, alternativas, `correctIndex`, explicações e recompensas foram
preservados. Os índices começam em zero. O carregamento usa módulos JSON dos
navegadores modernos, servidos por HTTP.

O reencontro utiliza as 11 falas iniciais de `YARA_DIALOGO_E_FLUXO.md`, preservando
o ressentimento e a confiança de Yara na antiga dupla de hackers. O encaminhamento
ao terminal de investigação dos telhados permanece. Depois do DNS correto, as
três falas de confirmação continuam o tutorial e explicam o uso de K.

## Distribuição

São nove consoles reutilizados e três novos. Os consoles existentes mantêm seus
IDs narrativos. Os registros e atalhos anteriores continuam funcionando quando
o registro é lido; o bônus educativo depende da resposta correta. Nenhum quiz foi
colocado na entrega do EMP ou no desligamento do computador central.

| ID da questão | Região | Console | Coordenadas | Recompensa educativa |
| --- | --- | --- | --- | --- |
| t01_yara_dns | Setor 9 | network-yara — novo, ao lado de Yara | 735, 790 | Gancho |
| t02_setor9_dhcp | Setor 9 | log-1 | 1300, 570 | +10 PV |
| t03_setor9_osi | Setor 9 | shortcut-sector9 | 1000, 395 | +5% dano |
| t04_setor9_switch | Setor 9 | world-s9-antenna | 620, -350 | +3% corrida |
| t05_industrial_ipv4 | Complexo | log-2 | 3100, 590 | 4% redução de dano |
| t06_industrial_subnet | Complexo | shortcut-maintenance | 3350, 650 | +10 PV |
| t07_industrial_https | Complexo | world-factory-crane | 3870, -310 | +5% dano |
| t08_industrial_arp | Complexo | network-maintenance — novo | 4100, 590 | +3% corrida |
| t09_tower_nat | Torre, andar 1 | tower-security-log | 6230, 245 | +10 PV |
| t10_tower_ping | Torre, andar 1 | world-security-audit | 7250, -315 | 4% redução de dano |
| t11_tower_ipv6 | Torre, andar 2 | log-3 | 9960, 330 | +5% dano |
| t12_tower_wpa3 | Torre, andar 3 | network-core-service — novo | 13620, 350 | +10 PV |

O primeiro terminal está no chão e pode ser alcançado sem gancho. Nas novas
jornadas, a travessia da quarentena exige concluir esse tutorial. Os outros
terminais são opcionais. Plataformas e pontos de interação foram verificados
com a física real; não há consoles dentro de paredes. A coleta de segredos e
o uso de abrigos continuam disponíveis ao se posicionar mais perto deles.

## Interface e validação

O controlador reutiliza o modal de diálogo, a pausa, os botões e os eventos
narrativos existentes. Cada sessão apresenta registro → pergunta → feedback.
Há quatro alternativas numeradas; o índice é comparado automaticamente com
`correctIndex`. Uma resposta errada explica o conceito e permite tentar de novo,
sem modificar vida ou os bônus educativos. O sucesso mostra autenticação e
recompensa instalada. Consoles concluídos abrem o arquivo, sem novo pagamento.

Mouse e teclas 1–4 selecionam; E/Enter avança; Esc fecha. O foco fica nos botões
do modal, a interface pode rolar em telas baixas e não há movimento/ataques por
trás da pergunta. Cliques antigos ou repetidos não pagam duas vezes.

## Fórmulas reais

O sistema centralizado em `upgrades.js` calcula os bônus pelos IDs pagos:

- Vida máxima = vida mecânica/base + soma dos módulos de vida. Cada módulo também
  acrescenta 10 PV à vida atual, sem ultrapassar o novo máximo.
- Dano causado = dano original × (1 + soma dos bônus de dano). Aplicado ao corpo
  a corpo, sobrecarga e EMP, inclusive contra bosses e escudos E-7.
- Limite de corrida = 250 × (1 + soma dos bônus de velocidade). Dash, salto e
  impulso do gancho preservam suas fórmulas existentes.
- Dano recebido = dano original × (1 − soma das reduções), após verificar a
  invulnerabilidade existente.

Completar tudo concede **+40 PV, +15% de dano, +6% de corrida e 8% de redução**.
O limite de corrida chega a 265 px/s. Oren ainda permite seis reforços mecânicos
de 15 PV: 190 PV mecânicos + 40 PV de rede = 230 PV. Seus preços e cura permanecem.
Há limites preventivos de 25% de dano, 12% de corrida e 20% de redução, acima das
somas atuais do banco. Pausa → Implantes mostra os efeitos e o contador de 12.

## Persistência

A versão 2 e a chave `nova-aurora-save-v1` foram mantidas. O campo aditivo `network`
guarda versão, necessidade do tutorial, vida base, IDs de terminais concluídos
e IDs únicos de recompensas pagas. Os atributos calculados também ficam no player.
Ao carregar, os IDs são validados e deduplicados e as fórmulas são recalculadas a
partir do banco; os bônus não são somados novamente nem curam no carregamento.
Compras de Oren atualizam separadamente a vida base.

Saves antigos com gancho recebem o primeiro terminal concluído, conservando a
habilidade sem novo bônus. Seus eventos, bosses e inventário permanecem. Não se
aplica uma nova trava de tutorial retroativamente a saves antigos. Renascimento
mantém os módulos; Nova Jornada reinicia o estado de terminais. Não foi usado
`localStorage.clear()` nem removido o save existente.

## Arquivos alterados nesta implementação

- Conteúdo extraído: `Nova_Aurora_Terminais_Redes/{README.md,data/network_questions.json,docs/YARA_DIALOGO_E_FLUXO.md}`.
- Novos módulos: `js/network-terminals.js` (banco, validação e consoles) e
  `js/network-hacking.js` (interação pelo modal existente).
- Upgrades e fórmulas: `js/upgrades.js`, `js/player.js`, `js/combat.js`,
  `js/bosses.js`, `js/vespera.js`.
- Integração: `js/map.js`, `js/world.js`, `js/region-transitions.js`, `js/engine.js`,
  `js/main.js`, `js/save.js`, `js/ui.js`, `js/campaign.js`, `js/dialogue.js`.
- Interface/documentação: `index.html`, `css/network-hacking.css`, `README.md`,
  este relatório.
- Testes novos: `tests/network-terminals.mjs`, `tests/network-browser-cases.js`,
  `tests/browser-network.mjs`; resultados e capturas em `tests/network-*`.
- Regressões ajustadas: `tests/yara-dialogue.mjs`, `tests/oren.mjs` e
  `tests/world-design.mjs`. Os testes de navegador de Matrona e Warden passaram
  a aceitar `TEST_BASE_URL`; suas capturas e o relatório de Warden foram atualizados.

Não foram alterados sprites, atributos base dos inimigos, padrões dos bosses,
geometria das arenas, transições de andares ou a sequência do final para criar
as recompensas. As alterações de combate limitam-se aos multiplicadores de Kael.

## Testes e evidências

- As **19 suítes locais `.mjs`** passaram, incluindo combate, campanha, NPCs,
  save legado, todos os bosses e os terminais.
- **159 verificações educativas**: 48 combinações de resposta, esquema do banco,
  recompensas reais, ausência de pagamentos duplicados, bônus de Oren, saúde
  parcial, normalização repetida e migração do gancho.
- Acessibilidade dos 12 consoles e suas plataformas verificada com física real
  a **30, 60 e 120 FPS**.
- Navegador Edge: **123 verificações** (115 antes de recarregar + 8 após), com
  Nova Jornada/Continuar reais, reencontro, DNS errado/correto, gancho real,
  12 consoles, arquivos, tentativa cancelada, duplicação, segredos próximos,
  movimento restaurado, reload, renascimento, EMP de Íris e quatro elevadores.
- Layout em **1280×900, 390×640 e 640×360**; capturas em
  `tests/network-screenshots/`. Relatório: `tests/network-browser-results.json`.
- Regressões de navegador: Matrona **51 verificações e combate completo**;
  Warden **29 verificações e combate completo em duas fases**; Véspera **72**;
  inimigos da Torre **176**; computador central **42**, incluindo desligamento
  e final. Sem exceções JavaScript observadas nessas execuções.
- Sintaxe dos módulos JavaScript e `git diff --check` passaram.

Para repetir: servidor HTTP na porta 8765, Edge/Chromium de teste com CDP na porta
9222, `node tests/network-terminals.mjs` e `node tests/browser-network.mjs`.
`TEST_BASE_URL` permite usar outra porta; a verificação desta implementação usou
8777. O teste educativo de navegador usa um contexto isolado de armazenamento.

## Limites restantes

Não há falha conhecida nos cenários verificados. A campanha completa não foi
percorrida manualmente somente pelo teclado, e o equilíbrio com todos os bônus
ainda requer avaliação humana. As verificações de consoles usam posicionamento
programático em plataformas cuja acessibilidade é validada separadamente pela
física. Navegadores antigos sem módulos JSON não foram testados.
