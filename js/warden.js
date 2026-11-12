import {hurt,intersects} from './combat.js';
import {GROUND} from './map.js';
import {moveBody} from './physics.js';

export const WARDEN_PHASE2_SELECTION=Object.freeze({slam:45,discharge:35,charge:20,chargeCooldown:10});
export function wardenAttackState(){return {chargeCooldown:0,chargeHasOccurred:false,nonChargeSinceCharge:[],recentAttacks:[]};}
// Selection history belongs to combat logic, independent of sprite/state playback.
export function selectWardenPhase2Attack(b,random=Math.random){
 const chargeEligible=b.chargeCooldown<=0&&(!b.chargeHasOccurred||
  (b.nonChargeSinceCharge.includes('slam')&&b.nonChargeSinceCharge.includes('discharge')))&&b.recentAttacks.at(-1)!=='charge';
 const eligible=chargeEligible?['slam','discharge','charge']:['slam','discharge'];
 let roll=random()*eligible.reduce((sum,key)=>sum+WARDEN_PHASE2_SELECTION[key],0);
 const selected=eligible.find(key=>(roll-=WARDEN_PHASE2_SELECTION[key])<0)||eligible.at(-1);
 if(selected==='charge'){b.chargeHasOccurred=true;b.nonChargeSinceCharge=[];}
 else if(!b.nonChargeSinceCharge.includes(selected))b.nonChargeSinceCharge.push(selected);
 b.recentAttacks=[...b.recentAttacks,selected].slice(-3);
 return selected;
}

