// World-space architecture. Existing story, arena and NPC coordinates stay stable.
export const WORLD_TOP=-720;
export const WORLD_DESIGN=1;
export const DISTRICTS=[
 {left:0,right:700,name:'09 / RUA DOS SOBREVIVENTES'},
 {left:700,right:1400,name:'09 / REDE DOS TELHADOS'},
 {left:1400,right:2400,name:'09 / QUARENTENA AUTOMATIZADA'},
 {left:2400,right:3200,name:'AURORA / RECEBIMENTO DE CARGA'},
 {left:3200,right:4000,name:'AURORA / MONTAGEM E REFRIGERAÇÃO'},
 {left:4000,right:4480,name:'AURORA / MANUTENÇÃO E CONTENÇÃO'},
 {left:4480,right:5200,name:'AURORA / SEGURANÇA WARDEN'}
];
export function expandWorld(map){
 // A sealed quarantine bulkhead makes the rooftop approach part of the main
 // route. Yara is well before it; its upper crossing uses her existing hook.
 map.platforms.push({id:'s9-quarantine-bulkhead',x:1390,y:300,w:36,h:490,kind:'metal'});
 const route=(id,points,kind)=>{
  for(let i=0;i<points.length;i++){const [x,y,w]=points[i];map.platforms.push({id:id+'-'+i,x,y,w,h:20,kind,oneWay:true,architecture:true});}
 };
 route('s9-aerial',[[220,590,150],[370,490,135],[510,385,130],[660,280,140],[810,175,140],[970,70,150],[1150,-35,150],[980,-140,150],[780,-245,150],[570,-350,180],[360,-245,150],[180,-140,150],[80,-30,140],[190,80,140],[350,185,130],[500,280,130]],'roof');
 route('factory-crane',[[2600,680,160],[2770,570,150],[2940,460,150],[3110,350,160],[3290,240,160],[3470,130,160],[3650,20,180],[3850,-90,160],[4030,-200,160],[3800,-310,190],[3550,-310,180],[3310,-200,170],[3070,-90,180],[2860,20,170],[2660,130,180],[2500,240,140]],'catwalk');
 route('security-archive',[[5590,565,160],[5760,455,150],[5940,345,150],[6100,235,150],[6300,125,180],[6510,15,170],[6720,-95,180],[6940,-205,200],[7180,-315,190],[7410,-205,180],[7630,-95,180],[7830,15,170],[8020,125,160]],'glass');
 route('lab-neural',[[9210,565,160],[9390,455,160],[9570,345,160],[9750,235,160],[9930,125,180],[10140,15,180],[10340,-95,180],[10120,-205,190],[9880,-315,190],[9650,-205,180],[9420,-95,180],[9210,15,180],[9010,125,160]],'catwalk');
 // Final ascent ends before the boss boundary; nothing occludes final attacks.
 route('core-service',[[13070,680,140],[13230,570,140],[13390,460,140],[13550,350,140],[13710,240,150],[13540,130,150],[13370,20,150],[13190,-90,150],[13050,-200,140]],'fleshmetal');
 for(const [x,y]of [[640,90],[1000,-115],[600,-420],[300,-210],[3250,60],[3670,-150],[3970,-360],[2800,-130],[6530,-150],[6960,-370],[7520,-140],[9820,-120],[10200,-370],[9360,-260],[13550,0],[13210,-270]])map.hookPoints.push({x,y,architectural:true});
 for(const [x,y,item]of [[640,-350,'Memória dos moradores 09'],[1220,-35,'Peças da antena comunitária'],[3890,-310,'Projeto da linha de montagem'],[2590,240,'Registro dos turnos perdidos'],[7250,-315,'Auditoria de vigilância'],[9970,-315,'Protocolo de consentimento neural'],[13120,-200,'Mapa da alimentação central']])map.secrets.push({x,y,item});
 for(const [id,x,y,name,text]of [
  ['world-s9-antenna',620,-350,'Antena comunitária','Os moradores desviaram energia para manter os abrigos ativos. A quarentena desligou a última ligação com o exterior.'],
  ['world-factory-crane',3870,-310,'Controle da ponte rolante','Produção ininterrupta. Lotes de implantes seguem da montagem para os laboratórios sem inspeção independente.'],
  ['world-security-audit',7250,-315,'Auditoria de acesso','As câmeras registram os trabalhadores antes e depois de cada atualização neural.'],
  ['world-lab-consent',9970,-315,'Arquivo de pesquisa','As assinaturas de consentimento foram geradas pelo próprio sistema de controle.']
 ])map.terminals.push({id,x,y,name,text});
 // Additional floor-level refuges keep existing checkpoint behavior and saves.
 map.checkpoints.push({x:680,name:'Subestação dos telhados'},{x:3330,name:'Oficina dos turnos'},{x:7050,floor:'tower_floor_1',name:'Arquivo de segurança'},{x:11200,floor:'tower_floor_2',name:'Observação dos laboratórios'},{x:13810,floor:'tower_floor_3',name:'Último abrigo / controle central'});
 map.worldDesign=WORLD_DESIGN;
 // Upper lab walkways must not bypass EMP-controlled security partitions.
 for(const b of map.towerBarriers){b.y=WORLD_TOP;b.h=790-WORLD_TOP;Object.assign(b.solid,{y:b.y,h:b.h});}
}

