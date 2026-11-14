import{checkpointById}from'./checkpoints.js';
// Logical floors use isolated horizontal coordinate bands; their height is
// presented through elevator travel, never through walkable connecting rooms.
export const TOWER_LAYOUT=1;
export const TOWER_FLOORS=[
 {id:'tower_floor_1',index:0,left:5200,right:8400,name:'01 · Segurança Corporativa',color:'#75e8ef',checkpoint:checkpointById('tower_floor_1-checkpoint').x,objective:'Explore a segurança e autorize o elevador com EMP.'},
 {id:'tower_floor_2',index:1,left:8800,right:12600,name:'02 · Laboratórios Secretos',color:'#ef6d80',checkpoint:checkpointById('tower_floor_2-checkpoint').x,objective:'Desative as barreiras e alcance o elevador do núcleo.'},
 {id:'tower_floor_3',index:2,left:13000,right:15600,name:'03 · Núcleo Central',color:'#ff3863',checkpoint:checkpointById('tower_floor_3-checkpoint').x,objective:'Derrote Véspera e aplique EMP no computador central.'}
];
export const towerFloorAt=x=>TOWER_FLOORS.find(f=>x>=f.left&&x<f.right);
export const TOWER_ARENA={left:13900,right:15300,floor:790,spawnX:14960};
export const TOWER_ELEVATORS=[
 {id:'tower_elevator_1_2',origin:'tower_floor_1',destination:'tower_floor_2',requiresEMP:true,stops:[{x:8190,arrivalX:8130},{x:8940,arrivalX:8990}]},
 {id:'tower_elevator_2_3',origin:'tower_floor_2',destination:'tower_floor_3',requiresEMP:true,stops:[{x:12370,arrivalX:12310},{x:13150,arrivalX:13210}]}
];
export function buildTower(map){
 for(const f of TOWER_FLOORS){
  map.platforms.push({x:f.left,y:790,w:f.right-f.left,h:110,kind:'ground'});
  for(const x of [f.left-24,f.right])if(x!==5176)map.platforms.push({x,y:-1600,w:24,h:2390,kind:'metal'});
 }
 // Structural partitions; traversal decks and anchors are authored in level-routes.js.
 for(const [x,y,h] of [[6350,610,180],[7430,610,180],[9870,490,300],[11400,490,300]])map.platforms.push({x,y,w:55,h,kind:'glass'});
 map.hazards.push({x:6810,y:772,w:120,h:18,kind:'laser'},{x:10300,y:772,w:220,h:18,kind:'virus'});
 map.towerBarriers=[{id:'tower-lab-barrier-1',x:10620,y:80,w:28,h:710,panelX:10540},{id:'tower-lab-barrier-2',x:12020,y:80,w:28,h:710,panelX:11940}];
 for(const barrier of map.towerBarriers){const solid={...barrier,kind:'glass'};barrier.solid=solid;map.platforms.push(solid);map.terminals.push({id:barrier.id,x:barrier.panelX,y:790,name:'Barreira de contenção · EMP',barrier:true})}
 map.terminals.push(
  {id:'tower-security-log',x:6230,y:245,name:'Vigilância corporativa',text:'Cada implante registra rotas e escolhas. Desvios são enviados à diretoria.'},
  {id:'log-3',x:9960,y:330,name:'Desenvolvimento viral',text:'O vírus altera decisões por meio dos implantes. O lote experimental deixou de respeitar os limites de segurança.'},
  {id:'tower-log-employees',x:10150,y:210,name:'Ensaio interno',text:'Funcionários foram inscritos sem consentimento. As câmaras registraram obediência crescente após a atualização.'},
  {id:'tower-log-vespera',x:11530,y:330,name:'Rede central',text:'Véspera mantém o comando de todos os nós. Somente um pulso no computador central interromperá a transmissão.'},
  {id:'tower-central-shutdown',x:15440,y:790,name:'Computador central',text:'PROTOCOLO CENTRAL — TRANSMISSÃO GLOBAL ATIVA'}
 );
 map.secrets.push({x:6270,y:245,item:'Arquivo de vigilância Aurora'},{x:10180,y:210,item:'Provas dos ensaios humanos'});
 map.npcs.push({id:'corporate-ai',x:5540,y:790,name:'IA corporativa',assetId:'npc_survivor',text:'Segurança no primeiro andar. Pesquisa no segundo. Diretoria e transmissor no terceiro. O acesso exige autorização eletromagnética. Retorno ao complexo: saída à esquerda.'});
}
