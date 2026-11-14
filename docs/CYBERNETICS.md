# Dificuldade e implantes cibernéticos

Implementação local; sem commit ou push. O banco JSON, os 12 IDs, os índices de
resposta, os NPCs, os diálogos e as recompensas permanentes originais permanecem.

## Dificuldade

| Região | Fácil | Médio | Difícil / novo implante |
| --- | --- | --- | --- |
| Setor 9 | t01 DNS / gancho | t02 DHCP, t04 switches | t03 OSI / Firewall neural |
| Complexo | t05 IPv4 | t07 HTTPS, t08 ARP | t06 sub-rede / Overclock de combate |
| Torre | t11 IPv6 | t10 ICMP, t12 WPA3 | t09 NAT/PAT / Interferência de sinal |

Total: 3 fáceis, 6 médias, 3 difíceis; cada região tem 1/2/1. A dificuldade é
metadado do ID da pergunta, não uma propriedade da região.

O arquivo autoral `Nova_Aurora_Terminais_Redes/data/network_questions.json` não
foi reescrito. `networkChallenge()` acrescenta cenários aplicados aos três
difíceis, preservando seus IDs e índices corretos:

- OSI: distinguir a entrega do quadro ao MAC do gateway da seleção de rota pelo IP.
- Sub-rede: deduzir /24 a partir de 254 hosts utilizáveis, com 2⁸ − 2.
- NAT/PAT: distinguir conexões simultâneas pela tradução de portas e seus mapeamentos.

O NAT difícil usa distratores novos e tecnicamente distintos. Todos continuam
com exatamente quatro alternativas e uma correta. A comparação do índice é
centralizada em `answerNetworkQuestion()`. O painel mostra `[I] FÁCIL`,
`[II] MÉDIO` ou `[III] DIFÍCIL`, além de bordas diferentes; não depende só de cor.
Explicação, retry e validação permanecem em português brasileiro.

## Recompensas e efeitos

Os difíceis conservam seu bônus original e também concedem um implante. Isso
preserva o que jogadores antigos já ganharam e mantém os totais permanentes:
+40 PV, +15% de dano, +6% de corrida e 8% de redução de dano. A exceção fácil
de Yara continua liberando o gancho existente.

| Implante | Mecânica | Duração | Recarga desde a ativação |
| --- | --- | --- | --- |
| Firewall neural | Contorno ciano; consome o escudo ao bloquear um ataque | até 3 s | 25 s |
| Overclock de combate | Multiplica o dano causado por 1,20; circuitos vermelhos/cianos | 4 s | 35 s |
| Interferência de sinal | Multiplica o deslocamento de projéteis compatíveis por 0,60 em raio de 300 px | 2 s | 35 s |

Firewall intercepta o fluxo real de `hurt()` depois da verificação de
invulnerabilidade. Um impacto remove o escudo e produz um flash visual de 0,18 s,
sem conceder invulnerabilidade adicional. Não bloqueia quedas, ácido,
prensas ou outros riscos ambientais. Não acrescenta plataformas ou movimento.

Overclock usa `scaledPlayerDamage()`: por exemplo, 20 de dano com +15% permanente
passam a 20 × 1,15 × 1,20 = 27,6. Quando termina, voltam a 23. Ele não modifica
permanentemente a estatística nem acumula multiplicadores em ativações repetidas.
Corpo a corpo, sobrecarga e EMP usam o mesmo cálculo, inclusive contra bosses.

A interferência é aplicada nos laços de projéteis hostis: Servant Shooter,
V-3, projéteis genéricos e NEXUS-01. Não altera velocidades armazenadas, evitando
acúmulo e problemas de restauração. Colisão varrida do V-3 e subpassos do Servant
usam a distância reduzida. Vida útil, animação, giro de perseguição e IA usam o
tempo original. Projéteis fora do raio, amigáveis ou incompatíveis ficam normais.
Feixes, áreas, ondas de Warden e corpos físicos permanecem intactos.

## Controles, HUD e persistência

Após inspecionar A/D, setas, espaço, J/clique, K, Shift, E, M, Esc, G, F3 e os
atalhos de autenticação 1–4, foram escolhidos **Q para selecionar** e **F para
ativar**. K mantém sua função anterior. HUD, rodapé, Pausa → Implantes e README
documentam os controles. O HUD lista os implantes adquiridos, marca a seleção,
mostra tempo ativo e recarga simultaneamente e identifica `PRONTO`.