const palettes={slum:['#15232e','#263a44','#3b5159','#4f8994','#62b9c2'],factory:['#1d242b','#303a3e','#4b5150','#997543','#dbaa5c'],security:['#202e3b','#374955','#677d86','#a9bdc0','#5fbdc7'],lab:['#1c2632','#303947','#586975','#7c8994','#ac626e'],core:['#141e29','#25313e','#3d4d59','#794355','#68a5b2']};
const cache=new Map();
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function moduleCanvas(theme,variant){
 const key=theme+variant;if(cache.has(key))return cache.get(key);
 const tile=document.createElement('canvas');tile.width=256;tile.height=512;const c=tile.getContext('2d'),p=palettes[theme];c.imageSmoothingEnabled=false;
 rect(c,p[0],0,0,256,512);
 for(let y=0;y<512;y+=64){rect(c,p[1],6,y+3,244,58);rect(c,p[2],8,y+4,240,2);for(const x of [12,238])rect(c,'#101923',x,y+10,4,4);}
 if(theme==='slum'){
  for(let y=50;y<510;y+=108){for(let x=22;x<240;x+=74){rect(c,'#0a151e',x,y,48,64);rect(c,p[3],x+4,y+5,40,3);rect(c,(x+y+variant)%3?'#365c67':'#8a6b51',x+7,y+12,34,33);rect(c,p[0],x+22,y+10,4,37);rect(c,p[2],x-4,y+55,57,7);}rect(c,'#0c1821',8,y+76,240,8);}
  rect(c,p[2],188,8,40,31);for(let y=13;y<35;y+=5)rect(c,'#111d27',192,y,32,2);
 }else if(theme==='factory'){
  rect(c,'#101922',32,98,190,270);rect(c,p[2],42,110,170,245);
  for(let y=130;y<340;y+=34){rect(c,'#1d292f',52,y,150,22);rect(c,p[3],58,y+3,11,16);rect(c,'#303c40',78,y+5,112,3);}
  for(const x of [12,226]){rect(c,p[2],x,0,15,512);for(let y=8;y<512;y+=32)rect(c,p[3],x-3,y,21,5);}
  rect(c,'#111a22',54,380,140,80);for(let x=60;x<190;x+=12)rect(c,p[3],x,390,5,48);
  if(variant===1){rect(c,'#17242b',46,102,164,258);for(const x of [64,120,176]){rect(c,'#526064',x,120,19,215);rect(c,'#27383e',x+4,124,8,205);rect(c,p[3],x-4,170,27,8);}rect(c,'#596166',48,310,158,24);}
  if(variant===2){rect(c,'#142129',42,110,170,245);rect(c,'#5e5545',60,134,134,172);rect(c,'#2a2d2d',68,144,118,153);for(let y=157;y<280;y+=18){rect(c,'#8d593c',76,y,102,7);rect(c,'#b07842',80,y+2,94,2);}rect(c,'#67716b',58,316,138,10);}
 }else{
  for(let y=34;y<500;y+=112){rect(c,'#0a1621',24,y,208,82);rect(c,p[2],26,y+2,204,2);rect(c,theme==='lab'?'#293f4b':'#233f4b',32,y+10,192,62);for(let j=0;j<7;j++){rect(c,p[4],40,y+17+j*6,30+(j*23+variant*13)%100,2);rect(c,p[1],185,y+17+j*6,28,2);}rect(c,p[3],32,y+76,192,3);}
  if(theme==='lab'){rect(c,'#111c28',84,45,88,360);rect(c,'#35515a',92,57,72,330);rect(c,'#4f6970',100,65,4,307);rect(c,'#263c48',116,160,30,130);for(let y=66;y<375;y+=42)rect(c,p[4],154,y,4,16);}
 }
 cache.set(key,tile);return tile;
}

