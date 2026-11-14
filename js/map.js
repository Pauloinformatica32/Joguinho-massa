import{CHECKPOINTS}from'./checkpoints.js';
import{organizeLevelRoutes}from'./level-routes.js';
import{attachNetworkTerminals}from'./network-terminals.js';
import{expandWorld}from'./world-design.js';
import{TOWER_FLOORS,buildTower,towerFloorAt}from'./tower-layout.js';
export const ROOM_W=2400,WORLD_H=900,GROUND=790;
export const FACTORY_LAYOUT=2;
export const factoryX=x=>x>=4000?x+400:x;
export const SECTOR9_LAYOUT=2;
export const MATRONA_ARENA=Object.freeze({left:1510,right:2360,floor:GROUND,spawnX:2070});
export const SECTOR9_AREAS=[{id:0,name:'Ruas dos Sobreviventes',left:0,right:700},{id:1,name:'Telhados e Passarelas',left:700,right:1400},{id:2,name:'Bloqueio de Quarentena',left:1400,right:2400}];
export const REGIONS=[
 {id:'slum',name:'Setor 9',subtitle:'ATO I · O CERCO',color:'#182b35',x:0},
 {id:'factory',name:'Complexo Industrial',subtitle:'ATO II · A DISTRIBUIÇÃO',color:'#302a2b',x:ROOM_W},
 {id:'corporate',name:'Torre Aurora',subtitle:'ATO III · A REDE DE CONTROLE',color:'#1c2037',x:ROOM_W*2+400}
];
for(const r of REGIONS)r.width=r.id==='factory'?2800:r.id==='corporate'?10400:ROOM_W;
export const WARDEN_ARENA=Object.freeze({left:REGIONS[1].x+REGIONS[1].width-710,right:REGIONS[1].x+REGIONS[1].width-40,floor:GROUND,spawnX:REGIONS[1].x+REGIONS[1].width-290});
export const WORLD_W=REGIONS.at(-1).x+REGIONS.at(-1).width;
export function regionAt(x){return REGIONS.find(r=>x>=r.x&&x<r.x+r.width)||(x<0?REGIONS[0]:REGIONS.at(-1))}
export function assetRegionAt(x){const r=regionAt(x);return r.id==='slum'?'slums':r.id==='factory'?'industrial':towerFloorAt(x)?.id==='tower_floor_3'?'virus_core':'corporate'}
const ROOM_NAMES=[['Ruas do Setor 9','Telhados e oficina','Bloqueio de Matrona'],['Recepção de carga','Linha de distribuição','Segurança Warden'],['Átrio corporativo','Laboratórios secretos','Núcleo de Véspera']];
export const MAP_ROOMS=REGIONS.flatMap((r,i)=>ROOM_NAMES[i].map((name,j)=>({id:i*3+j,name:i===0?SECTOR9_AREAS[j].name:i===2?TOWER_FLOORS[j].name:name,region:i,x:i===0?SECTOR9_AREAS[j].left:i===2?TOWER_FLOORS[j].left:r.x+j*800})));
export function roomAt(x){if(x>=5200)return 6+(towerFloorAt(x)?.index||0);return [...MAP_ROOMS].reverse().find(r=>x>=r.x)?.id??0}
const platform=(x,y,w,h,kind='metal')=>({x,y,w,h,kind});
export function buildMap(events=[]){
 const platforms=[],hazards=[],checkpoints=[],terminals=[],secrets=[],npcs=[],hookPoints=[];
 for(const r of REGIONS){
  const x=r.x;
  platforms.push(platform(x,GROUND,r.width,110,'ground'));
  // Arena fixtures and low cover retain their approved combat geometry.
  if(r.id==='slum')platforms.push(
   {...platform(1535,710,135,18,'arena'),oneWay:true,id:'arena-left'},
   {...platform(2200,710,135,18,'arena'),oneWay:true,id:'arena-right'},
   platform(950,718,42,72,'cover'),platform(1275,718,42,72,'cover'));
 }
 hazards.push({x:2900,y:GROUND-18,w:180,h:18,kind:'acid'},{x:3500,y:GROUND-18,w:150,h:18,kind:'press'},{x:5560,y:GROUND-18,w:150,h:18,kind:'laser'},{x:6290,y:GROUND-18,w:160,h:18,kind:'virus'});
 terminals.push(
  {x:1300,y:570,id:'log-1',name:'Terminal do isolamento'},
  {x:2310,y:GROUND,id:'gate-industrial',name:'Porta de carga'},
  {x:3100,y:590,id:'log-2',name:'Registro de distribuição'},
  {x:3800,y:550,id:'implant-double',name:'Estabilizador de manutenção',text:'Salto duplo integrado. Explore as passarelas superiores.'},
  {x:4710,y:GROUND,id:'gate-tower',name:'Elevador da Torre'},
  {x:5850,y:650,id:'log-3',name:'Arquivo da Aurora Dynamics'},
  {x:6230,y:550,id:'implant-overload',name:'Matriz de sobrecarga',text:'Sobrecarga integrada: fortalece o próximo golpe.'},
  {x:3350,y:650,id:'shortcut-maintenance',name:'Ponte de manutenção',text:'Ponte de manutenção estendida. A passagem superior evita a prensa.'},
  {x:1000,y:395,id:'shortcut-sector9',name:'Controle da passarela 09',text:'Passarela estendida. O atalho superior conecta os telhados à oficina.',shortcut:{...platform(1060,395,70,18,'bridge'),oneWay:true,id:'s9-bridge'}}
 );
 for(const t of terminals)if(t.shortcut&&events.includes(t.id))platforms.push({...t.shortcut});
 secrets.push({x:920,y:620,item:'Célula de energia'},{x:3100,y:550,item:'Dados de distribuição'},{x:5400,y:550,item:'Registros de experiências'},{x:6300,y:760,item:'Filtro anticontaminação'});
 secrets.push({x:1310,y:215,item:'Peças da vigilância 09'});
 npcs.push(
  {id:'yara',x:610,y:GROUND,name:'Yara · Hacker',assetId:'yara',defaultFacing:-1,facePlayerOnDialog:true,ability:'hook',text:'Robôs e cidadãos com implantes estão perdendo o controle. Os terminais dos telhados registraram as primeiras infecções. Matrona isolou o Setor 9 para impedir que as provas saiam daqui. Use este gancho nos pontos amarelos.'},
  {id:'oren-slum',x:1000,y:GROUND,name:'Oren · Mecânico',assetId:'oren',defaultFacing:-1,facePlayerOnDialog:true,shop:true,text:'Posso reforçar sua proteção por 20 créditos. Procure dados e peças nos telhados; cada segredo financia a próxima melhoria.'},
  {id:'oren-factory',x:2700,y:GROUND,name:'Oren · Mecânico',assetId:'oren',defaultFacing:-1,facePlayerOnDialog:true,shop:true,text:'Segui a linha de carga até aqui. Continuo oferecendo reforços por 20 créditos. Warden guarda a credencial da Torre Aurora.'},
  {id:'teo-factory',x:3180,y:GROUND,name:'Téo · Operário Sobrevivente',assetId:'teo',defaultFacing:-1,facePlayerOnDialog:true},
  {id:'scientist',x:3400,y:GROUND,name:'Dra. Íris Vale',assetId:'iris',defaultFacing:-1,facePlayerOnDialog:true,ability:'emp',text:'Eu trabalhava para a Aurora Dynamics. Distribuímos o vírus em dispositivos novos e atualizações de implantes. Ele não foi feito para destruir: altera decisões de humanos e máquinas conectados. Warden protege a operação. Leve meu pulso eletromagnético.'},
  {id:'corporate-ai',x:5800,y:GROUND,name:'IA corporativa · arquivo interno',assetId:'npc_survivor',text:'Autorização experimental Kael reconhecida. Véspera dirige o projeto de controle populacional. A epidemia foi um teste em humanos. Ela acredita que só uma rede central pode garantir estabilidade. O transmissor está no núcleo desta torre.'}
 );
 // Insert a maintenance sector before the existing security arena.
 for(const list of [platforms,hazards,checkpoints,terminals,secrets,npcs,hookPoints])for(const e of list){
  // Tower entries are already based on the shifted regional origin.
  if(e.x>=4000&&e.x<4800)e.x+=400;
  else if(e.x>=4800&&!platforms.includes(e)&&!checkpoints.includes(e)&&!hookPoints.includes(e))e.x+=400;
  if(e.shortcut)e.shortcut.x=factoryX(e.shortcut.x);
 }

 platforms.push(platform(2780,710,60,80,'cover'),platform(3260,700,80,90,'cover'),platform(3860,700,70,90,'cover'),platform(4160,700,95,90,'cover'));
 secrets.push({x:3650,y:395,item:'Esquema do circuito refrigerante'});
 for(const p of platforms)if(p.x>=2400&&p.x<5200&&p.h<70)p.oneWay=true;
 const pool=hazards.find(h=>h.kind==='acid');Object.assign(pool,{id:'coolant-pool',x:3500,y:GROUND-18,w:210,h:18,kind:'coolant'});
 const press=hazards.find(h=>h.kind==='press');Object.assign(press,{id:'industrial-press',x:4010,y:GROUND-100,w:70,h:100});
 // Local additions use final world coordinates, after the factory migration.
 // Thin one-way decks leave the entire floor clear for Warden's charge.
 platforms.push({...platform(4405,714,70,16,'catwalk'),oneWay:true,id:'warden-approach'});
 for(const [id,x,y,w] of [['left',4545,700,100],['center',4770,660,110],['right',5010,690,95]]){
  platforms.push({...platform(x,y,w,16,'unstable'),oneWay:true,id:'warden-deck-'+id,wardenDeck:true,warning:0,disabled:false,restoreTimer:0});
 }
 hookPoints.push({id:'warden-hook-left',x:4660,y:500,industrial:true,recharge:3,cooldown:0},
  {id:'warden-hook-right',x:4970,y:480,industrial:true,recharge:3,cooldown:0});
 const map={platforms,hazards,checkpoints,terminals,secrets,npcs,hookPoints,visuals:[]};
 for(const list of [platforms,hazards,checkpoints,terminals,secrets,npcs,hookPoints])for(let i=list.length-1;i>=0;i--)if(list[i].x>=5200)list.splice(i,1);
 buildTower(map,events);expandWorld(map);map.routeEvents=events;organizeLevelRoutes(map);map.checkpoints=CHECKPOINTS.map(cp=>({...cp}));attachNetworkTerminals(map);return map;
}
