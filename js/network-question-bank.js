// Generated from Nova_Aurora_Terminais_Redes/data/network_questions.json. Keep content identical.
export default {
  "schemaVersion": 1,
  "game": "Nova Aurora",
  "language": "pt-BR",
  "notes": "The numbers are suggested starting values. Map reward types to existing player progression/stat systems; do not stack rewards twice. The Yara terminal is required for new saves, other terminals are optional. This is authored educational content, not a generated gameplay config schema.",
  "questions": [
    {
      "id": "t01_yara_dns",
      "region": "setor9",
      "terminalTitle": "Terminal de Yara",
      "topic": "DNS",
      "hint": "Pensa na agenda do nosso comunicador: o apelido ajuda você a encontrar o contato certo. A máquina também precisa localizar o destino quando você digita um nome, Kael.",
      "question": "Qual é a principal função do DNS em uma rede?",
      "options": [
        "Distribuir endereços IP automaticamente",
        "Traduzir nomes de domínio em endereços IP",
        "Criptografar redes Wi-Fi",
        "Encaminhar pacotes entre roteadores"
      ],
      "correctIndex": 1,
      "explanation": "O DNS permite resolver nomes como exemplo.com para endereços IP.",
      "reward": {
        "type": "unlock_grapple",
        "value": 1,
        "label": "Acesso ao implante de gancho cibernético"
      },
      "storyLog": "O terminal autentica a antiga assinatura de Kael e Yara e libera o módulo de gancho."
    },
    {
      "id": "t02_setor9_dhcp",
      "region": "setor9",
      "terminalTitle": "Nó de Abastecimento",
      "topic": "DHCP",
      "hint": "Lembra quando ligávamos uma máquina nova sem preencher a configuração à mão? Em redes com concessões, os parâmetros podem ser renovados em vez de ficar gravados para sempre.",
      "question": "Para que serve o protocolo DHCP numa rede?",
      "options": [
        "Hospedar páginas web",
        "Converter endereços MAC em nomes de domínio",
        "Atribuir automaticamente endereços IP e outras configurações de rede",
        "Bloquear ataques em páginas HTTPS"
      ],
      "correctIndex": 2,
      "explanation": "O DHCP automatiza a distribuição de configurações IP, como endereço, máscara, gateway e DNS.",
      "reward": {
        "type": "max_health",
        "value": 10,
        "label": "+10 de vida máxima"
      },
      "storyLog": "Kael recupera o módulo de manutenção do distrito."
    },
    {
      "id": "t03_setor9_osi",
      "region": "setor9",
      "terminalTitle": "Roteador Comunitário",
      "topic": "Modelo OSI",
      "hint": "Não confunda a entrega ao vizinho com a escolha do caminho até o servidor, Kael. Procure a camada que entende esse destino lógico, não só o enlace local.",
      "question": "Em qual camada do modelo OSI acontece o roteamento de pacotes IP?",
      "options": [
        "Física",
        "Enlace de Dados",
        "Rede",
        "Aplicação"
      ],
      "correctIndex": 2,
      "explanation": "O roteamento IP ocorre na camada de Rede (camada 3) do modelo OSI.",
      "reward": {
        "type": "damage_multiplier",
        "value": 0.05,
        "label": "+5% de dano"
      },
      "storyLog": "Kael desbloqueia ajustes do software de combate."
    },
    {
      "id": "t04_setor9_switch",
      "region": "setor9",
      "terminalTitle": "Central de Comutação",
      "topic": "Switches",
      "hint": "O equipamento aprende em qual porta cada interface apareceu ao observar quem enviou os quadros. Pensa em como essa tabela ajuda a escolher a saída, Kael.",
      "question": "Um switch Ethernet tradicional usa principalmente qual informação para encaminhar quadros numa rede local?",
      "options": [
        "Nome do domínio DNS",
        "Endereço MAC de destino",
        "Número da porta TCP de origem",
        "Endereço de e-mail"
      ],
      "correctIndex": 1,
      "explanation": "Switches de camada 2 utilizam a tabela MAC para encaminhar quadros às portas adequadas.",
      "reward": {
        "type": "move_speed_multiplier",
        "value": 0.03,
        "label": "+3% de velocidade"
      },
      "storyLog": "Um controlador de movimento responde ao firmware recuperado."
    },
    {
      "id": "t05_industrial_ipv4",
      "region": "industrial",
      "terminalTitle": "Estação de Endereçamento",
      "topic": "IPv4",
      "hint": "Lembra dos quatro blocos separados por pontos? Cada bloco ocupa um octeto; faça a conta, que a minha parte da dupla não era a calculadora.",
      "question": "Quantos bits possui um endereço IPv4?",
      "options": [
        "16 bits",
        "32 bits",
        "64 bits",
        "128 bits"
      ],
      "correctIndex": 1,
      "explanation": "Um endereço IPv4 é formado por 32 bits.",
      "reward": {
        "type": "damage_reduction",
        "value": 0.04,
        "label": "-4% de dano recebido"
      },
      "storyLog": "Kael reforça a proteção lógica de sua armadura."
    },
    {
      "id": "t06_industrial_subnet",
      "region": "industrial",
      "terminalTitle": "Painel de Sub-redes",
      "topic": "Máscara de sub-rede",
      "hint": "Separe os bits do prefixo dos bits de hosts; os primeiros ficam em 1 na máscara. Para dimensionar os hosts, teste potências de dois e reserve os endereços de rede e broadcast antes de escolher a menor opção, Kael.",
      "question": "Qual máscara decimal corresponde ao prefixo IPv4 /24?",
      "options": [
        "255.255.0.0",
        "255.0.0.0",
        "255.255.255.0",
        "255.255.255.252"
      ],
      "correctIndex": 2,
      "explanation": "O prefixo /24 possui 24 bits 1 na máscara: 255.255.255.0.",
      "reward": {
        "type": "max_health",
        "value": 10,
        "label": "+10 de vida máxima"
      },
      "storyLog": "A estação libera um módulo de autorreparo."
    },
    {
      "id": "t07_industrial_https",
      "region": "industrial",
      "terminalTitle": "Gateway de Segurança",
      "topic": "HTTPS",
      "hint": "O cadeado se refere à proteção dos dados em trânsito e à identidade do servidor. Pense no mecanismo de sessão segura por baixo da conversa HTTP, Kael.",
      "question": "O que o HTTPS acrescenta à comunicação HTTP?",
      "options": [
        "Substitui os endereços IP por endereços MAC",
        "Proteção criptográfica da conexão por TLS",
        "Dispensa a necessidade de um navegador",
        "Transforma todos os sites em redes Wi-Fi"
      ],
      "correctIndex": 1,
      "explanation": "O HTTPS utiliza TLS para proteger a comunicação HTTP em trânsito.",
      "reward": {
        "type": "damage_multiplier",
        "value": 0.05,
        "label": "+5% de dano"
      },
      "storyLog": "Kael acessa rotinas avançadas de precisão dos implantes."
    },
    {
      "id": "t08_industrial_arp",
      "region": "industrial",
      "terminalTitle": "Mesa de Resolução",
      "topic": "ARP",
      "hint": "Antes de entregar um quadro ao próximo equipamento do mesmo enlace, falta descobrir o identificador da interface dele. Pensa na consulta local que fazemos antes do primeiro envio, Kael.",
      "question": "Em uma rede IPv4 local, para que serve o ARP?",
      "options": [
        "Descobrir o endereço MAC correspondente a um endereço IPv4",
        "Criptografar o tráfego entre dois sites",
        "Definir o canal do roteador Wi-Fi",
        "Aumentar automaticamente a banda disponível"
      ],
      "correctIndex": 0,
      "explanation": "O ARP resolve um endereço IPv4 em um endereço MAC na rede local.",
      "reward": {
        "type": "move_speed_multiplier",
        "value": 0.03,
        "label": "+3% de velocidade"
      },
      "storyLog": "O terminal otimiza as respostas do sistema de propulsão."
    },
    {
      "id": "t09_tower_nat",
      "region": "tower",
      "terminalTitle": "Firewall Corporativo",
      "topic": "NAT",
      "hint": "Não olhe só para os endereços, Kael: compare o que tornaria os dois fluxos iguais vistos de fora. O gateway precisa devolver cada resposta ao dono certo; investigue o que mais existe no cabeçalho de transporte.",
      "question": "Qual é uma função comum do NAT em roteadores de acesso à internet?",
      "options": [
        "Substituir o protocolo HTTPS",
        "Transmitir energia por cabo de rede",
        "Converter nomes de domínio em IP",
        "Traduzir endereços IP privados para um endereço público no tráfego de saída"
      ],
      "correctIndex": 3,
      "explanation": "O NAT permite traduzir endereços privados para endereços públicos, normalmente com tradução de portas no acesso compartilhado à internet.",
      "reward": {
        "type": "max_health",
        "value": 10,
        "label": "+10 de vida máxima"
      },
      "storyLog": "Kael desvia energia do sistema de contenção para seus implantes."
    },
    {
      "id": "t10_tower_ping",
      "region": "tower",
      "terminalTitle": "Terminal de Diagnóstico",
      "topic": "Diagnóstico de rede",
      "hint": "Observe o tipo de mensagem enviado e recebido pelo teste, além dos filtros que podem bloqueá-lo. Esse diagnóstico não precisa abrir uma sessão de navegação, Kael.",
      "question": "Qual protocolo é normalmente usado pelo comando ping para testar a conectividade?",
      "options": [
        "FTP",
        "ICMP",
        "DHCP",
        "HTTPS"
      ],
      "correctIndex": 1,
      "explanation": "O ping normalmente utiliza mensagens ICMP Echo Request e Echo Reply.",
      "reward": {
        "type": "damage_reduction",
        "value": 0.04,
        "label": "-4% de dano recebido"
      },
      "storyLog": "Kael antecipa o fluxo dos sistemas de defesa da torre."
    },
    {
      "id": "t11_tower_ipv6",
      "region": "tower",
      "terminalTitle": "Servidor de Protocolo",
      "topic": "IPv6",
      "hint": "Conta pelo formato completo, Kael: são oito grupos, cada um com dezesseis bits. Os dois-pontos duplos só abreviam zeros; não encolhem o endereço.",
      "question": "Quantos bits possui um endereço IPv6?",
      "options": [
        "32 bits",
        "48 bits",
        "64 bits",
        "128 bits"
      ],
      "correctIndex": 3,
      "explanation": "Endereços IPv6 têm 128 bits.",
      "reward": {
        "type": "damage_multiplier",
        "value": 0.05,
        "label": "+5% de dano"
      },
      "storyLog": "Kael recupera acesso aos comandos militares dos implantes."
    },
    {
      "id": "t12_tower_wpa3",
      "region": "tower",
      "terminalTitle": "Ponto de Acesso Restrito",
      "topic": "Segurança sem fio",
      "hint": "A proteção sem fio precisa resistir a tentativas de adivinhar a senha e proteger a troca de dados. Pensa na família de padrões feita para essa tarefa, Kael.",
      "question": "Qual padrão foi criado para reforçar a segurança de redes Wi-Fi?",
      "options": [
        "FTP",
        "POP3",
        "WPA3",
        "SNMP"
      ],
      "correctIndex": 2,
      "explanation": "O WPA3 é um padrão moderno de segurança para redes Wi-Fi.",
      "reward": {
        "type": "max_health",
        "value": 10,
        "label": "+10 de vida máxima"
      },
      "storyLog": "Kael extrai o último módulo de reforço antes do núcleo."
    }
  ]
};
