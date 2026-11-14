# Nova Aurora — Sinal Morto

Metroidvania cyberpunk para navegador, com HTML, CSS, JavaScript modular e Canvas. A campanha tem **três mapas conectados, nove áreas de exploração e três bosses**.

Kael investiga um vírus que infecta robôs e implantes humanos. A Aurora Dynamics distribui a infecção para testar uma rede de controle populacional.

## Executar

Abra a pasta com Live Server ou execute `python -m http.server 8765 --bind 127.0.0.1` e acesse `http://127.0.0.1:8765/`. O jogo exige HTTP para seus módulos; não abra por `file://`. Não há dependências para instalar.

## Campanha

| Ato | Mapa | Boss | Vitória |
|---|---|---|---|
| I | Setor 9 | Matrona | Revelação da Aurora Dynamics; passagem industrial, esquiva e salto duplo |
| II | Complexo Industrial | Warden | Credencial da Torre Aurora; EMP e sobrecarga |
| III | Torre Aurora, com núcleo integrado | Véspera | Transmissão interrompida; cena final e exploração após a conclusão |

Yara orienta a autenticação que libera o gancho; Oren troca créditos por proteção; a Dra. Íris Vale explica a distribuição e fornece EMP após Warden. A IA corporativa revela o projeto de Véspera. A autenticação inicial é obrigatória em novas jornadas; os demais desafios de rede, segredos e a ponte de manutenção são opcionais. Passagens liberadas permitem retornar.

## Trabalho escolar — Redes de Computadores

Kael também é um hacker experiente. Ele infiltrava sistemas restritos enquanto Yara cuidava da inteligência, do acesso remoto e dos rastros da dupla. Kael tentou seguir outra vida, mas o vírus da Aurora Dynamics o trouxe de volta. Yara ainda confia nele, apesar do ressentimento pela separação.

Há **12 perguntas de redes**, distribuídas em quatro terminais no Setor 9, quatro no Complexo Industrial e quatro na Torre Aurora. Cada console apresenta um registro da história antes da autenticação, com **quatro alternativas e uma resposta correta**, validação automática e explicação. Respostas erradas permitem tentar novamente sem perder vida. Use o mouse ou as teclas **1–4**; **E/Enter** avança e **Esc** fecha. O jogo fica pausado durante o desafio.

O primeiro terminal, ao lado de Yara, pergunta sobre DNS e libera o gancho existente. As outras respostas corretas concedem módulos permanentes: **+10 PV máximos**, **+5% de dano**, **+3% de velocidade de corrida** ou **4% de redução de dano**, conforme o console. Ao completar todos, os bônus somam +40 PV, +15% de dano, +6% de corrida e 8% de redução de dano. Veja os bônus permanentes em **Pausa → Habilidades**. Cada recompensa é paga uma única vez e permanece ao continuar ou renascer. Novas jornadas começam sem esses módulos; saves antigos mantêm o gancho já adquirido.

Tópicos: DNS, DHCP, modelo OSI, switches Ethernet e endereços MAC, IPv4, máscaras de sub-rede, HTTPS/TLS, ARP, NAT, diagnóstico com ping/ICMP, IPv6 e segurança Wi-Fi/WPA3. O conteúdo autoral está em [`Nova_Aurora_Terminais_Redes/data/network_questions.json`](Nova_Aurora_Terminais_Redes/data/network_questions.json); `correctIndex` começa em zero.

O projeto usa **HTML, CSS e JavaScript**, com Canvas e módulos ES. Execute por HTTP com Live Server ou `python -m http.server 8765 --bind 127.0.0.1` e abra `http://127.0.0.1:8765/` em um navegador moderno. Não exige instalação de dependências. Codex auxiliou a integração do conteúdo fornecido, a interface, as fórmulas de upgrades, a compatibilidade dos saves e os testes automatizados. As perguntas e o roteiro de referência vieram do pacote da atividade.

### Assistência remota da Yara

