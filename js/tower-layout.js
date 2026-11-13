// Logical floors use isolated horizontal coordinate bands; their height is
// presented through elevator travel, never through walkable connecting rooms.
export const TOWER_LAYOUT=1;
export const TOWER_FLOORS=[
 {id:'tower_floor_1',index:0,left:5200,right:8400,name:'01 · Segurança Corporativa',color:'#75e8ef',checkpoint:5390,objective:'Explore a segurança e autorize o elevador com EMP.'},
 {id:'tower_floor_2',index:1,left:8800,right:12600,name:'02 · Laboratórios Secretos',color:'#ef6d80',checkpoint:9090,objective:'Desative as barreiras e alcance o elevador do núcleo.'},
 {id:'tower_floor_3',index:2,left:13000,right:15600,name:'03 · Núcleo Central',color:'#ff3863',checkpoint:13520,objective:'Derrote Véspera e aplique EMP no computador central.'}
];
export const towerFloorAt=x=>TOWER_FLOORS.find(f=>x>=f.left&&x<f.right);
export const TOWER_ARENA={left:13900,right:15300,floor:790,spawnX:14960};
export const TOWER_ELEVATORS=[
 {id:'tower_elevator_1_2',origin:'tower_floor_1',destination:'tower_floor_2',requiresEMP:true,stops:[{x:8190,arrivalX:8130},{x:8940,arrivalX:8990}]},
 {id:'tower_elevator_2_3',origin:'tower_floor_2',destination:'tower_floor_3',requiresEMP:true,stops:[{x:12370,arrivalX:12310},{x:13150,arrivalX:13210}]}
];
export function buildTower(map){
 const add=(f,x,y,w,kind='glass')=>map.platforms.push({x:f.left+x,y,w,h:18,kind,oneWay:true});
 for(const f of TOWER_FLOORS){
  map.platforms.push({x:f.left,y:790,w:f.right-f.left,h:110,kind:'ground'});
  for(const x of [f.left-24,f.right])if(x!==5176)map.platforms.push({x,y:-1600,w:24,h:2390,kind:'metal'});
  map.checkpoints.push({id:f.id+'-checkpoint',floor:f.id,x:f.checkpoint,name:f.name+' · Abrigo'});
 }
 const a=TOWER_FLOORS[0],b=TOWER_FLOORS[1];
 for(const [x,y,w] of [[300,680,230],[580,565,220],[880,455,240],[1160,565,230],[1450,675,220],[1740,565,230],[2020,455,230],[2330,570,220],[2650,680,250],[700,335,180],[1000,245,200]])add(a,x,y,w);
 for(const [x,y,w] of [[310,675,180],[560,560,180],[810,445,190],[1080,330,200],[1370,445,180],[1610,560,210],[1880,675,220],[2150,560,170],[2400,445,190],[2660,330,200],[2930,445,200],[3220,560,210],[3420,680,180],[1280,210,180]])add(b,x,y,w,'catwalk');
 map.platforms.push({id:'tower-lab-unstable',x:10830,y:440,w:100,h:18,kind:'unstable',oneWay:true,warning:0,disabled:false,restoreTimer:0});
 // Security partitions force an ascent, with an optional higher archive route.
 for(const [x,y,h] of [[6350,610,180],[7430,610,180],[9870,490,300],[11400,490,300]])map.platforms.push({x,y,w:55,h,kind:'glass'});
 for(const [x,y] of [[5800,420],[6180,310],[7220,400],[7780,310],[9440,410],[9820,290],[10180,170],[11050,420],[11440,280],[11800,190]])map.hookPoints.push({x,y});
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