export const WARDEN_COMBAT=Object.freeze({waveRange1:620,waveRange2:670,waveWidth1:64,waveHeight1:100,waveSpeed1:560,waveWidth2:96,waveHeight2:180,waveSpeed2:660,laserWarning:1.15,laserAbove:4,laserBelow:46,laserActive:.18,laserRecovery:1.1,chargeSpeed:590,chargeAcceleration:1200,blastRadius:115,blastWarning:.2,blastActive:.25,blastRecovery:1.4});
// The warning, active beam, and F3 outline share this exact horizontal band.
export function beamHits(p,q){return intersects(p,q);}
function prepareLaser(b,config){
 const a=wardenCore(b,config),z={x:b.facing>0?b.arena.right:b.arena.left,y:a.y};
 const x=Math.min(a.x,z.x),y=a.y-WARDEN_COMBAT.laserAbove,w=Math.abs(z.x-a.x),h=WARDEN_COMBAT.laserAbove+WARDEN_COMBAT.laserBelow;
 b.laser={x,y,w,h,a,z,hit:false,source:'warden_core_laser',points:[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]};
}
export function resetWarden(b){Object.assign(b,wardenAttackState(),{laserFade:null,laser:null,blast:null,impact:null,phase:1,transformed:false,wardenState:'idle',stateTime:0,timer:.9,warning:0,attackType:'recovery',waves:[],offense:[],projectiles:[],attackSerial:0,hitCooldown:0,vx:0,vy:0,walkTime:0});}
export function clearWarden(b){Object.assign(b,wardenAttackState());b.laserFade=null;b.laser=null;b.blast=null;b.impact=null;b.waves=[];b.offense=[];b.projectiles=[];b.warning=0;b.vx=0;b.wardenState='death';b.stateTime=0;}
function enter(b,state,time){b.wardenState=state;b.stateTime=0;b.timer=time;b.warning=0;b.offense=[];b.vx=0;b.attackType=['windup','transition'].includes(state)?'windup':'recovery';}
export function transitionWarden(b){if(b.transformed||b.health<=0)return; Object.assign(b,wardenAttackState());b.laser=null;b.blast=null;b.transformed=true;b.waves=[];b.projectiles=[];enter(b,'transition',1.65);}
export function wardenHurtbox(b){return {x:b.x+5,y:b.y+5,w:b.w-10,h:b.h-5};}
// Use the same rounded destination rectangle and native-facing mirror as SpriteRenderer.
export function wardenSpritePoint(b,point,config){
 const key=wardenAnimation(b),a=config?.animations?.[key],red=b.phase===2;
 const scale=a?.scale??(red?.47:1.1),fw=a?.frameWidth??(red?256:128),fh=a?.frameHeight??fw;
 const origin=a?.origin??{x:red?128:64,y:red?251:116},visual=config?.visual||{};
 const dw=Math.round(fw*scale),dh=Math.round(fh*scale);
 const dx=Math.round(b.x+b.w/2+b.facing*(red?19.74:17.6)-origin.x*scale+((visual.offsetX||0)+(a?.offsetX||0))*scale);
 const dy=Math.round(b.y+b.h-origin.y*scale+((visual.offsetY||0)+(a?.offsetY||0))*scale);
 const px=point.x*dw/fw,py=point.y*dh/fh,mirror=b.facing*(a?.nativeFacing??config?.nativeFacing??-1)<0;
 let result={x:dx+(mirror?dw-px:px),y:dy+py};
 if(b.pattern==='charge'&&['windup','charge'].includes(b.wardenState)){const angle=b.facing*(b.wardenState==='charge'?.12:Math.min(.1,b.stateTime*.12)),cx=b.x+b.w/2,feet=b.y+b.h,x=result.x-cx,y=result.y-feet;result={x:cx+x*Math.cos(angle)-y*Math.sin(angle),y:feet+x*Math.sin(angle)+y*Math.cos(angle)};}
 if(b.wardenState==='transition'&&b.stateTime<.85)result.x+=Math.sin(b.stateTime*100)*3;
 return result;
}
export function wardenCore(b,config){
 const key=wardenAnimation(b),frame=wardenFrame(b);
 const defaults=b.phase===2?(key.endsWith('slam')?[{x:145,y:65},{x:151,y:60},{x:148,y:64},{x:131,y:96},{x:131,y:96},{x:133,y:94}][frame]:{x:145,y:65}):{x:69,y:38};
 return wardenSpritePoint(b,config?.animations?.[key]?.corePoints?.[frame]??defaults,config);
}
export function wardenHammerImpact(b,config){
 const a=config?.animations?.[wardenAnimation(b)];
 return wardenSpritePoint(b,a?.hammerImpact??(b.phase===2?{x:40,y:251}:{x:24,y:116}),config);
}
function front(b,reach,height,source){return {x:b.facing>0?b.x+b.w:b.x-reach,y:GROUND-height,w:reach,h:height,source,hit:false};}
function clip(b,box,platforms){let left=Math.max(box.x,b.arena.left),right=Math.min(box.x+box.w,b.arena.right);for(const s of platforms){if(s.disabled||s.h<70||s.y>=GROUND||s.y+s.h<=box.y)continue;if(b.facing>0&&s.x>=b.x+b.w)right=Math.min(right,s.x);if(b.facing<0&&s.x+s.w<=b.x)left=Math.max(left,s.x+s.w);}return {...box,x:left,w:Math.max(0,right-left)};}
function strike(b,p,box,damage){if(!box.hit&&intersects(p,box)&&hurt(p,damage,b.x+b.w/2,{source:box.source,entity:b.id,x:box.x,y:box.y}))box.hit=true;}
export function wardenAnimation(b){const phase=b.phase===2?2:1;return `phase${phase}_${b.pattern==='slam'&&['windup','slam','recovery'].includes(b.wardenState)?'slam':['approach','reposition'].includes(b.wardenState)&&b.moving?'walk':'idle'}`;}
export function wardenFrame(b){if(wardenAnimation(b).endsWith('walk'))return Math.floor(b.walkTime*8)%8;if(!wardenAnimation(b).endsWith('slam'))return 0;if(b.wardenState==='windup')return Math.min(2,Math.floor(b.stateTime*3));if(b.wardenState==='slam')return b.stateTime>.3?5:b.phase===2?4:3;return 5;}
export function updateWarden(b,p,dt,{config,random=Math.random,platforms=[{x:b.arena.left,y:GROUND,w:b.arena.right-b.arena.left,h:110}]}={}){
 if(!b.wardenState){const health=b.health;resetWarden(b);b.health=health;}
 if(b.dead||b.health<=0){clearWarden(b);return;}
 if(p.dead){b.laser=null;b.blast=null;b.offense=[];b.waves=[];b.vx=0;return;}
 if(b.health<=b.maxHealth*.5&&!b.transformed)transitionWarden(b);
 b.chargeCooldown=Math.max(0,(b.chargeCooldown||0)-dt);b.hitCooldown=Math.max(0,b.hitCooldown-dt);b.stateTime+=dt;b.timer-=dt;b.moving=false;
 const state=b.wardenState,red=b.phase===2;
 if(state==='transition'){if(b.stateTime>=.85)b.phase=2;if(b.timer<=0)enter(b,'reposition',.75);return;}
 for(const q of b.waves){const old=q.x;q.x+=Math.sign(q.vx)*Math.min(Math.abs(q.vx*dt),q.range-q.distance);q.distance+=Math.abs(q.x-old);if(q.x<b.arena.left||q.x+q.w>b.arena.right||platforms.some(s=>!s.disabled&&s.h>=70&&s.y<GROUND&&intersects(q,s)))q.life=0;else strike(b,p,q,16);if(q.distance>=q.range)q.life=0;}
 if(b.waves.some(q=>q.hit)){for(const q of b.waves)q.hit=true;for(const box of b.offense)if(box.source==='warden_hammer')box.hit=true;}
 b.waves=b.waves.filter(q=>q.life>0);
 if(['idle','approach','reposition'].includes(state)){
  b.facing=p.x+p.w/2>b.x+b.w/2?1:-1;
  const distance=Math.abs(p.x+p.w/2-b.x-b.w/2),step=distance>165?b.facing:distance<105?-b.facing:0;
  const old=b.x;b.vx=step*38;moveBody(b,dt,platforms);b.x=Math.max(b.arena.left+12,Math.min(b.arena.right-b.w-12,b.x));b.moving=Math.abs(b.x-old)>.01;if(b.moving)b.walkTime+=dt;b.wardenState=step===b.facing?'approach':'reposition';
  if(b.timer<=0){b.attackSerial++;b.pattern=red?selectWardenPhase2Attack(b,random):(distance>285?'charge':['slam','discharge','charge'][(b.attackSerial-1)%3]);enter(b,'windup',b.pattern==='slam'?.95:b.pattern==='charge'?.85:red?WARDEN_COMBAT.laserWarning:1);}
 }else if(state==='windup'){
  b.warning=Math.max(0,b.timer);if(red&&b.pattern==='discharge'&&!b.laser)prepareLaser(b,config);
  if(b.timer<=0){if(b.pattern==='charge'){enter(b,'charge',.68);b.chargeHit=false;b.chargeSpeed=180;}
   if(b.pattern==='slam'){enter(b,'slam',red?1.6:1.25);const box=clip(b,front(b,red?85:65,red?45:34,'warden_hammer'),platforms);b.offense=[box];const point=wardenHammerImpact(b,config).x;b.impact={x:point,time:0};const width=red?WARDEN_COMBAT.waveWidth2:WARDEN_COMBAT.waveWidth1,height=red?WARDEN_COMBAT.waveHeight2:WARDEN_COMBAT.waveHeight1;for(const direction of [-1,1])b.waves.push({x:point-width/2,y:(b.arena.floor??GROUND)-height,w:width,h:height,vx:direction*(red?WARDEN_COMBAT.waveSpeed2:WARDEN_COMBAT.waveSpeed1),range:red?WARDEN_COMBAT.waveRange2:WARDEN_COMBAT.waveRange1,distance:0,life:1,source:'warden_shockwave',hit:false});b.shake=red?9:5;}
   if(b.pattern==='discharge'&&red){enter(b,'laser',WARDEN_COMBAT.laserActive);b.shake=5;}else if(b.pattern==='discharge'){enter(b,'discharge',.28);b.offense=[clip(b,front(b,red?245:165,red?98:65,'warden_discharge'),platforms)];}
  }
 }else if(state==='charge'){
  const old=b.x;b.chargeSpeed=Math.min(WARDEN_COMBAT.chargeSpeed,(b.chargeSpeed||180)+WARDEN_COMBAT.chargeAcceleration*dt);b.vx=b.facing*(red?b.chargeSpeed:455);const intended=b.vx*dt;moveBody(b,dt,platforms);b.x=Math.max(b.arena.left+(red?0:12),Math.min(b.arena.right-b.w-(red?0:12),b.x));
  const box={x:Math.min(old,b.x)-(red?7:0),y:GROUND-(red?65:55),w:b.w+Math.abs(b.x-old)+(red?14:0),h:red?65:55,source:'warden_charge',hit:b.chargeHit};strike(b,p,box,18);b.chargeHit=box.hit;b.offense=[box];
  const wall=Math.abs(b.x-old)<Math.abs(intended)-.001||b.vx===0;if(wall&&red){enter(b,'blast_warning',WARDEN_COMBAT.blastWarning);b.blast={x:b.x+b.w/2,y:GROUND-28,radius:WARDEN_COMBAT.blastRadius,hit:false,source:'warden_collision_blast'};b.shake=9;}else if(wall||(!red&&b.timer<=0))enter(b,'recovery',wall?1.35:.9);
 }else if(state==='laser'){
 const q=b.laser;if(b.timer>0&&q&&!q.hit&&beamHits(p,q)&&hurt(p,22,b.x,{source:q.source,entity:b.id,x:q.a.x,y:q.a.y}))q.hit=true;
 if(b.timer<=0){b.laserFade={...b.laser,time:.14};b.laser=null;enter(b,'recovery',WARDEN_COMBAT.laserRecovery);}
 }else if(state==='blast_warning'){if(b.timer<=0)enter(b,'blast',WARDEN_COMBAT.blastActive);
 }else if(state==='blast'){const q=b.blast,px=Math.max(p.x,Math.min(q.x,p.x+p.w)),py=Math.max(p.y,Math.min(q.y,p.y+p.h));if(!q.hit&&Math.hypot(px-q.x,py-q.y)<q.radius&&hurt(p,24,q.x,{source:q.source,entity:b.id,x:q.x,y:q.y}))q.hit=true;if(b.timer<=0){b.blast=null;b.chargeCooldown=WARDEN_PHASE2_SELECTION.chargeCooldown;enter(b,'recovery',WARDEN_COMBAT.blastRecovery);}
 }else if(state==='slam'||state==='discharge'){
  if(state==='slam'&&b.stateTime>.16)b.offense=[];
  for(const box of b.offense)strike(b,p,box,state==='slam'?23:17);
  if(state==='slam'&&b.offense.some(q=>q.hit))for(const q of b.waves)q.hit=true;
  if(b.timer<=0&&(state!=='slam'||!b.waves.length))enter(b,'recovery',state==='slam'?.85:.9);
 }else if(state==='recovery'&&b.timer<=0)enter(b,'reposition',.7);
 // Waves expire before recovery ends, leaving a clean counterattack window.
 if(b.laserFade){b.laserFade.time-=dt;if(b.laserFade.time<=0)b.laserFade=null;}
 if(b.impact){b.impact.time+=dt;if(b.impact.time>.6)b.impact=null;}
 b.shake=Math.max(0,(b.shake||0)-dt*25);
}

