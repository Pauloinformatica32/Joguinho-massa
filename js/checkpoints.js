// Final world coordinates. Stable IDs are shared by map, travel and save migration.
export const CHECKPOINTS=Object.freeze([
 {id:'s9-entry',x:310,region:0,name:'Abrigo da Chuva',purpose:'Entrada e aprendizagem; retorno a Yara'},
 {id:'s9-matrona',x:1440,region:0,name:'Oficina do bloqueio',purpose:'Após os telhados, imediatamente antes de Matrona'},
 {id:'factory-entry',x:2570,region:1,name:'Gerador auxiliar',purpose:'Entrada, montagem e retorno a Oren'},
 {id:'factory-warden',x:4380,region:1,name:'Manutenção de segurança',purpose:'Após contenção, antes da arena de Warden'},
 {id:'tower_floor_1-checkpoint',x:5390,region:2,floor:'tower_floor_1',name:'Segurança · Abrigo de entrada',purpose:'Entrada da torre'},
 {id:'tower-security-mid',x:7050,region:2,floor:'tower_floor_1',name:'Arquivo de segurança',purpose:'Entre as duas partições de segurança'},
 {id:'tower_floor_2-checkpoint',x:9090,region:2,floor:'tower_floor_2',name:'Laboratórios · Abrigo de entrada',purpose:'Chegada do elevador'},
 {id:'tower-lab-mid',x:11200,region:2,floor:'tower_floor_2',name:'Observação dos laboratórios',purpose:'Após a primeira barreira EMP, antes da segunda seção'},
 {id:'tower_floor_3-checkpoint',x:13810,region:2,floor:'tower_floor_3',name:'Último abrigo · Núcleo central',purpose:'Após a subida final, antes de Véspera'}
].map(Object.freeze));
export const checkpointById=id=>CHECKPOINTS.find(cp=>cp.id===id);
// A first arrival must not award the pre-boss refuge beyond an unplayed ascent.
// This is a safe transit spawn, not a second checkpoint kiosk/activation.
export const TRANSIT_SPAWNS=Object.freeze([{id:'tower-core-arrival',x:13210,region:2,floor:'tower_floor_3',name:'Núcleo · Chegada do elevador'}]);
const respawns=[...CHECKPOINTS,...TRANSIT_SPAWNS];
export function checkpointState(cp,height=54){return {...cp,y:790-height-3}}
export function entryCheckpoint(region=0){return CHECKPOINTS.find(cp=>cp.region===region)}
export function resolveCheckpoint(saved,region=0,floor=null){
 const candidates=respawns.filter(cp=>cp.region===region&&(!floor||cp.floor===floor));
 // Coordinate-only saves predate IDs. Removed refuges migrate within the same floor.
 const aliases={680:'s9-entry',3330:'factory-entry',3980:'factory-warden',13520:'tower_floor_3-checkpoint',1580:'s9-matrona',6780:'tower-security-mid'};
 return candidates.find(cp=>cp.id===saved?.id)||candidates.find(cp=>cp.x===saved?.x)||
  candidates.find(cp=>cp.id===aliases[saved?.x])||candidates[0]||entryCheckpoint(region);
}
// Automatic travel does not replace an already activated refuge in the destination band.
export function travelCheckpoint(state,region,floor=null){
 if(region!==2)floor=null;
 state.checkpointHistory??={};
 const saved=state.checkpoint;
 const previous=respawns.find(cp=>cp.id===saved?.id||cp.x===saved?.x);
 if(previous)state.checkpointHistory[previous.floor||'region-'+previous.region]=previous.id;
 const known=respawns.find(cp=>(cp.id===saved?.id||cp.x===saved?.x)&&cp.region===region&&(!floor||cp.floor===floor));
 const remembered=respawns.find(cp=>cp.id===state.checkpointHistory[floor||'region-'+region]&&cp.region===region&&(!floor||cp.floor===floor));
 const target=known||remembered||TRANSIT_SPAWNS.find(cp=>cp.floor===floor)||CHECKPOINTS.find(cp=>cp.region===region&&(!floor||cp.floor===floor))||entryCheckpoint(region);
 return checkpointState(target,state.player.h);
}
