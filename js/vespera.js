import{hostileProjectileScale}from'./cybernetics.js';
import{scaledPlayerDamage}from'./upgrades.js';
import{hurt,intersects}from'./combat.js';

export const VESPERA=Object.freeze({scale:.34,walkSpeed:90,recovery:1.05,hurt:.4,hitCooldown:.18,hurtResistance:1.4,transition:2.8,slashFPS:12,slashStart:5/12,slashEnd:7/12,slashDuration:8/12,ruptureWarning:.72,ruptureActive:.24,commandWarning:.8,shotInterval:.3,shotSpeed:300,shotLife:2.5,trackingTime:.35,turnRate:.85,isolationWarning:1.3,isolationActive:.55,isolationSequence:2.05,overloadWarning:1.4,overloadActive:.65,overloadRecovery:1.65,empDisable:2.6,empResistance:7,empRange:280,death:1});
const clamp=(v,a,z)=>Math.max(a,Math.min(z,v));
const center=b=>b.x+b.w/2;
export function resetVespera(b){
 Object.assign(b,{vesperaState:'idle',stateTime:0,visualTime:0,phase:1,phaseTransitioned:false,transitionCount:0,hitCooldown:0,hurtResistance:0,recoveryTimer:.7,attackType:'recovery',warning:0,projectiles:[],zones:[],rupture:null,attackHistory:[],shotsFired:0,deathComplete:false});
 b.drone={x:center(b)-45,y:b.y+18,targetX:center(b)-45,targetY:b.y+18,disabled:0,resistance:0,active:true,facing:-1};
}
export function restoreDefeatedVespera(b){resetVespera(b);b.dead=true;b.health=0;b.active=false;b.vesperaState='death';b.stateTime=VESPERA.death;b.deathComplete=true;b.drone.active=false}
function enter(b,state){b.vesperaState=state;b.stateTime=0;b.warning=0;b.attackType=['command','isolation_protocol','network_overload','phase_transition'].includes(state)?'windup':'recovery'}
function recover(b,delay=VESPERA.recovery){b.projectiles=[];b.zones=[];b.rupture=null;enter(b,'idle');b.recoveryTimer=delay}
export function defeatVespera(b){if(b.vesperaState==='death')return;b.dead=true;b.health=0;b.projectiles=[];b.zones=[];b.rupture=null;b.drone||={x:center(b),y:b.y};b.drone.active=false;b.drone.disabled=0;b.deathComplete=false;b.deathTimer=VESPERA.death;enter(b,'death')}
export function hitVespera(b,amount){
 if(b.dead||!b.active||b.vesperaState==='phase_transition'||b.hitCooldown>0)return false;
 b.health=Math.max(0,b.health-amount);b.hitCooldown=VESPERA.hitCooldown;
 if(!b.health){defeatVespera(b);return true}
 if(b.hurtResistance<=0&&['idle','walk','reposition','hurt'].includes(b.vesperaState)){enter(b,'hurt');b.hurtResistance=VESPERA.hurtResistance}
 return true;
}
export function empVespera(b,p){
 if(b.dead||!b.active||b.vesperaState==='phase_transition')return false;
 const d=b.drone;if(!d?.active||d.resistance>0||Math.hypot(d.x-(p.x+p.w/2),d.y-(p.y+p.h/2))>VESPERA.empRange)return false;
 d.disabled=VESPERA.empDisable;d.resistance=VESPERA.empResistance;
 hitVespera(b,scaledPlayerDamage(p,12));if(['command','isolation_protocol','network_overload'].includes(b.vesperaState))recover(b);
 b.projectiles=[];b.zones=[];return true;
}
export function slashBox(b){
 if(b.vesperaState!=='cyber_slash'||b.stateTime<VESPERA.slashStart||b.stateTime>=VESPERA.slashEnd)return null;
 return{x:b.facing>0?center(b)+8:center(b)-44,y:b.arena.floor-74,w:36,h:30};
}
function makeZones(b,p,sequence=0,overload=false){
 const a=b.arena,width=(a.right-a.left-80)/5;
 const lane=clamp(Math.floor((p.x+p.w/2-a.left-40)/width),0,4);
 const safe=sequence?lane:(lane===4?3:lane+1);
 for(let i=0;i<5;i++)if(i!==safe){
  b.zones.push({x:a.left+40+i*width+14,y:a.floor-270,w:width-28,h:270,start:sequence*VESPERA.isolationSequence,warning:overload?VESPERA.overloadWarning:VESPERA.isolationWarning,duration:overload?VESPERA.overloadActive:VESPERA.isolationActive,sequence,overload});
 }
}
export function chooseVesperaAttack(b,p,rng=Math.random){
 const distance=Math.abs(center(b)-(p.x+p.w/2));
 let choices=['command','isolation_protocol'];if(distance<60)choices.push('cyber_slash','cyber_slash');if(b.phase===2)choices.push('network_overload');
 const h=b.attackHistory;if(h.length>1&&h.at(-1)===h.at(-2))choices=choices.filter(s=>s!==h.at(-1));
 return choices[Math.min(choices.length-1,Math.floor(rng()*choices.length))];
}
export function startVesperaAttack(b,state,p){
 b.projectiles=[];b.zones=[];b.rupture=null;b.attackHistory.push(state);if(b.attackHistory.length>20)b.attackHistory.shift();
 b.facing=Math.sign(p.x+p.w/2-center(b))||b.facing||-1;enter(b,state);b.shotsFired=0;b.lockedAim=null;
 if(state==='isolation_protocol'){makeZones(b,p);if(b.phase===2)makeZones(b,p,1)}
 if(state==='network_overload')makeZones(b,p,0,true);
}
function updateDrone(b,p,dt){
 const d=b.drone,a=b.arena;d.disabled=Math.max(0,d.disabled-dt);d.resistance=Math.max(0,d.resistance-dt);
 let tx=center(b)-b.facing*37,ty=a.floor-73+Math.sin(b.visualTime*3)*4;
 if(d.active&&!d.disabled){
  if(b.vesperaState==='command'){tx=clamp(p.x+p.w/2-b.facing*145,a.left+45,a.right-45);ty=a.floor-(b.phase===2?200:145)}
  if(b.vesperaState==='network_overload'){tx=(a.left+a.right)/2;ty=a.floor-285}
  if(b.vesperaState==='isolation_protocol'&&b.phase===2){tx=(a.left+a.right)/2;ty=a.floor-230}
 }
 d.targetX=tx;d.targetY=ty;const alpha=1-Math.exp(-dt*5);d.x=clamp(d.x+(tx-d.x)*alpha,a.left+20,a.right-20);d.y=clamp(d.y+(ty-d.y)*alpha,a.floor-310,a.floor-35);d.facing=Math.sign(p.x-d.x)||1;
}
export function updateVespera(b,p,dt){
 if(!b.vesperaState)resetVespera(b);
 if(b.dead){if(b.vesperaState!=='death')restoreDefeatedVespera(b);if(!b.deathComplete){b.stateTime=Math.min(VESPERA.death,b.stateTime+dt);if(b.stateTime>=VESPERA.death){b.deathComplete=true;return{kind:'defeated'}}}return null}
 if(!b.active)return null;
 b.visualTime+=dt;b.stateTime+=dt;b.hitCooldown=Math.max(0,b.hitCooldown-dt);b.hurtResistance=Math.max(0,b.hurtResistance-dt);
 if(b.health<=b.maxHealth*.5&&!b.phaseTransitioned){b.phaseTransitioned=true;b.phase=2;b.transitionCount++;b.projectiles=[];b.zones=[];b.rupture=null;enter(b,'phase_transition')}
 updateDrone(b,p,dt);const state=b.vesperaState;
 if(p.dead)return null;
 if(state==='phase_transition'){if(b.stateTime>=VESPERA.transition)recover(b);return null}
 if(state==='hurt'){if(b.stateTime>=VESPERA.hurt)recover(b);return null}
 if(state==='idle'){
  b.recoveryTimer-=dt;if(b.recoveryTimer<=0){enter(b,'walk');b.walkFacing=Math.sign(p.x+p.w/2-center(b))||-1}return null;
 }
 if(state==='walk'||state==='reposition'){
  const distance=Math.abs(p.x+p.w/2-center(b));b.facing=b.walkFacing;
  if(distance>48)b.x=clamp(b.x+b.walkFacing*VESPERA.walkSpeed*dt,b.arena.left+30,b.arena.right-b.w-30);
  if(distance<=48||b.stateTime>=1)startVesperaAttack(b,chooseVesperaAttack(b,p),p);return null;
 }
 if(state==='command'&&!b.drone.disabled){
  const next=VESPERA.commandWarning+b.shotsFired*VESPERA.shotInterval;
  if(b.shotsFired<3&&b.stateTime>=next-.2&&!b.lockedAim)b.lockedAim={x:p.x+p.w/2,y:p.y+p.h/2};
  if(b.shotsFired<3&&b.stateTime>=next){const d=b.drone,aim=b.lockedAim||{x:p.x+p.w/2,y:p.y+p.h/2},angle=Math.atan2(aim.y-d.y,aim.x-d.x);b.projectiles.push({x:d.x,y:d.y,originX:d.x,originY:d.y,vx:Math.cos(angle)*VESPERA.shotSpeed,vy:Math.sin(angle)*VESPERA.shotSpeed,life:VESPERA.shotLife,age:0,w:10,h:10,damage:b.phase===2?16:12,color:b.phase===2?'#ff456d':'#62f5ff',tracking:b.phase===2});b.shotsFired++;b.lockedAim=null}
 }
 if(state==='cyber_slash'){
  const box=slashBox(b);if(box&&intersects(p,box))hurt(p,b.phase===2?20:16,center(b),{source:'vespera_slash',entity:b.id,x:box.x,y:box.y});
  if(b.phase===2&&b.stateTime>=VESPERA.slashEnd&&!b.rupture)b.rupture={x:b.facing>0?center(b)+4:center(b)-76,y:b.arena.floor-28,w:72,h:28,start:b.stateTime};
  if(b.rupture){const age=b.stateTime-b.rupture.start;if(age>=VESPERA.ruptureWarning&&age<VESPERA.ruptureWarning+VESPERA.ruptureActive&&intersects(p,b.rupture))hurt(p,18,center(b),{source:'vespera_rupture',entity:b.id,x:b.rupture.x,y:b.rupture.y})}
  if(b.stateTime>=VESPERA.slashDuration+(b.phase===2?VESPERA.ruptureWarning+VESPERA.ruptureActive:0))recover(b);
 }
 for(const z of b.zones){const age=b.stateTime-z.start;if(age>=z.warning&&age<z.warning+z.duration&&intersects(p,z))hurt(p,z.overload?25:15,z.x,{source:z.overload?'vespera_overload':'vespera_isolation',entity:b.id,x:z.x,y:z.y})}
 for(const q of b.projectiles){
  q.age+=dt;q.life-=dt;
  if(q.tracking&&q.age<VESPERA.trackingTime){const desired=Math.atan2(p.y+p.h/2-q.y,p.x+p.w/2-q.x),angle=Math.atan2(q.vy,q.vx),delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle)),next=angle+clamp(delta,-VESPERA.turnRate*dt,VESPERA.turnRate*dt);q.vx=Math.cos(next)*VESPERA.shotSpeed;q.vy=Math.sin(next)*VESPERA.shotSpeed}
  const speedScale=hostileProjectileScale(p,q);q.x+=q.vx*dt*speedScale;q.y+=q.vy*dt*speedScale;if(q.life>0&&intersects(p,{x:q.x-5,y:q.y-5,w:10,h:10})){hurt(p,q.damage,q.x,{source:'vespera_drone',entity:'nexus01',x:q.x,y:q.y});q.life=0}
 }
 b.projectiles=b.projectiles.filter(q=>q.life>0&&q.x>b.arena.left&&q.x<b.arena.right);
 if(state==='command'&&b.shotsFired===3&&!b.projectiles.length)recover(b);
 if(state==='isolation_protocol'&&b.stateTime>=(b.phase===2?VESPERA.isolationSequence:0)+VESPERA.isolationWarning+VESPERA.isolationActive+.3)recover(b);
 if(state==='network_overload'&&b.stateTime>=VESPERA.overloadWarning+VESPERA.overloadActive+.5)recover(b,VESPERA.overloadRecovery);
 return null;
}
export function vesperaAnimation(b){return b.dead?'death':b.vesperaState==='hurt'?'hurt':['walk','reposition'].includes(b.vesperaState)?'walk':b.vesperaState==='cyber_slash'?'attack':['command','isolation_protocol','network_overload','phase_transition'].includes(b.vesperaState)?'command':'idle'}
export function vesperaFrame(b){const key=vesperaAnimation(b),counts={idle:6,walk:8,command:6,attack:8,hurt:4,death:8},fps={idle:6,walk:10,command:10,attack:12,hurt:10,death:8};const t=['idle','walk'].includes(key)?b.visualTime:b.stateTime;return ['idle','walk'].includes(key)?Math.floor(t*fps[key])%counts[key]:Math.min(counts[key]-1,Math.floor(t*fps[key]))}
export function renderVespera(c,b,camera,renderer){
 if(!b.active&&!b.dead)return;if(!b.vesperaState)resetVespera(b);
 const ox=camera.x||0,oy=camera.y||0;c.save();c.translate(-ox,-oy);
 if(b.vesperaState==='phase_transition'){c.fillStyle='#070410b0';c.fillRect(b.arena.left,b.arena.floor-900,b.arena.right-b.arena.left,900);c.fillStyle='#ffe6f1';c.font='16px monospace';c.textAlign='center';const transform=c.getTransform(),textX=((c.canvas.width/2)-transform.e)/transform.a;c.fillText(b.stateTime<1.4?'Você ainda não compreendeu, Kael.':'Eu sou o sistema.',textX,b.arena.floor-250);if(b.stateTime<1.4)c.fillText('Eu não controlo este sistema...',textX,b.arena.floor-224)}
 for(const z of b.zones){const age=b.stateTime-z.start;if(age<0||age>=z.warning+z.duration)continue;const active=age>=z.warning;c.fillStyle=active?'#ff3569aa':'#ff35692c';c.fillRect(z.x,active?z.y:b.arena.floor-12,z.w,active?z.h:12);c.strokeStyle=active?'#fff1e7':'#ff5d78';c.lineWidth=active?4:1;c.strokeRect(z.x,z.y,z.w,z.h);if(z.overload){c.fillStyle='#f2809a';c.fillRect(z.x+z.w/2-9,z.y-12,18,14);c.beginPath();c.moveTo(z.x+z.w/2,z.y);c.lineTo(z.x+z.w/2,b.arena.floor);c.stroke()}}
 if(b.phase===2&&!b.dead){c.strokeStyle='#ff315d88';for(let i=0;i<4;i++){const x=center(b)-35+i*22;c.beginPath();c.moveTo(x,b.arena.floor);c.lineTo(x+Math.sin(b.visualTime*4+i)*8,b.arena.floor-15);c.stroke()}}
 renderer?.draw(c,'vespera',vesperaAnimation(b),b,0,{x:center(b),y:b.arena.floor,frameOverride:vesperaFrame(b)});
 const box=slashBox(b);if(box){c.fillStyle='#71ffff38';c.fillRect(box.x,box.y,box.w,box.h);c.strokeStyle='#71ffff';c.lineWidth=3;c.beginPath();c.moveTo(box.x,box.y+15);c.lineTo(box.x+box.w,box.y+15);c.stroke()}
 if(b.rupture){const active=b.stateTime-b.rupture.start>=VESPERA.ruptureWarning;c.fillStyle=active?'#ff335fbb':'#ff335f44';c.fillRect(b.rupture.x,b.rupture.y,b.rupture.w,b.rupture.h)}
 const d=b.drone;if(d&&!d.active){c.save();c.globalAlpha=.35;renderer?.draw(c,'nexus01','idle',d,0,{x:d.x,y:d.y});c.restore()}if(d?.active){renderer?.draw(c,'nexus01','idle',d,0,{x:d.x,y:d.y});c.fillStyle=d.disabled?'#ffbf54':b.phase===2?'#ff315d':'#43efff';c.fillRect(Math.round(d.x-5),Math.round(d.y+12),10,3+Math.floor(Math.sin(b.visualTime*25)*2));if(d.disabled){c.strokeStyle='#ffdc81';c.beginPath();c.arc(d.x,d.y,22,0,Math.PI*2);c.stroke()}else if(b.vesperaState==='command'&&b.lockedAim){c.strokeStyle='#ff677c';c.setLineDash([5,6]);c.beginPath();c.moveTo(d.x,d.y);c.lineTo(b.lockedAim.x,b.lockedAim.y);c.stroke();c.setLineDash([]);c.strokeRect(b.lockedAim.x-9,b.lockedAim.y-9,18,18)}}
 for(const q of b.projectiles){c.fillStyle=q.color;c.fillRect(Math.round(q.x-5),Math.round(q.y-5),10,10);c.fillStyle='#ffffff';c.fillRect(Math.round(q.x-2),Math.round(q.y-2),4,4)}c.restore();
}