// Repeated architecture is cached; only visible modules and a few moving parts draw.
export function drawArchitecture(c,camera,canvas,state,map,time){
 const x=state.player.x,theme=x<2400?'slum':x<5200?'factory':x<8400?'security':x<12600?'lab':'core';
 const p=palettes[theme],left=x<2400?0:x<5200?2400:x<8400?5200:x<12600?8800:13000,right=x<2400?2400:x<5200?5200:x<8400?8400:x<12600?12600:15600;
 const start=left+Math.max(0,Math.floor((camera.x-left)/256)-1)*256,end=Math.min(right,camera.x+canvas.width+256);
 c.save();
 for(let xx=start;xx<end;xx+=256){const variant=Math.abs(Math.floor(xx/256))%3,roof=theme==='slum'?-390+variant*96:-480;
  c.globalAlpha=.72;for(let yy=roof;yy<790;yy+=512)c.drawImage(moduleCanvas(theme,variant),xx,yy);c.globalAlpha=1;
  // Structural pilasters and cable trays connect the stacked modules.
  rect(c,'#0c151e',xx-5,roof,12,790-roof);rect(c,p[2],xx,roof,3,790-roof);
  rect(c,p[1],xx,550,256,20);rect(c,p[3],xx,554,256,3);
  if(theme==='factory'){
   rect(c,'#111c24',xx+40,396,150,96);rect(c,p[2],xx+46,402,138,82);
   c.save();c.translate(xx+115,443);c.rotate(Math.floor(time*5)/12);c.fillStyle='#202c33';for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillRect(-5,-34,10,68)}c.restore();rect(c,p[3],xx+110,438,10,10);
   rect(c,'#5a4936',xx+18,72,222,16);for(let j=0;j<10;j++)rect(c,'#292b2a',xx+24+j*22,74,10,10);
  }
  if(theme==='slum'){
   c.strokeStyle='#080f18';c.lineWidth=3;c.beginPath();c.moveTo(xx,roof+32);c.lineTo(xx+128,roof+72);c.lineTo(xx+256,roof+20);c.stroke();
   rect(c,'#101e29',xx+32,610,95,38);rect(c,Math.floor(time*2+variant)%9===0?'#42606b':p[4],xx+38,616,83,3);
   c.font='10px monospace';c.fillStyle=p[4];c.fillText(['OFICINA 09','HABITAÇÃO','REDE LOCAL'][variant],xx+39,637);
  }
 }
 // Individual landmarks establish orientation between the repeated materials.
 if(theme==='slum'){
  for(const [xx,yy]of [[350,-280],[1080,-90]]){rect(c,'#182932',xx,yy,92,74);rect(c,'#3b5058',xx+4,yy+4,84,12);for(let y=yy+22;y<yy+70;y+=14)rect(c,'#314650',xx+6,y,80,3);for(const dx of [10,76])rect(c,'#263f49',xx+dx,yy+74,6,58);}
  rect(c,'#39535f',625,-620,8,255);for(let yy=-600;yy<-400;yy+=40){rect(c,'#334852',593,yy,72,5);rect(c,'#7d4454',625,yy-6,8,5);}
  for(let xx=Math.max(40,start);xx<end;xx+=320){rect(c,'#263e47',xx,786,130,3);rect(c,'#477b85',xx+20,786,48,1);}
  rect(c,'#182632',1380,280,56,20);for(let yy=315;yy<790;yy+=38){rect(c,'#8c6452',1388,yy,40,5);rect(c,'#763749',1397,yy+8,6,14);}
 }else if(theme==='factory'){
  rect(c,'#4a4940',3100,-405,1150,26);for(let xx=3110;xx<4250;xx+=48)rect(c,'#1f2b30',xx,-400,24,12);
  const trolley=3540+Math.round(Math.sin(time*.15)*130);rect(c,'#75603f',trolley,-378,95,30);rect(c,'#344952',trolley+42,-348,5,185);rect(c,'#8d754a',trolley+15,-163,60,18);
  for(const xx of [2800,4120]){rect(c,'#263a42',xx,540,34,240);rect(c,'#53616a',xx+4,545,7,230);for(let yy=560;yy<780;yy+=40)rect(c,'#8a704c',xx-4,yy,42,8);}
  for(const xx of [2820,4130])for(let i=0;i<5;i++){const rise=(Math.floor(time*16)+i*13)%70;rect(c,'#71858a22',xx-8+i*3,538-rise,10+rise/5,3);}
 }else if(theme==='security'){
  c.fillStyle='#768f99';c.font='22px monospace';c.fillText('A / AURORA DYNAMICS',6610,370);c.font='10px monospace';c.fillStyle='#44858e';c.fillText('SEGURANÇA · IDENTIDADE · CONFORMIDADE',6610,392);
  const scan=580+Math.round(Math.sin(time*.7)*95);for(const xx of [6010,7310]){rect(c,'#334953',xx,475,46,16);rect(c,'#417d8822',xx-90,scan,220,3);}
 }else if(theme==='lab'){
  for(const xx of [9700,11230]){rect(c,'#111f2b',xx,280,158,250);rect(c,'#4b626e',xx+4,284,150,10);rect(c,'#27414a',xx+16,304,126,194);rect(c,'#557b80',xx+22,314,5,170);rect(c,'#172e39',xx+62,345,42,118);rect(c,'#7c465b',xx+68,363,28,70);rect(c,'#536975',xx+4,510,150,16);}
 }
 // Supports sit behind gameplay; no foreground overlays cover actors or telegraphs.
 for(const s of map.platforms){if(s.h>30||s.disabled||s.x+s.w<camera.x||s.x>camera.x+canvas.width||s.y<camera.y-40||s.y>camera.y+canvas.height)continue;
  rect(c,p[1],s.x+10,s.y+20,6,Math.min(160,790-s.y-20));rect(c,p[2],s.x+s.w-18,s.y+20,6,Math.min(160,790-s.y-20));
  c.strokeStyle=p[1];c.lineWidth=4;c.beginPath();c.moveTo(s.x+12,s.y+60);c.lineTo(s.x+s.w-15,s.y+22);c.stroke();
 }
 for(const h of map.hookPoints){if(h.x<camera.x-40||h.x>camera.x+canvas.width+40)continue;rect(c,p[2],h.x-2,h.y-68,4,58);rect(c,p[3],h.x-22,h.y-72,44,6);}
 const label=DISTRICTS.find(a=>x>=a.left&&x<a.right);if(label){c.fillStyle=p[4];c.font='13px monospace';c.fillText(label.name,Math.max(label.left+50,start+36),502);}
 c.restore();
}