O estado `network` evolui para a versão 2 dentro do save global já existente.
IDs pagos são a fonte para `unlockedImplants`; `selectedImplant` também é salvo.
A normalização reconstrói a propriedade a partir dos terminais difíceis pagos.
Assim, saves anteriores com esses terminais concluídos ganham o implante sem
receber novamente vida, dano ou outros bônus.

`player.cybernetics` contém apenas seleção e temporizadores transitórios. Ao
carregar, morrer ou renascer, esses temporizadores são zerados. Desbloqueios
permanecem, e uma Nova Jornada começa sem implantes. Efeitos e recargas usam o
tempo de jogo: a pausa também os pausa. Não há outra tecla para cada implante nem
um sistema separado de salvamento. EMP de Íris, elevadores e final permanecem.

## Arquivos modificados

- Novo: `js/cybernetics.js`, com efeitos, temporizadores, seleção e desenho em pixels.
- `js/network-terminals.js`: classificação e cenários difíceis.
- `js/network-hacking.js`: grau no painel e notificação do implante adquirido.
- `js/upgrades.js`: desbloqueios, migração e multiplicador temporário de dano.
- `js/engine.js`: Q/F, atualização dos temporizadores e limpeza ao morrer/renascer.
- `js/combat.js`: absorção por Firewall.
- `js/enemies.js`, `js/servant-shooter.js`, `js/v3-drone.js`, `js/bosses.js`,
  `js/vespera.js`: escala local do deslocamento de projéteis compatíveis.
- `js/world.js`: renderização dos efeitos junto de Kael.
- `js/ui.js`, `index.html`, `css/network-hacking.css`: HUD, descrições e controles.
- `README.md` e este relatório.
- `tests/cybernetics.mjs`, `tests/cybernetics-browser-cases.js`,
  `tests/browser-network.mjs`, `tests/network-browser-cases.js`: testes e capturas.

Não foram alterados sprites, diálogo dos NPCs, geometria, dano base dos inimigos,
seleção de ataques dos bosses ou suas transições de fase.

## Verificações

- Todas as **20 suítes locais** passaram.
- **111 verificações novas**: distribuição 3/6/3 e 1/2/1, quatro alternativas,
  desbloqueios únicos, respostas erradas sem prêmio, Firewall e riscos ambientais,
  dano real, recargas e durações a 30/60/120 FPS, projéteis V-3/NEXUS, colisão com
  jogador e cobertura, preservação das ondas de Warden, saves antigos e seleção.
- No Edge, a suíte educativa voltou a concluir as 12 perguntas, verificar retry,
  prêmio único, gancho, Continuar, renascimento, Nova Jornada, EMP de Íris e elevadores.
- **21 verificações de implantes no navegador**: teclas Q/F pelo fluxo real,
  dano recebido/causado, ativação, bloqueio de repetição, expiração, HUD pronto e
  recarga, projéteis reais e reset de temporizadores. Mais **15 verificações** de
  dificuldade/alternativas nos painéis de fácil, médio e nos três difíceis.
- Layout educativo e difícil inspecionado em 1280×900, 390×640 e 640×360.
- Regressões de navegador: Matrona 51 verificações e luta completa; Warden 29 e
  luta completa em duas fases; Véspera 72; inimigos da Torre 176; computador central
  42, com desligamento e final. Sem exceções JavaScript observadas.
- Sintaxe JavaScript e `git diff --check` passaram.

Relatório executável: `tests/network-browser-results.json`. Capturas em
`tests/network-screenshots/`: `firewall.png`, `overclock.png`, `interference.png`,
`t03_setor9_osi.png`, `t06_industrial_subnet.png`, `t09_tower_nat.png` e vistas móveis.
Execute `node tests/cybernetics.mjs`; para o navegador, execute
`node tests/browser-network.mjs` com servidor HTTP e CDP configurados conforme README.

## Limites

Os cenários automatizados usam posicionamento controlado e avanço de tempo para
verificar recargas; não representam uma partida manual completa nem uma medição
de equilíbrio. Os implantes são opcionais. A interferência intencionalmente não
afeta todos os ataques: feixes e ondas de choque seguem suas mecânicas originais.
