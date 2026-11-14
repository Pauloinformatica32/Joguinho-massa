// Authored decks replace overlapping legacy tiers; solid gates, cover and boss arenas stay intact.
export const ROUTE_DECKS=[
 // City balconies → tutorial roof → quarantine; antenna is a distinct optional branch.
 ['s9-step',180,690,260,'scrap','main'],['s9-balcony',430,610,170,'walkway','main'],
 ['s9-tutorial-roof',820,580,270,'roof','main'],['s9-log-roof',1120,570,250,'walkway','main'],
 ['s9-shortcut-west',900,395,160,'roof','optional'],['s9-shortcut-east',1130,395,240,'walkway','main'],
 ['s9-quarantine-ledge',1220,215,150,'roof','main'],
 ['s9-antenna-lower',950,110,230,'roof','optional'],['s9-antenna-middle',740,-100,240,'walkway','optional'],['s9-antenna',570,-350,240,'roof','optional'],
 // Industrial floor retains combat lanes and NPCs. Service catwalks cross the visible hazards.
 ['factory-loading',2550,690,260,'catwalk','main'],['factory-assembly',2870,680,290,'catwalk','main'],
 ['factory-log',3010,590,280,'catwalk','main'],['factory-maintenance',3300,650,200,'catwalk','main'],
 ['factory-coolant-west',3380,550,160,'catwalk','main'],['factory-coolant-east',3740,550,220,'catwalk','main'],
 ['factory-service-west',3890,590,120,'catwalk','main'],['factory-service-east',4090,590,280,'catwalk','main'],
 ['factory-crane-lower',3460,310,260,'catwalk','optional'],['factory-crane-middle',3730,40,250,'catwalk','optional'],['factory-crane',3770,-310,360,'catwalk','optional'],
 ['factory-turns-balcony',2500,240,250,'catwalk','optional'],['factory-turns-lower',2640,440,230,'catwalk','optional'],
 // Fixed camera mounts retain their precise collision decks (455+18 and 445+18).
 ['security-entry',5500,680,250,'glass','main'],['security-west',5780,565,250,'glass','main'],
 ['security-camera',6080,455,240,'glass','main'],['security-partition-west',6280,565,260,'glass','main'],
 ['security-laser-bridge',6680,675,290,'glass','main'],['security-partition-east',7200,565,500,'glass','main'],['security-lift',7850,680,280,'glass','main'],
 ['security-log',6180,245,250,'glass','optional'],['security-archive-lower',6530,40,300,'glass','optional'],['security-archive-upper',6850,-155,280,'glass','optional'],['security-audit',7150,-315,360,'glass','optional'],
 // Lab shafts cross the structural partitions, then return to the mandatory EMP panels.
 ['lab-entry',9110,675,260,'catwalk','main'],['lab-west',9420,560,280,'catwalk','main'],
 ['lab-partition-west',9700,445,230,'catwalk','main'],['lab-log',9880,330,260,'catwalk','main'],
 ['lab-panel-approach',10170,560,330,'catwalk','main'],['lab-barrier-east',10730,675,250,'catwalk','main'],
 ['lab-panel-return',10240,675,220,'catwalk','main'],
 ['lab-east-approach',11000,675,240,'catwalk','main'],['lab-camera',11200,445,220,'catwalk','main'],['lab-partition-east',11370,330,360,'catwalk','main'],['lab-exit',11750,560,140,'catwalk','main'],['lab-lift',12220,680,180,'catwalk','main'],
 ['lab-east-return',11500,560,180,'catwalk','main'],['lab-exit-return',11650,675,240,'catwalk','main'],
 ['lab-employees',10050,210,260,'catwalk','optional'],['lab-consent-middle',9730,-40,260,'catwalk','optional'],['lab-consent',9850,-315,320,'catwalk','optional'],
 // Service ascent stays entirely outside the final arena and its telegraphs.
 ['core-step',13070,680,230,'fleshmetal','main'],['core-maintenance',13230,570,240,'fleshmetal','main'],
 ['core-shaft-crossing',13350,460,300,'fleshmetal','main'],['core-terminal',13550,350,240,'fleshmetal','optional'],
 ['core-descent',13640,680,140,'fleshmetal','main'],['core-map-middle',13130,290,220,'fleshmetal','optional'],['core-map',13050,100,260,'fleshmetal','optional']
];
// Every anchor names its launch/recovery decks and its architectural purpose.
export const ROUTE_HOOKS=[
 ['s9-tutorial-hook',900,500,'ground:0','s9-tutorial-roof','Primeiro gancho: antena do telhado'],
 ['s9-upper-hook',1230,300,'s9-log-roof','s9-shortcut-east','Subir à passarela de quarentena'],
 ['s9-quarantine-hook',1280,110,'s9-shortcut-east','s9-quarantine-ledge','Cruzar o topo do bloqueio'],
 ['s9-antenna-1',1040,40,'s9-quarantine-ledge','s9-antenna-lower','Ramo da antena comunitária'],
 ['s9-antenna-2',850,-170,'s9-antenna-lower','s9-antenna-middle','Subir pelo mastro'],
 ['s9-antenna-3',660,-420,'s9-antenna-middle','s9-antenna','Alcançar registro e recompensa'],
 ['factory-coolant-hook',3650,390,'factory-coolant-west','factory-coolant-east','Ponte rolante sobre refrigerante'],
 ['factory-service-hook',4140,410,'factory-service-west','factory-service-east','Alternativa à prensa antes do reparo'],
 ['factory-crane-1',3570,230,'factory-coolant-west','factory-crane-lower','Acesso opcional ao guindaste'],
 ['factory-crane-2',3830,-40,'factory-crane-lower','factory-crane-middle','Subir pelo equipamento'],
 ['factory-crane-3',3910,-370,'factory-crane-middle','factory-crane','Registro superior da fábrica'],
 ['factory-turns-hook',2630,160,'factory-turns-lower','factory-turns-balcony','Arquivo opcional de turnos'],
 ['security-entry-hook',5850,480,'security-entry','security-west','Subir à segurança'],
 ['security-camera-hook',6190,350,'security-west','security-camera','Cruzamento da partição'],
 ['security-east-hook',7410,400,'ground:6930','security-partition-east','Passagem sobre segunda partição'],
 ['security-log-hook',6270,150,'security-camera','security-log','Arquivo de vigilância'],
 ['security-archive-1',6660,-30,'security-log','security-archive-lower','Ramo de auditoria'],
 ['security-archive-2',6970,-220,'security-archive-lower','security-archive-upper','Estrutura superior'],
 ['security-archive-3',7310,-380,'security-archive-upper','security-audit','Auditoria opcional'],
 ['lab-entry-hook',9510,450,'lab-entry','lab-west','Passarela de pesquisa'],
 ['lab-partition-hook',9840,340,'lab-west','lab-partition-west','Subida da contenção'],
 ['lab-log-hook',10000,230,'lab-partition-west','lab-log','Registro viral'],
 ['lab-east-hook',11260,340,'lab-east-approach','lab-camera','Retomada após EMP'],
 ['lab-exit-hook',11520,210,'lab-camera','lab-partition-east','Cruzar segunda partição'],
 ['lab-employees-hook',10180,110,'lab-log','lab-employees','Provas dos ensaios'],
 ['lab-consent-1',9850,-120,'lab-employees','lab-consent-middle','Arquivo lateral'],
 ['lab-consent-2',9980,-380,'lab-consent-middle','lab-consent','Consentimento neural'],
 ['core-ascent-hook',13450,370,'core-maintenance','core-shaft-crossing','Cruzar alimentação central'],
 ['core-terminal-hook',13650,240,'core-shaft-crossing','core-terminal','Console de serviço'],
 ['core-map-access',13200,190,'core-shaft-crossing','core-map-middle','Subir ao ramal de alimentação'],
 ['core-map-hook',13180,0,'core-map-middle','core-map','Mapa opcional de alimentação']
];
export function organizeLevelRoutes(map){
 // Retain all solid geometry, explicit arenas and their unstable recovery decks.
 map.platforms=map.platforms.filter(p=>p.h>=70||p.id?.startsWith('arena-')||p.id?.startsWith('warden-'));
 for(const [id,x,y,w,kind,route]of ROUTE_DECKS)map.platforms.push({id,x,y,w,h:18,kind,route,oneWay:true,architecture:true});
 // This service obstruction is outside the core arena and prevents a purposeless ground bypass.
 map.platforms.push({id:'core-power-column',x:13440,y:490,w:70,h:300,kind:'metal'});
 if(map.routeEvents.includes('s9-quarantine-return'))map.platforms.find(p=>p.id==='s9-quarantine-bulkhead').disabled=true;
 for(const p of map.platforms)p.id??=`solid-${p.x}-${p.y}`;
 const warden=map.hookPoints.filter(h=>h.id?.startsWith('warden-hook-'));
 for(const h of warden)h.purpose='Escape controlado de investida, laser e ondas de Warden';
 map.hookPoints=ROUTE_HOOKS.map(([id,x,y,from,to,purpose])=>({id,x,y,from,to,purpose,architectural:true,recharge:4,cooldown:0})).concat(warden);
 const move=(id,x,y)=>{const t=map.terminals.find(t=>t.id===id);if(t)Object.assign(t,{x,y})};
 // Real landings under existing interactables; IDs and story text are unchanged.
 move('log-2',3100,590);move('implant-double',3800,550);move('tower-log-vespera',11530,330);
 move('shortcut-maintenance',3350,650);
 const bridge=map.terminals.find(t=>t.id==='shortcut-maintenance');
 bridge.shortcut={id:'factory-repaired-bridge',x:3980,y:590,w:180,h:18,kind:'bridge',oneWay:true,route:'shortcut'};
 // Rebuild activated shortcuts after legacy decks are replaced.
 for(const t of map.terminals)if(t.shortcut&&map.routeEvents.includes(t.id))map.platforms.push({...t.shortcut});
 // Reattach collectibles to the authored decks, without removing rewards.
 for(const s of map.secrets){
  const changes={'Célula de energia':[920,580],'Dados de distribuição':[3210,590],'Esquema do circuito refrigerante':[3580,310],
   'Peças da antena comunitária':[1110,110],'Projeto da linha de montagem':[3890,-310],'Registro dos turnos perdidos':[2590,240],
   'Auditoria de vigilância':[7390,-315],'Protocolo de consentimento neural':[9970,-315],'Mapa da alimentação central':[13120,100]};
  if(changes[s.item])[s.x,s.y]=changes[s.item];
 }
 map.routes=ROUTE_DECKS.map(([id,x,y,w,kind,route])=>({id,x:x+w/2,y,route}));
 delete map.routeEvents;
}
export function activateRouteCheckpoint(map,state,cp){
 if(cp.id==='s9-matrona'&&state.abilities.hook){
  if(!state.events.includes('s9-quarantine-return'))state.events.push('s9-quarantine-return');
  map.platforms.find(p=>p.id==='s9-quarantine-bulkhead').disabled=true;
 }
}
