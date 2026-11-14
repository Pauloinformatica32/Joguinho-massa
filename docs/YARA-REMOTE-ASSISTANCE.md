# Assistência remota da Yara

Implementação local, sem commit ou push. O sistema existente de perguntas,
IDs, alternativas corretas, recompensas e progressão foi reutilizado.

## Conteúdo

O único banco continua sendo
`Nova_Aurora_Terminais_Redes/data/network_questions.json`. Cada uma das 12 questões
recebeu um campo `hint` próprio, em português brasileiro. Os outros campos não foram
alterados. `networkChallenge()` preserva a dica ao acrescentar os cenários difíceis
de OSI, sub-rede e NAT/PAT. A validação exige dicas não vazias e sem texto corrompido.

As dicas foram escritas individualmente, com o tom de parceria e provocação leve
da Yara. DNS usa uma analogia com a agenda do comunicador; IPv4 e IPv6 lembram como
organizar os componentes do endereço; DHCP, switches, HTTPS, ARP e Wi-Fi explicam
princípios. OSI e NAT/PAT orientam a distinguir campos e decisões. Sub-redes explica
o método sem fornecer máscara, prefixo ou capacidade finais. Ping sugere observar
mensagens e filtros, sem nomear o protocolo correto.

O reencontro de Kael e Yara ganhou quatro falas sobre o comunicador, quando pedir
ajuda e a ausência de penalidade. Todas as falas importantes e os eventos anteriores
foram mantidos, sem exigir que saves antigos repitam o tutorial.

## Interface e interação

Em cada pergunta e após uma resposta incorreta, aparece **PEDIR DICA À YARA**.
O botão abre uma comunicação com **YARA — CONEXÃO ESTABELECIDA**, ícone de sinal,
animação discreta e a dica daquele ID. Não há retrato dedicado no projeto: a janela
reaproveita o enquadramento superior do sprite `assets/characters/npcs/yara/idle.png`,
com escala em pixels. Não foi criado nem redesenhado nenhum recurso gráfico.

No desktop, a comunicação ocupa uma coluna lateral. Em telas pequenas, entra no
fluxo do modal com rolagem. Ela nunca fica sobre as alternativas. Seus controles
participam da navegação por Tab; mouse, Enter e Espaço funcionam. **FECHAR DICA** ou
Esc fecha apenas a comunicação; outro Esc, com a dica fechada, segue a regra de
fechar o terminal. O foco retorna ao botão de ajuda e a rolagem anterior é restaurada.
O jogo permanece pausado enquanto o terminal está aberto.

Após um erro, a pergunta, o feedback e as quatro alternativas continuam presentes.
O botão TENTAR NOVAMENTE permanece; também se pode clicar em outra alternativa
diretamente. Todas passam pela validação já existente. A ajuda não desabilita
alternativas nem altera o último índice respondido.

## Estado e segurança das recompensas

`hintOpen` e a posição de rolagem ficam apenas na sessão transitória do controlador
de terminais. Abrir/fechar a dica altera sua apresentação, não chama o avaliador,
não modifica atributos, não concede créditos, não salva nem marca progresso.
Há um único texto por pergunta, sem níveis adicionais de ajuda.

O painel reutiliza os mesmos nós de alternativas ao abrir e fechar; a sessão da
questão não é recriada. Trocar de terminal atualiza o texto pelo ID atual e remove
o painel anterior. Correção, gancho, módulos permanentes e implantes difíceis usam
exatamente as mesmas funções e identificadores de recompensa.

Não foi adicionado estado persistente de dicas nem modificado o formato de save.
Continuar e saves antigos não precisam de nenhum campo novo. Equipamento, EMP de
Íris, checkpoints, bosses e final permanecem independentes da assistência.

## Arquivos modificados

- `Nova_Aurora_Terminais_Redes/data/network_questions.json`: 12 campos `hint`.
- `js/network-terminals.js`: validação das dicas existentes no banco.
- `js/network-hacking.js`: comunicação, foco, fechamento, dicas por ID e feedback
  com alternativas preservadas.
- `js/dialogue.js`: explicação da ajuda no reencontro, preservando os demais diálogos.
- `css/network-hacking.css`: painel lateral/empilhado, recorte do sprite e sinal.
- `README.md` e este relatório.
- `tests/yara-hints.mjs`, `tests/yara-assistance-browser-cases.js`: testes novos.
- `tests/network-browser-cases.js`, `tests/browser-network.mjs`: integração dos
  testes e capturas da assistência na suíte real de navegador.

## Verificação

- **22 suítes locais** passaram, incluindo **93 verificações específicas** de dicas:
  unicidade, concisão, preservação dos índices e alternativas, ausência de citações
  da alternativa correta e de resultados numéricos de sub-redes, orientação de
  diagnóstico e compatibilidade de saves sem metadados de ajuda.
- O banco foi comparado ao pacote original: removendo apenas `hint`, todos os
  campos das questões e os metadados coincidem com o original.
- **344 verificações da assistência no Edge**: botão e dica corretos nas 12 questões
  antes da resposta e após erro, mesma sessão/seleção, mesmos nós de alternativas,
  ausência de desabilitação, estado de jogo e save inalterados, Tab/Espaço, reabertura,
  Esc e layout sem sobreposição em 1280×900, 390×640 e 640×360.
- As 12 questões foram respondidas corretamente com a dica aberta. Permaneceram
  o gancho, +40 PV, +15% de dano, +6% de corrida, 8% de redução de dano e os três
  implantes difíceis, sem pagamentos duplicados.
- A suíte também verificou inventário/equipamento, Continuar, Nova Jornada,
  renascimento, EMP de Íris e elevadores. Sem exceções JavaScript observadas.
- Regressões de navegador de Matrona, Warden, Véspera e computador central/final
  passaram. Sintaxe JavaScript e `git diff --check` passaram.

Capturas: `tests/network-screenshots/yara-dns-*.png` e `yara-hard-*.png`.
Resultados: `tests/network-browser-results.json`.

Para repetir: `node tests/yara-hints.mjs` e, com servidor HTTP e CDP configurados
conforme README, `node tests/browser-network.mjs`. A execução local usou HTTP 8777.

Limites: os cenários automatizados usam posicionamento controlado. Não foi feita
uma campanha manual completa nem uma avaliação pedagógica com alunos. Em telas
pequenas, a área do terminal rola para manter todos os controles acessíveis.
