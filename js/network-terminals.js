import bank from '../Nova_Aurora_Terminais_Redes/data/network_questions.json' with {type:'json'};

export function validateQuestionBank(data){
 if(!Array.isArray(data?.questions)||data.questions.length<10)throw Error('O banco precisa de pelo menos dez questões.');
 const ids=new Set(),types=new Set(['unlock_grapple','max_health','damage_multiplier','move_speed_multiplier','damage_reduction']);
 for(const q of data.questions){
  if(!q.id||ids.has(q.id))throw Error('ID de questão inválido ou duplicado.');ids.add(q.id);
  if(!Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4||!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>3)throw Error('Alternativas inválidas: '+q.id);
  if([q.id,q.region,q.terminalTitle,q.topic,q.question,q.explanation,q.hint,q.storyLog,...q.options,q.reward?.label].some(s=>typeof s!=='string'||!s.trim()||s.includes('\ufffd')))throw Error('Texto ausente ou inválido: '+q.id);
  if(!types.has(q.reward?.type)||!Number.isFinite(q.reward.value)||q.reward.value<=0)throw Error('Recompensa inválida: '+q.id);
 }return data.questions;
}
export const NETWORK_QUESTIONS=validateQuestionBank(bank);
// Keep the supplied bank and zero-based answer keys intact. Hard terminals add
// applied reasoning to the same topic/ID, with stronger distractors where needed.
export const NETWORK_DIFFICULTIES={easy:{label:'FÁCIL',rank:'I'},medium:{label:'MÉDIO',rank:'II'},hard:{label:'DIFÍCIL',rank:'III'}};
const tiers={t01_yara_dns:'easy',t02_setor9_dhcp:'medium',t03_setor9_osi:'hard',t04_setor9_switch:'medium',t05_industrial_ipv4:'easy',t06_industrial_subnet:'hard',t07_industrial_https:'medium',t08_industrial_arp:'medium',t09_tower_nat:'hard',t10_tower_ping:'medium',t11_tower_ipv6:'easy',t12_tower_wpa3:'medium'};
const hardChallenges={
 t03_setor9_osi:{implantId:'firewall',question:'Kael envia dados para outra sub-rede. O quadro Ethernet chega ao gateway com o MAC do roteador, mas o pacote mantém o IP do servidor remoto. Em qual camada OSI o roteador consulta a tabela de rotas para escolher o próximo salto?',explanation:'A camada de Rede (3) usa o IP de destino para escolher a rota. O MAC entrega o quadro ao próximo equipamento no enlace local; ele não identifica toda a rota até o servidor.'},
 t06_industrial_subnet:{implantId:'overclock',question:'Uma linha de montagem precisa de exatamente 254 endereços IPv4 utilizáveis para hosts. Sem contar rede e broadcast, qual é a menor sub-rede entre as alternativas que atende essa capacidade?',explanation:'São necessários 8 bits de host: 2⁸ − 2 = 254 endereços utilizáveis. Restam 24 bits de rede: /24, máscara 255.255.255.0. /30 só oferece 2 hosts; /16 e /8 desperdiçam mais endereços.'},
 t09_tower_nat:{implantId:'interference',question:'Dois hosts privados abrem conexões TCP simultâneas usando a mesma porta de origem para o mesmo servidor HTTPS. O gateway tem apenas um IPv4 público. Como NAT com tradução de portas (PAT) distingue as respostas?',options:['Altera o IP de destino do servidor e dispensa o estado das conexões','Envia os dois fluxos com o mesmo IP e a mesma porta públicos, sem tabela de tradução','Troca os endereços MAC dos hosts por nomes DNS no cabeçalho IP','Traduz o IP de origem para o público, atribui portas públicas distintas e mantém os mapeamentos'],explanation:'O PAT associa cada fluxo interno a uma combinação pública de IP e porta. Portas públicas distintas permitem encaminhar cada resposta ao host correto, mesmo quando os dois usam a mesma porta de origem.'}
};
export function networkChallenge(question){return{...question,...hardChallenges[question.id],difficulty:tiers[question.id]||'medium'};}
export const difficultyFor=id=>networkChallenge(NETWORK_QUESTIONS.find(q=>q.id===id)).difficulty;
export const TUTORIAL_QUESTION='t01_yara_dns';
// Reused console IDs preserve their original story events and shortcut actions.
export const NETWORK_TERMINALS=[
 {questionId:'t01_yara_dns',terminalId:'network-yara',x:735,y:790},
 {questionId:'t02_setor9_dhcp',terminalId:'log-1'},
 {questionId:'t03_setor9_osi',terminalId:'shortcut-sector9'},
 {questionId:'t04_setor9_switch',terminalId:'world-s9-antenna'},
 {questionId:'t05_industrial_ipv4',terminalId:'log-2'},
 {questionId:'t06_industrial_subnet',terminalId:'shortcut-maintenance'},
 {questionId:'t07_industrial_https',terminalId:'world-factory-crane'},
 {questionId:'t08_industrial_arp',terminalId:'network-maintenance',x:4100,y:590},
 {questionId:'t09_tower_nat',terminalId:'tower-security-log'},
 {questionId:'t10_tower_ping',terminalId:'world-security-audit'},
 {questionId:'t11_tower_ipv6',terminalId:'log-3'},
 {questionId:'t12_tower_wpa3',terminalId:'network-core-service',x:13620,y:350}
];
export const networkQuestion=id=>NETWORK_QUESTIONS.find(q=>q.id===id);
export function attachNetworkTerminals(map){
 for(const placement of NETWORK_TERMINALS){let t=map.terminals.find(t=>t.id===placement.terminalId);const q=networkQuestion(placement.questionId);
  if(!t){t={id:placement.terminalId,x:placement.x,y:placement.y,name:q.terminalTitle,text:q.storyLog};map.terminals.push(t);}
  t.questionId=q.id;
 }
 // Yara introduces the tutorial, but no longer awards the hook on conversation.
 const yara=map.npcs.find(n=>n.id==='yara');if(yara)delete yara.ability;
}