export function renderWarden(c,b,camera,renderer){
 const t=b.stateTime||0,state=b.wardenState,red=b.phase===2,color=red?'#ff394d':'#ffba45',cx=b.x+b.w/2,feet=b.y+b.h;
 c.save();c.translate(-camera.x,-camera.y);
 const collapse=b.dead?Math.max(0,1-(b.deathTimer||0)/.9):0;
 c.globalAlpha=1-collapse;c.save();
 if(b.dead){c.translate(cx,feet);c.rotate(-b.facing*collapse*.65);c.translate(-cx,-feet);}
 if(b.pattern==='charge'&&['windup','charge'].includes(state)){c.translate(cx,feet);c.rotate(b.facing*(state==='charge'?.12:Math.min(.1,t*.12)));c.translate(-cx,-feet);}
 if(state==='transition'&&t<.85)c.translate(Math.sin(t*100)*3,0);
 // Each sheet is centered on its frame; compensate for the native body's
 // position inside the transparent margin, with the same mirror convention.
 renderer?.draw(c,'warden',wardenAnimation(b),b,0,{x:cx+b.facing*(red?19.74:17.6),y:feet,facing:b.facing,frameOverride:wardenFrame(b)});c.restore();c.globalAlpha=1;
 const core=red?wardenCore(b,renderer?.assets?.getConfig('warden')):{x:cx-b.facing*26,y:feet-65};
 if(red&&!b.dead){c.fillStyle=`rgba(255,35,60,${(state==='windup'?.2:.08)+Math.sin(t*8)*.035})`;c.beginPath();c.arc(core.x,core.y,state==='windup'?13:8,0,Math.PI*2);c.fill();}
 // A solid energy wall fills the moving collision bounds; stepped crests and
 // bright vertical ribs make its height readable without blur.
 for(const q of b.waves||[]){
  const x=Math.round(q.x),y=q.y;
  c.fillStyle=red?'#9e163c':'#b86819';c.fillRect(x,y,q.w,q.h);
  c.fillStyle=red?'#ff294f':'#ffbb42';c.fillRect(x+3,y+3,q.w-6,q.h-3);
  c.fillStyle=red?'#ff9fa9':'#fff0ae';
  for(let i=0;i<4;i++){const h=q.h-6-(i%2)*8;c.fillRect(x+4+i*(q.w-8)/4,GROUND-h,3,h);}
  c.strokeStyle='#fff3d4';c.lineWidth=2;c.strokeRect(x+1,y+1,q.w-2,q.h-2);
  const leading=q.vx>0?x+q.w-7:x+3;
  c.fillStyle=red?'#ffd0d8':'#fff3c8';c.fillRect(leading,y+4,4,q.h-8);
  for(let i=0;i<7;i++){const fy=y+8+(i*23+q.distance*.3)%(q.h-16);c.fillStyle=red?'#ffb5c2':'#ffe0a1';c.fillRect(x+8+(i*13)%(q.w-20),fy,7,4);}
  c.strokeStyle=red?'#5b082b':'#874516';c.lineWidth=3;c.beginPath();c.moveTo(x+q.w*.45,y+4);c.lineTo(x+q.w*.65,y+q.h*.3);c.lineTo(x+q.w*.3,y+q.h*.6);c.lineTo(x+q.w*.5,y+q.h-3);c.stroke();
  for(let i=1;i<5;i++){c.fillStyle=red?'#ff294f88':'#ffbb4266';c.fillRect(x-Math.sign(q.vx)*i*7,GROUND-3-i*3,4,3);}
 }
 if(state==='windup'){
  const reach=b.pattern==='discharge'?(red?245:165):b.pattern==='slam'?(red?85:65):140;
  if(!(red&&b.pattern==='discharge')){c.fillStyle=(b.pattern==='discharge'?'#55cfff':color)+'35';c.fillRect(b.facing>0?b.x+b.w:b.x-reach,GROUND-8,reach,8);}
  c.font='11px monospace';c.textAlign='center';c.fillStyle='#fff1ce';c.fillText({charge:'INVESTIDA · PULE / DASH',slam:'IMPACTO · AFASTE-SE',discharge:'DESCARGA · RECUAR / FLANQUEAR'}[b.pattern],cx,b.y-18);
  if(b.pattern==='discharge'){c.strokeStyle=red?'#ff5264':'#65dfff';c.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3+t*9,r=8+Math.sin(t*22+i)*3;c.beginPath();c.moveTo(core.x+Math.cos(a)*4,core.y+Math.sin(a)*4);c.lineTo(core.x+Math.cos(a)*r,core.y+Math.sin(a)*r);c.stroke();}}
 }
 if(state==='discharge'){for(const q of b.offense){c.fillStyle=(red?'#ff394d':'#55cfff')+'38';c.fillRect(q.x,q.y,q.w,q.h);c.strokeStyle=red?'#ff6a78':'#9feaff';c.lineWidth=2;for(let j=0;j<5;j++){c.beginPath();for(let i=0;i<=12;i++){const x=q.x+q.w*i/12,y=q.y+q.h*(j+.5)/5+Math.sin(i*9+t*70+j)*5;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}}}
 if(state==='slam'){for(const q of b.offense){c.fillStyle=color+'55';c.fillRect(q.x,q.y,q.w,q.h);c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.ellipse(q.x+q.w/2,GROUND-5,q.w/2,7,0,0,Math.PI*2);c.stroke();for(let i=0;i<10;i++){c.fillStyle=i%2?color:'#fff1cf';c.fillRect(q.x+q.w*i/10,GROUND-5-(i*13+t*120)%q.h,3,3);}}}
 if(state==='charge'){for(const q of b.offense){c.fillStyle=color+'33';c.fillRect(q.x,q.y,q.w,q.h);}}
 if(state==='charge'&&red){c.fillStyle='#ff394d55';for(let i=1;i<7;i++)c.fillRect(cx-b.facing*(30+i*10),feet-48+i*4,8,3);}
 if(state==='transition'||b.dead){const burst=b.dead?collapse:Math.max(0,t-.65);const sx=cx-b.facing*26,sy=feet-65;
  if(!b.dead&&t<.85){c.strokeStyle='#ff5264';c.lineWidth=2;c.beginPath();c.moveTo(sx-9,sy-12);c.lineTo(sx+3,sy-3);c.lineTo(sx-5,sy+6);c.lineTo(sx+11,sy+17);c.stroke();}
  c.strokeStyle='#ff394d';c.lineWidth=3;c.beginPath();c.arc(sx,sy,8+burst*90,0,Math.PI*2);c.stroke();
  for(let i=0;i<22;i++){const a=i*2.4,r=burst*(35+i*5);c.fillStyle=i%3?'#777c85':'#ff5264';c.fillRect(sx+Math.cos(a)*r,sy+Math.sin(a)*r+burst*burst*70,3+i%5,3+i%4);}
  if(!b.dead&&t>.65&&t<1.05){c.fillStyle='#ff516488';c.fillRect(cx-65,feet-145,130,145);}
 }
 if(state==='windup'||state==='slam'||state==='transition'||b.dead){for(let i=0;i<9;i++){const a=i*2.4+t*6,r=8+(t*35+i*7)%33;c.fillStyle=red?'#ff5264':color;c.fillRect(core.x+Math.cos(a)*r,core.y+Math.sin(a)*r,2,2);}}
 if(!b.dead&&(b.laser||b.laserFade)){
  const q=b.laser||b.laserFade,active=state==='laser',fade=!b.laser;
  c.save();if(fade)c.globalAlpha=q.time/.14;
  if(active||fade){
   c.fillStyle='#650c3066';c.fillRect(q.x,q.y-3,q.w,q.h+6);
   c.fillStyle='#f52649';c.fillRect(q.x,q.y,q.w,q.h);
   c.fillStyle='#ff6875';c.fillRect(q.x,q.a.y+5,q.w,q.h-12);
   c.fillStyle='#fff1ce';c.fillRect(q.x,q.a.y-2,q.w,5);
  }else{
   c.fillStyle='#ff294926';c.fillRect(q.x,q.y,q.w,q.h);
   c.strokeStyle='#ff5264';c.lineWidth=2;c.strokeRect(q.x,q.y,q.w,q.h);
   c.fillStyle='#ff8a95';c.fillRect(q.x,q.a.y-1,q.w,2);
  }
  c.fillStyle='#fff1ce';c.fillRect(q.a.x-4,q.a.y-4,8,8);c.restore();
 }
 if(!b.dead&&b.blast){const q=b.blast;c.strokeStyle='#ff5264';c.lineWidth=3;c.beginPath();c.arc(q.x,q.y,q.radius,0,Math.PI*2);c.stroke();c.fillStyle=state==='blast'?'#ff294970':'#a00c3028';c.fill();for(let i=0;i<24;i++){const a=i*2.4,r=q.radius*(state==='blast'?1:.4+.5*Math.sin(t*20)**2);c.fillStyle=i%3?'#ff5264':'#c7b4a0';c.fillRect(q.x+Math.cos(a)*r,q.y+Math.sin(a)*r,4,4);}}
 if(b.impact){const q=b.impact;for(let i=0;i<24;i++){const dx=(i-12)*q.time*26,dy=-Math.abs(Math.sin(i*9))*q.time*210+q.time*q.time*320;c.fillStyle=i%3?color:'#aaa497';c.fillRect(q.x+dx,GROUND+dy-4,3+i%3,3);}}
 c.restore();
}