Durante qualquer uma das 12 questões, use **PEDIR DICA À YARA**. O comunicador mostra uma dica própria daquele assunto e reaproveita o sprite existente da personagem. É possível pedir ajuda antes da resposta ou depois de errar, fechar e reabrir sem reiniciar a pergunta, alterar a escolha ou perder recompensas. As dicas difíceis orientam o raciocínio; a de sub-redes não entrega o resultado da conta.

Use mouse ou **Tab + Enter/Espaço** para acessar a ajuda. **FECHAR DICA** ou **Esc** fecha primeiro a comunicação e mantém o terminal aberto. As quatro alternativas continuam habilitadas; depois de um erro, é possível tentar outra diretamente ou usar **TENTAR NOVAMENTE**. No desktop, o comunicador fica ao lado; em telas pequenas, integra a área com rolagem sem cobrir os botões. As dicas ficam no campo `hint` do JSON existente e seu uso não adiciona requisitos ao save.

## Controles

- **A/D ou ←/→:** mover.
- **Espaço:** pular; pressionar novamente no ar executa salto duplo quando desbloqueado.
- **J ou clique:** atacar no chão ou no ar.
- **K:** implante contextual; gancho perto de ancoragens, EMP com energia suficiente, ou sobrecarga no contexto de energia restante.
- **1 / 2 / 3:** equipar Firewall neural / Overclock de combate / Interferência de sinal. **Q:** alternar entre os liberados. **F:** ativar o equipado. Nos terminais, 1–4 continuam respondendo às alternativas.
- **Shift:** esquiva após Matrona.
- **E:** conversar, avançar falas, ler terminais, recolher itens e ativar checkpoints. Enter e o botão também avançam as falas durante conversas.
- **M / Esc:** mapa e pausa. **G:** laboratório de recursos.

## Dificuldade e implantes cibernéticos

Abra **Esc → IMPLANTES** para inspecionar os três slots, seus ícones, descrições, durações e recargas. Os bloqueados aparecem em cinza; use **EQUIPAR** nos liberados. O equipado tem borda ciano e marca **EQUIPADO**. A aba **Controles** documenta todos os atalhos. O HUD compacto mostra o equipado e informa também um efeito de outro implante que ainda esteja em andamento.

Somente um implante pode estar equipado e somente um efeito especial pode estar ativo. É permitido trocar o equipamento durante um efeito, mas a troca não ativa nada, não interrompe o efeito e não reinicia nenhuma recarga. Outra ativação só é aceita depois que o efeito anterior terminar e a recarga do escolhido estiver pronta.

Os terminais têm três dificuldades, identificadas por texto e grau no painel:

| Região | I · FÁCIL | II · MÉDIO (duas) | III · DIFÍCIL |
|---|---|---|---|
| Setor 9 | DNS de Yara | DHCP, switches | OSI aplicado ao roteamento |
| Complexo Industrial | IPv4 | HTTPS, ARP | Dimensionamento de sub-rede |
| Torre Aurora | IPv6 | Ping/ICMP, WPA3 | NAT/PAT e conexões simultâneas |

São **3 fáceis, 6 médias e 3 difíceis**. O banco original e suas recompensas permanecem; os difíceis acrescentam cenários de raciocínio e um implante opcional por região:

| Implante | Efeito | Duração máxima | Recarga |
|---|---|---|---|
| Firewall neural — Setor 9 | Escudo ciano absorve um ataque | 3 s | 25 s |
| Overclock de combate — Complexo | Dano causado ×1,20 enquanto ativo | 4 s | 35 s |
| Interferência de sinal — Torre | Projéteis hostis compatíveis próximos se deslocam 40% mais devagar | 2 s | 35 s |

O Firewall não protege contra quedas nem riscos ambientais. A interferência tem raio de 300 px e não altera corpos de inimigos, feixes, ondas de choque ou o relógio do jogo. Os efeitos usam desenhos em pixels e não substituem sprites. **Q seleciona e F ativa**; K mantém o gancho/EMP/sobrecarga. As descrições completas também aparecem em Pausa → Implantes.

