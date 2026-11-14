# Inventário, equipamento e seleção de implantes

Implementado no projeto local, sem commit ou push. Nenhum sprite, boss, habilidade
de movimento, diálogo ou recompensa de terminal foi redesenhado.

## Interface

O menu de pausa agora tem uma aba **IMPLANTES** dedicada aos três implantes especiais.
Os implantes anteriores (gancho, EMP etc.) e os bônus permanentes continuam em
**Habilidades**. A nova aba **Controles** documenta todas as teclas no próprio jogo.

Cada slot contém ícone vetorial em pixels, nome, descrição, região de desbloqueio,
estado LIBERADO/BLOQUEADO, duração máxima, duração restante quando ativa, recarga
total e recarga restante. Implantes liberados têm botão EQUIPAR. O escolhido recebe
borda ciano, marca EQUIPADO e `aria-pressed=true`; os bloqueados ficam em cinza e
seus botões são desabilitados. Mouse, Tab/Enter e espaço funcionam nos botões.

O painel usa três colunas em telas largas e uma lista com rolagem em telas pequenas.
As mudanças de equipamento preservam o foco do botão. O HUD anterior de três linhas
foi substituído por um indicador compacto com ícone, nome, F, disponibilidade,
duração ativa e recarga do equipado. Se outro implante ainda estiver ativo, seu nome
e tempo aparecem em uma linha separada. Estados: PRONTO ciano; ATIVO ciano claro;
RECARGA/AGUARDE escurecidos. O HUD fica abaixo da área de combate no desktop e usa
uma posição compacta adaptada em telas pequenas.

## Controles

| Tecla | Durante o jogo |
| --- | --- |
| 1 | Equipar Firewall neural |
| 2 | Equipar Overclock de combate |
| 3 | Equipar Interferência de sinal |
| Q | Alternar entre implantes liberados |
| F | Ativar o equipado |
| Esc → IMPLANTES | Inspecionar e equipar pelo menu |

Os atalhos existentes foram inspecionados antes da alteração. K mantém gancho,
EMP e sobrecarga; J, espaço, Shift e movimento permanecem. No modal de autenticação,
**1–4 respondem às alternativas** e não equipam implantes. Durante a pausa, F não
ativa efeitos nem vaza como entrada pendente para o jogo.

## Estados e regras

- `network.unlockedImplants`: propriedade permanente, validada contra os três IDs.
- `network.selectedImplant`: ID do único equipamento atual, mantendo o nome do campo
  utilizado pelos saves anteriores. Não significa que seu efeito esteja ativo.
- `player.cybernetics.active`: tempos dos efeitos; `activeImplantId()` identifica
  o único efeito em andamento.
- `player.cybernetics.cooldowns`: recarga independente de cada ID.

`equipImplant()` só aceita um ID conhecido e liberado. Ele altera o equipamento e
não toca nos efeitos, recargas, vida ou dano. Todas as formas de seleção usam essa
função. O primeiro implante ganho é equipado automaticamente; ganhar o segundo ou
terceiro mantém a escolha atual. Aquisição não chama ativação.

`activateImplant()` rejeita implantes bloqueados, recargas pendentes, Kael morto ou
sem vida e qualquer outro efeito especial ainda ativo. O loop do jogo impede
ativação durante pausa, diálogos ou transições. Trocar durante um efeito é permitido,
mas o efeito anterior continua até expirar ou ser consumido; não é possível ativar
um segundo. Todas as recargas avançam independentemente do equipamento.

As mecânicas dos efeitos permanecem: Firewall absorve um ataque por até 3 s, recarga
25 s; Overclock causa +20% por 4 s, recarga 35 s; Interferência reduz deslocamento
de projéteis compatíveis em 40% por 2 s, recarga 35 s.

## Saves

Foi mantida a chave e a versão global do save, além dos IDs de questões e prêmios.
O campo `selectedImplant` continua guardando o equipado. IDs liberados válidos são
restaurados e deduplicados, junto dos implantes derivados de terminais difíceis
pagos. IDs desconhecidos são descartados; equipamento inválido usa um liberado
seguro ou `null` quando não há nenhum. Saves anteriores sem lista de implantes
continuam migrando pelos prêmios dos terminais.

Menu, atalhos e Q salvam a escolha sem repetir desbloqueios ou bônus. Efeitos ativos
e recargas são temporários e continuam sendo zerados ao carregar/morrer/renascer,
como no sistema anterior. Nova Jornada começa sem propriedade ou equipamento.

## Arquivos desta alteração

- `js/cybernetics.js`: equipamento central, atalhos, exclusividade, ícones e IDs válidos.
- `js/upgrades.js`: preservação de propriedade válida e notificação única de aquisição.
- `js/engine.js`: seleção por menu/atalhos, persistência e mensagens de ativação.
- `js/ui.js`: inventário, botões, HUD compacto e instruções.
- `index.html`, `css/network-hacking.css`: abas, controles, cartões e responsividade.
- `README.md`, este relatório.
- `tests/implant-equipment.mjs`, `tests/implant-inventory-browser-cases.js`: novos testes.
- `tests/network-browser-cases.js`, `tests/cybernetics-browser-cases.js`,
  `tests/browser-network.mjs`: integração com a regressão existente e capturas.

## Verificação

- Todas as **21 suítes locais** passaram.
- **85 verificações novas** de equipamento a 30/60/120 FPS: inventário vazio,
  desbloqueio gradual, equipamento automático/manual, seleção bloqueada, efeito
  único, espera entre efeitos, recargas independentes, troca repetida, saves,
  migração e IDs inválidos. Também passaram as 111 verificações de efeitos e as
  159 verificações das questões e recompensas existentes.
- **46 verificações de inventário no Edge**: três slots bloqueados/liberados,
  ícones, primeiro/segundo/terceiro desbloqueio por questões reais, Q/F e 1/2/3,
  troca em combate, bloqueio de sobreposição, menu pausado, botão e espaço,
  HUD, prioridade das teclas no quiz e layout em 1280×900, 390×640 e 640×360.
- A suíte de navegador também verificou Continuar, Nova Jornada, equipamento
  persistido, recargas temporárias zeradas, renascimento, uso do gancho,
  aquisição do EMP por Íris e elevadores. Não houve exceções JavaScript.
- Matrona (51 verificações e luta completa), Warden (29 e luta completa em duas
  fases), Véspera (72) e computador central/final (42) passaram no navegador.
- Sintaxe JavaScript e `git diff --check` passaram.

Capturas: `tests/network-screenshots/inventory-1280x900.png`,
`inventory-390x640.png`, `inventory-640x360.png` e os três efeitos com HUD compacto.
Resultados: `tests/network-browser-results.json`.

Para repetir: `node tests/implant-equipment.mjs`; com HTTP e CDP configurados conforme
README, `node tests/browser-network.mjs`. A verificação local usou porta HTTP 8777.

Limite: os testes de navegador usam posicionamento controlado e avanço de tempo;
não substituem uma campanha inteira jogada manualmente nem uma avaliação de equilíbrio.
