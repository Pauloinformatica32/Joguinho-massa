import{TOWER_ARENA,TOWER_FLOORS}from'./tower-layout.js';

export const CENTRAL_TERMINAL_ID='tower-central-shutdown';
export const CORE_VISUAL=Object.freeze({x:(TOWER_ARENA.left+TOWER_ARENA.right)/2,y:510,width:760,top:350,bottom:706});
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function centralComputerState(state,map){
 const boss=state.bosses.find(b=>b.id==='boss-3'),terminal=map.terminals.find(t=>t.id===CENTRAL_TERMINAL_ID);
 const off=state.events.includes(CENTRAL_TERMINAL_ID),progress=off?1:clamp(map.coreShutdownProgress||0,0,1);
 const mode=off?'off':progress>0?'shutdown':boss?.dead?'critical':boss?.active?(boss.phase===2?'phase2':'phase1'):'standby';
 const ready=!!(boss?.dead&&boss.deathComplete)&&!off;
 const near=!!terminal&&Math.hypot(state.player.x+state.player.w/2-terminal.x,state.player.y+state.player.h-terminal.y)<105;
 return{mode,progress,power:1-progress,ready,near,terminal,emp:!!state.abilities.emp};
}
function bolt(c,x,y){rect(c,'#080e15',x,y,6,6);rect(c,'#71818b',x+1,y+1,3,3)}
function cable(c,x,y,w,h,power,lit=false){rect(c,'#06090f',x-4,y,w+8,h);rect(c,'#242b35',x,y,w,h);if(power>0){rect(c,power<.3?'#282c36':lit&&power>.6?'#9e3048':'#4d2434',x+3,y,Math.max(2,w-6),h);if(lit&&power>.65)rect(c,'#d04b5e',x+5,y,2,h)}for(let yy=y+12;yy<y+h;yy+=24)rect(c,'#0a1019',x-2,yy,w+4,4)}
function rack(c,x,y,s,time,mirror){
 rect(c,'#070b12',x-6,y-8,126,266);rect(c,'#35434d',x,y,114,250);rect(c,'#0a111a',x+5,y+5,104,240);
 for(let i=0;i<10;i++){const yy=y+10+i*23;rect(c,'#25313c',x+10,yy,94,18);rect(c,'#111b25',x+14,yy+3,72,10);for(let j=0;j<5;j++)rect(c,'#40505a',x+17+j*12,yy+6,6,2);if(s.power>0){const activity=(Math.floor(time*3)+i+(mirror?2:0))%4;rect(c,activity===0?'#7c3b4c':'#376e79',x+93,yy+5,4,4)}rect(c,'#65727a',x+10,yy+2,2,12)}
 bolt(c,x,y);bolt(c,x+108,y+244);
}
function monitor(c,x,y,s,time,index){
 rect(c,'#050910',x-5,y-5,120,88);rect(c,'#5b737d',x-2,y-2,114,80);rect(c,'#0b1921',x+2,y+2,106,72);
 if(s.power<=0){rect(c,'#050b11',x+2,y+2,106,72);return}
 const corrupt=s.mode==='phase2'&&index===1,critical=s.mode==='critical',ink=s.power<.4?'#39545c':corrupt||critical?'#ca7381':s.mode==='standby'?'#529197':'#6bc1c8';
 rect(c,s.progress>.5?'#142329':'#17363e',x+5,y+6,100,12);c.fillStyle=ink;c.font='8px monospace';c.textAlign='left';c.fillText(critical?'REDE CRÍTICA':corrupt?'NÓ CORROMPIDO':s.mode==='standby'?'NEXUS / ESPERA':index===1?'ACESSO HOSTIL':'AURORA / NEXUS',x+8,y+15);
 for(let i=0;i<6;i++){const width=18+((i*17+Math.floor(time*(critical?9:4))+index*9)%62);rect(c,'#21434b',x+8,y+25+i*6,88,2);rect(c,ink,x+8,y+25+i*6,Math.round(width*s.power),2)}
 c.fillStyle=ink;c.fillText(critical?'APLIQUE EMP':s.mode==='shutdown'?'DESCONECTANDO':s.mode==='standby'?'SINAL EM ESPERA':'TRÁFEGO ATIVO',x+8,y+68);
}
/** Opaque architecture + rear computer. Called before all gameplay geometry. */
export function drawCentralComputer(c,state,map,time){
 const s=centralComputerState(state,map),f=TOWER_FLOORS[2],a=TOWER_ARENA,cx=CORE_VISUAL.x;
 c.save();c.imageSmoothingEnabled=false;
 rect(c,'#090f17',f.left,-1600,f.right-f.left,2390);
 // Rear wall: large recesses, support columns and a real ceiling girder.
 for(let x=f.left+40;x<f.right;x+=220){rect(c,'#111c27',x,190,180,520);rect(c,'#0b141f',x+12,208,156,468);rect(c,'#22313d',x-14,230,12,490);rect(c,'#34434c',x-12,240,2,410);for(let y=250;y<650;y+=88){rect(c,'#192631',x+24,y,134,5);rect(c,'#2d3c47',x+26,y,18,2)}}
 rect(c,'#040911',f.left,302,f.right-f.left,42);rect(c,'#39434d',f.left,308,f.right-f.left,5);rect(c,'#18232f',f.left,326,f.right-f.left,12);
 for(let x=f.left+60;x<f.right;x+=96){bolt(c,x,314);rect(c,'#171c27',x,338,44,14)}
 // Keep the character/telegraph band dark and quiet.
 rect(c,'#0c1520',f.left,700,f.right-f.left,90);rect(c,'#293741',f.left,766,f.right-f.left,3);
 for(let x=f.left+40;x<f.right;x+=160){rect(c,'#1d2b35',x,720,66,3);rect(c,'#17232e',x+12,732,54,2)}
 // Low-contrast backup racks flank the mainframe.
 for(const x of [a.left+60,a.right-155]){rect(c,'#111d28',x,403,102,291);for(let i=0;i<11;i++){rect(c,'#25323b',x+8,415+i*23,86,17);rect(c,'#0b151e',x+13,419+i*23,72,7)}}
 // Chassis: graphite armor, silver corporate insets and black compute bays.
 const left=cx-380;
 rect(c,'#03070d',left-18,366,796,340);rect(c,'#293743',left-10,350,780,344);rect(c,'#7a8589',left,356,760,10);rect(c,'#3b4a55',left,367,760,18);rect(c,'#101a25',left+10,386,740,298);
 for(const x of [left,left+744]){rect(c,'#53616a',x,385,16,310);rect(c,'#1c2935',x+4,389,7,298);bolt(c,x+5,402);bolt(c,x+5,667)}
 rect(c,'#253541',cx-200,391,400,281);rect(c,'#050b12',cx-187,403,374,255);
 // Heavy red power trunks are routed down from ceiling sockets.
 const fast=s.mode==='phase2'||s.mode==='critical';
 for(let i=0;i<6;i++){const x=cx-170+i*64,lit=s.power>0&&(fast?(Math.floor(time*5)+i)%3!==0:i%2===0);rect(c,'#52616b',x-7,338,34,14);cable(c,x,350,20,70+(i%2)*19,s.power,lit);rect(c,'#6c7680',x-3,414+(i%2)*19,26,6)}
 rack(c,left+24,424,s,time,false);rack(c,left+620,424,s,time,true);
 monitor(c,cx-242,453,s,time,0);monitor(c,cx+132,453,s,time,1);
 // The core is a rectangular processor backplane, not a reactor/tank.
 const pulse=Math.floor((Math.sin(time*(s.mode==='critical'?7:s.mode==='phase2'?5:s.mode==='standby'?.8:1.5))*.5+.5)*3),level=s.power<=0?0:clamp(Math.ceil(s.power*(pulse+1)),1,4);
 const reds=['#1a242d','#4e202f','#712638','#993348','#c14658'];
 rect(c,'#56616b',cx-126,417,252,204);rect(c,'#0b101a',cx-118,425,236,188);rect(c,'#2e1c2b',cx-108,435,216,168);rect(c,reds[level],cx-99,444,198,150);
 for(let row=0;row<6;row++)for(let col=0;col<8;col++){const x=cx-91+col*23,y=451+row*22;rect(c,'#0a0f18',x,y,18,17);rect(c,s.power>0?reds[Math.max(0,level-((row+col+pulse)%3===0?0:1))]:'#23313a',x+3,y+3,12,10);if(s.power>.5&&(row+col+Math.floor(time*3))%7===0)rect(c,'#e17c83',x+7,y+6,3,3)}
 rect(c,'#08111a',cx-74,493,148,39);c.font='11px monospace';c.textAlign='center';c.fillStyle=s.power>0?'#de8e97':'#53626d';c.fillText('AURORA DYNAMICS',cx,509);c.font='8px monospace';c.fillText(s.power>0?'CENTRAL NEURAL / ROOT-01':'TRANSMISSÃO ENCERRADA',cx,523);
 for(const x of [cx-123,cx+113])for(const y of [420,608])bolt(c,x,y);
 // Cooling plenum and supports, with crisp warning stripes and vents.
 rect(c,'#34434e',left+20,683,720,24);rect(c,'#111c27',left+24,688,712,14);
 for(let x=left+32;x<left+726;x+=18)rect(c,'#53606a',x,691,9,3);
 for(const x of [cx-287,cx+253]){rect(c,'#202d38',x,704,34,44);rect(c,'#35444d',x+5,704,6,40);rect(c,'#121c26',x-6,744,46,8)}
 for(const x of [cx-323,cx+285]){rect(c,'#313f48',x,633,38,40);for(let y=640;y<669;y+=6)rect(c,'#09111b',x+4,y,30,3);rect(c,'#b6a16b',x+2,630,10,3)}
 // Monitor-to-core buses and the existing console's dedicated cable.
 for(const sign of [-1,1]){rect(c,'#34414a',cx+sign*115-(sign<0?17:0),547,17,6);rect(c,'#3b6970',cx+sign*118,548,2,25)}
 const terminal=s.terminal;if(terminal){const end=terminal.x;rect(c,'#040a11',cx+250,675,end-cx-250+10,12);rect(c,s.power>0?'#59303e':'#233640',cx+254,679,end-cx-254+6,3);rect(c,'#101e2a',end-5,679,12,60);rect(c,s.ready?'#58abb0':'#563344',end,681,2,58);for(let x=cx+278;x<end;x+=64)rect(c,'#44515b',x,675,4,12)}
 // Short stepped electrical arcs, confined to the backplane.
 if(s.power>0&&(s.mode==='phase2'||s.mode==='critical')&&Math.floor(time*9)%4===0){const sign=Math.floor(time*3)%2?1:-1;for(let i=0;i<5;i++){const x=cx+sign*(101+i*5),y=461+i*18;rect(c,'#b97c94',x,y,2,12);rect(c,'#b97c94',Math.min(x,x+sign*7),y+10,8,2)}}
 c.font='10px monospace';c.textAlign='center';c.fillStyle=s.mode==='critical'?'#e28d9b':s.mode==='off'?'#6a8189':'#8b9da4';
 c.fillText(s.mode==='critical'?'REDE AINDA ATIVA — DESLIGAMENTO MANUAL NECESSÁRIO':s.mode==='off'?'REDE DESCONECTADA — CONTROLE CENTRAL DESATIVADO':s.mode==='phase2'?'ALERTA: CONTROLE CENTRAL CORROMPIDO':'AURORA DYNAMICS · MAINFRAME CENTRAL',cx,655);
 if(s.ready){c.textAlign='right';c.fillStyle='#87c7c9';c.fillText('CONSOLE EMP →',a.right-24,740)}
 c.restore();
}
/** Foreground replacement for the existing generic terminal, never a second entity. */
export function drawCentralConsole(c,state,map,time){
 const s=centralComputerState(state,map),t=s.terminal;if(!t)return;
 const x=t.x,y=t.y,off=s.mode==='off',ready=s.ready;
 c.save();c.imageSmoothingEnabled=false;
 rect(c,'#060c14',x-48,y-5,96,5);rect(c,'#34434e',x-31,y-46,62,41);rect(c,'#78858b',x-31,y-45,6,39);rect(c,'#121e2a',x-21,y-37,42,25);rect(c,'#3e5965',x-4,y-34,8,20);
 rect(c,'#141f2b',x-48,y-94,96,51);rect(c,'#869296',x-46,y-92,92,4);rect(c,'#536774',x-46,y-87,92,38);rect(c,'#07121c',x-40,y-83,80,29);
 rect(c,off?'#101a23':'#173d47',x-37,y-80,74,22);c.font='8px monospace';c.textAlign='center';c.fillStyle=off?'#667c86':ready?'#9be3df':'#d196a2';c.fillText(off?'REDE OFFLINE':ready?'EMP / PRONTO':'TRAVA VÉSPERA',x,y-65);
 rect(c,'#080f18',x-49,y-47,98,9);for(let i=0;i<7;i++)rect(c,'#778a91',x-30+i*9,y-45,5,2);
 rect(c,off?'#2e4e55':ready?'#77e5d8':'#d54760',x-39,y-39,6,5);rect(c,off?'#1f303c':'#56a7ba',x+33,y-39,6,5);
 for(const sign of [-1,1]){rect(c,'#161f2c',x+sign*42-3,y-35,6,26);rect(c,'#b4a16b',x+sign*42-2,y-33,4,4)}
 if(s.near){
  if(ready){rect(c,'#65c5c1',x-58,y-2,116,2);rect(c,'#08131b',x-134,y-130,268,28);rect(c,'#76c9c6',x-134,y-130,268,2);rect(c,'#76c9c6',x-134,y-104,268,2);c.fillStyle='#e0fff2'}else c.fillStyle=off?'#8ba8af':'#cd8c9b';
  c.font=ready?'bold 11px monospace':'11px monospace';c.fillText(off?'REDE DESCONECTADA':ready?(s.emp?'[E] DESATIVAR NÚCLEO CENTRAL':'[E] EMP NECESSÁRIO'):'ACESSO BLOQUEADO · VÉSPERA',x,y-112);
 }else{c.fillStyle='#718c96';c.font='9px monospace';c.fillText('CONTROLE CENTRAL / EMP',x,y-107)}
 c.restore();
}