Terminais difíceis já concluídos em saves antigos liberam o respectivo implante automaticamente, sem repetir os bônus permanentes. Seleção e desbloqueios são salvos; efeitos ativos e recargas são zerados ao carregar ou renascer. A recarga começa na ativação e impede acúmulos. Nova Jornada remove os desbloqueios. A aquisição do EMP por Íris e os desafios obrigatórios de movimento permanecem independentes.

## Salvamento

Yara é a hacker e informante do Setor 9, amiga de infância de Kael. Suas conversas alternam os dois personagens: reencontro, retorno da investigação do terminal, reação à vitória sobre Matrona e uma conversa curta nas visitas sem novidades. Os eventos `yara-reunion`, `yara-terminal` e `yara-matrona` registram conversas concluídas; `log-1` e a vitória sobre `boss-0` habilitam as novas falas. Uma conversa interrompida pode ser retomada desde o início sem reiniciar a missão. Oren continua responsável pelas melhorias mecânicas.

**Oren · Mecânico** usa seu sprite de 30×60 pixels no Setor 9 e no complexo industrial. O arquivo original encontrado em `assets/characters/npcs/Oreon/idle.png` foi preservado e copiado para `assets/characters/npcs/oren/idle.png`. As duas posições compartilham os eventos `oren-reunion` e `oren-matrona`, sem repetir revelações já concluídas. Oren acompanha Kael com o olhar durante a conversa e retorna à esquerda ao encerrar. Após as falas, escolha **Solicitar melhoria** e confirme **Comprar · 20 CR**: cada reforço concede +15 PV máximos e restaura a vida, até 190 PV. Conversar, cancelar ou não ter créditos não desconta saldo. Cada compra exige confirmação; cliques duplicados não compram dois reforços.

Versão 2, usando a mesma chave de armazenamento anterior. Guarda posição, mapa, checkpoint, bosses derrotados, implantes, objetivos, itens, créditos e eventos narrativos. Saves da campanha antiga são migrados; regiões removidas e posições bloqueadas são redirecionadas para checkpoints válidos. O primeiro salvamento mantém uma cópia do save legado. Abrigos e entrada de mapas salvam automaticamente; também é possível guardar no menu.

## Recursos visuais

Os PNGs atuais de Kael estão preservados, incluindo escala, capa, cajado e ataques terrestres/aéreos. Inimigos, NPCs, bosses e cenários continuam com desenhos provisórios onde ainda não existem PNGs. Nenhum recurso antigo foi apagado.

Para instalar sprites de outros personagens: adicione os PNGs, ajuste seu `config.json` e remova `procedural:true` da entidade em `js/config/assets.js`. O campo `assetId` de NPCs e bosses permite escolher outra entidade do manifesto. Para fundos, instale os arquivos registrados e habilite `loadBackgrounds`. Configurações de Esgotos e Abismo permanecem arquivadas, fora da campanha e do carregamento.

## Testes

```text
node tests/campaign.mjs
node tests/combat.mjs
node tests/player-animation.mjs
node tests/network-terminals.mjs
node tests/cybernetics.mjs
node tests/implant-equipment.mjs
node tests/yara-hints.mjs
```

Com o servidor na porta 8765 e Edge/Chromium de teste expondo CDP na porta 9222:

```text
node tests/browser-combat.mjs
node tests/browser-campaign.mjs
node tests/browser-network.mjs
```

Também é possível abrir `/tests/sprites.html`. Os testes de navegador geram capturas em `tests/campaign-*.png` e um relatório em `tests/campaign-browser-results.json`.

**Limites da validação:** os confrontos automatizados usam invulnerabilidade para testar a progressão e os impactos reais, sem medir dificuldade. A meta de 30–45 minutos e o equilíbrio para iniciantes ainda exigem partidas manuais; o percurso atual favorece uma campanha curta. Áudio e arte externa dos demais personagens continuam pendentes.