export function drawAtmosphere(c,w,h,camera,state,time){
 if(state.player.x<2400)return;
 const factory=state.player.x<5200;c.save();
 // Fixed particle budget, pixel snapped and only in the architectural margins.
 for(let i=0;i<14;i++){const x=Math.round((i*151-camera.x*.22+w*20)%w),y=Math.round(h-20-((time*(factory?17:9)+i*49)%(h*.8)));rect(c,factory?'#8f9b9c33':'#529ba833',x,y,factory?4:12,2);}
 c.restore();
}

export function drawArenaArchitecture(c,state,time){
 const sector=state.player.x<2400,factory=state.player.x>=2400&&state.player.x<5200;if(!sector&&!factory)return;
 const left=sector?1510:4490,right=sector?2360:5160,ink=sector?'#53727d':'#8c7754';
 c.save();
 for(const x of [left+16,right-42]){
  rect(c,'#0c1721',x,340,26,450);rect(c,'#344550',x+4,345,18,440);
  for(let yy=356;yy<775;yy+=42){rect(c,ink,x+2,yy,22,4);rect(c,'#182a35',x+8,yy+10,10,22);}
 }
 rect(c,'#263843',left+16,336,right-left-32,18);rect(c,ink,left+19,338,right-left-38,2);
 for(let x=left+65;x<right-55;x+=144){
  rect(c,'#0c1823',x,470,92,195);rect(c,'#30424c',x+5,475,82,185);
  rect(c,'#172b36',x+12,491,68,90);rect(c,'#365b66',x+16,499,60,3);
  for(let yy=511;yy<570;yy+=12)rect(c,'#304650',x+19,yy,45-((yy/12)%3)*6,2);
  rect(c,'#0e202c',x+15,595,62,50);for(let yy=603;yy<640;yy+=8)rect(c,'#41515a',x+21,yy,50,2);
  rect(c,Math.floor(time+x)%6===0?'#bd5e65':'#74434e',x+36,481,16,3);
 }
 c.fillStyle=ink;c.font='12px monospace';c.textAlign='center';c.fillText(sector?'CONTENÇÃO AUTOMATIZADA / MATRONA-7':'CONTENÇÃO INDUSTRIAL / WARDEN',(left+right)/2,388);
 c.font='9px monospace';c.fillStyle='#526a77';c.fillText('AURORA DYNAMICS · OPERAÇÃO RESTRITA',(left+right)/2,405);
 c.restore();
}
