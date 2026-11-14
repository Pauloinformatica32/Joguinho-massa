import{hurt,intersects}from'./combat.js';
import{moveBody}from'./physics.js';
import{towerFloorAt}from'./tower-layout.js';

// Timings are simulation-driven; drawing extra frames cannot cause damage.
export const TOWER_ENEMY_SPECS=Object.freeze({
 interceptor_i9:{hp:48,speed:150,damage:14,w:26,h:60,detect:420,range:48,warning:.24,fps:12,frames:8,impact:4,activeFrames:1,recovery:.55,cooldown:1.35},
 optic_s6:{hp:36,speed:0,damage:13,w:42,h:44,detect:650,range:650,warning:.6,fps:10,frames:6,impact:3,activeFrames:2,recovery:.6,cooldown:2.2},
 synaptic_h0:{hp:72,speed:54,damage:16,w:28,h:60,detect:340,range:155,warning:.35,fps:10,frames:8,impact:3,activeFrames:3,recovery:.8,cooldown:2.2}
});
// Slot IDs are unchanged so previously collected enemy credits stay collected.
export const TOWER_ENEMY_SLOTS=[
 {id:'2-500-shooter',assetId:'interceptor_i9',x:5700,y:730,left:5580,right:5900},
 {id:'2-1100-sentinel',assetId:'optic_s6',x:6210,y:473},
 {id:'2-1480-heavy',assetId:'interceptor_i9',x:6680,y:730,left:6470,right:6770},
 {id:'2-4200-drone',assetId:'interceptor_i9',x:9400,y:730,left:9280,right:9660},
 {id:'2-4850-shooter',assetId:'synaptic_h0',x:10560,y:730,left:10525,right:10590},
 {id:'2-6000-sentinel',assetId:'optic_s6',x:11275,y:463},
 {id:'2-6500-heavy',assetId:'synaptic_h0',x:11900,y:730,left:11800,right:11970}
];
export const isTowerEnemy=e=>!!TOWER_ENEMY_SPECS[e.assetId];
const center=e=>e.x+e.w/2;
const clamp=(v,l,r)=>Math.max(l,Math.min(r,v));
export function resetTowerEnemy(e,revive=false){
 const cfg=TOWER_ENEMY_SPECS[e.assetId];if(!cfg)return;
 Object.assign(e,{towerState:'patrol',stateTime:0,visualTime:0,walkTime:0,attackCooldown:1,pendingAttack:null,windupTimer:0,beam:null,attackHit:false,projectiles:[],vx:0,vy:0,deathTime:0,lastAnimation:'idle',lastFrame:0});
 if(revive){e.dead=false;e.health=e.maxHealth;e.x=e.homeX;e.y=e.homeY;e.hurtTimer=e.stunTimer=0}
}
export function configureTowerEnemies(list){
 for(const slot of TOWER_ENEMY_SLOTS){const e=list.find(e=>e.id===slot.id);if(!e)continue;const spec=TOWER_ENEMY_SPECS[slot.assetId];
  Object.assign(e,{assetId:slot.assetId,x:slot.x,homeX:slot.x,y:slot.y,homeY:slot.y,w:spec.w,h:spec.h,health:spec.hp,maxHealth:spec.hp,damage:spec.damage,speed:spec.speed,kind:slot.assetId==='synaptic_h0'?'human':'robot',patrolBounds:{left:slot.left??slot.x,right:slot.right??slot.x},towerFloor:towerFloorAt(slot.x).id});resetTowerEnemy(e);
 }
 return list;
}
function enter(e,state){e.towerState=state;e.stateTime=0;e.attackHit=false;e.attackBox=null}
export function cancelTowerAttack(e){e.pendingAttack=null;e.beam=null;e.windupTimer=0;if(['windup','attack'].includes(e.towerState)){enter(e,'recovery');e.attackCooldown=Math.max(e.attackCooldown,.7)}}
// Liang–Barsky slab intersection shared by beam drawing, cover and damage.
export function segmentRect(a,z,r){
 let lo=0,hi=1;for(const [v,d,min,max]of [[a.x,z.x-a.x,r.x,r.x+r.w],[a.y,z.y-a.y,r.y,r.y+r.h]]){
  if(Math.abs(d)<1e-9){if(v<min||v>max)return null;continue}
  let t0=(min-v)/d,t1=(max-v)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return null;
 }return lo;
}
export function opticMuzzle(e){return{x:center(e)+(['attack','windup'].includes(e.towerState)?e.meleeFacing:e.facing)*18,y:e.y+36}}
export function clipTowerBeam(a,z,platforms){
 let stop=1;for(const p of platforms){if(p.disabled)continue;const hit=segmentRect(a,z,p);if(hit!==null&&hit>1e-5)stop=Math.min(stop,hit)}
 return{a:{...a},z:{x:a.x+(z.x-a.x)*stop,y:a.y+(z.y-a.y)*stop},radius:4};
}
function targetBeam(e,p,platforms){
 const a=opticMuzzle(e),dx=p.x+p.w/2-a.x,dy=p.y+p.h/2-a.y,d=Math.hypot(dx,dy)||1;
 const floor=towerFloorAt(e.x),length=650;let tx=a.x+dx/d*length,ty=a.y+dy/d*length;
 if(tx<floor.left||tx>floor.right){const edge=tx<floor.left?floor.left:floor.right,t=(edge-a.x)/(tx-a.x);tx=edge;ty=a.y+(ty-a.y)*t}
 return clipTowerBeam(a,{x:tx,y:ty},platforms);
}
export function towerAttackBox(e,platforms=[]){
 if(e.dead||e.hurtTimer>0||e.stunTimer>0||e.towerState!=='attack')return null;
 const s=TOWER_ENEMY_SPECS[e.assetId],frame=e.stateTime*s.fps;
 if(frame+1e-8<s.impact||frame+1e-8>=s.impact+s.activeFrames||e.assetId==='optic_s6')return null;
 const facing=e.meleeFacing??e.facing;
 if(e.assetId==='interceptor_i9')return{x:facing>0?center(e)+8:center(e)-36,y:e.y+e.h-44,w:28,h:22};
 const y=e.y+e.h-18,a={x:center(e)+facing*8,y:y+9},beam=clipTowerBeam(a,{x:a.x+facing*140,y:a.y},platforms);
 return{x:Math.min(a.x,beam.z.x),y,w:Math.abs(beam.z.x-a.x),h:18};
}
export function towerBeamActive(e){const s=TOWER_ENEMY_SPECS.optic_s6;return!e.dead&&!(e.hurtTimer>0)&&!(e.stunTimer>0)&&e.assetId==='optic_s6'&&e.towerState==='attack'&&e.stateTime*s.fps+1e-8>=s.impact&&e.stateTime*s.fps+1e-8<s.impact+s.activeFrames}
export function towerAnimation(e){return e.dead?e.deathPose?.animation||'idle':e.towerState==='attack'?'attack':e.assetId==='optic_s6'&&e.towerState==='tracking'?'walk':e.moving?'walk':'idle'}
export function towerFrame(e){if(e.dead)return e.deathPose?.frame||0;const a=towerAnimation(e),s=TOWER_ENEMY_SPECS[e.assetId];return a==='attack'?Math.min(s.frames-1,Math.floor(e.stateTime*s.fps)):a==='walk'?Math.floor((e.walkTime??0)*(e.assetId==='optic_s6'?7:e.assetId==='synaptic_h0'?8:10))%(e.assetId==='optic_s6'?6:8):0}
export function updateTowerEnemy(e,p,dt,world){
 const s=TOWER_ENEMY_SPECS[e.assetId],platforms=world.map.platforms;if(!e.towerState)resetTowerEnemy(e);
 const same=towerFloorAt(p.x)?.id===e.towerFloor,near=same&&Math.abs(e.x-p.x)<1100;
 if(e.dead){
  if(e.towerState!=='death'){e.deathPose={animation:e.lastAnimation,frame:e.lastFrame};enter(e,'death');e.deathTime=0;e.pendingAttack=null;e.beam=null;e.projectiles=[];e.respawn=e.respawn>0?e.respawn:30}
  e.deathTime+=dt;if(near&&e.type!=='sentinel'){e.respawn-=dt;if(e.respawn<=0)resetTowerEnemy(e,true)}return;
 }
 e.hurtTimer=Math.max(0,(e.hurtTimer||0)-dt);e.stunTimer=Math.max(0,(e.stunTimer||0)-dt);
 if(!near||p.dead){cancelTowerAttack(e);e.moving=false;return}
 if(e.assetId==='optic_s6'){e.x=e.homeX;e.y=e.homeY;e.vx=e.vy=0}
 e.visualTime+=dt;e.stateTime+=dt;e.attackCooldown=Math.max(0,e.attackCooldown-dt);
 if(e.assetId==='synaptic_h0'&&same&&Math.abs(center(e)-(p.x+p.w/2))<300&&Math.abs(e.y-p.y)<160&&!e.encounterNamed){e.encounterNamed=true;e.nameTimer=3}
 e.nameTimer=Math.max(0,(e.nameTimer||0)-dt);
 if(e.hurtTimer>0||e.stunTimer>0){cancelTowerAttack(e);e.moving=false;if(e.assetId!=='optic_s6'){e.vx*=Math.exp(-18*dt);moveBody(e,dt,platforms);e.x=clamp(e.x,e.patrolBounds.left,e.patrolBounds.right)}return}
 if(['attack','windup'].includes(e.towerState)&&!e.pendingAttack)cancelTowerAttack(e);
 const dx=p.x+p.w/2-center(e),dy=p.y+p.h/2-(e.y+e.h/2),camera=e.assetId==='optic_s6';
 const detected=Math.abs(dx)<s.detect&&Math.abs(dy)<(camera?450:100);
 if(e.towerState==='windup'){
  if(e.assetId==='synaptic_h0'){const a={x:center(e)+e.meleeFacing*8,y:e.y+e.h-9},beam=clipTowerBeam(a,{x:a.x+e.meleeFacing*140,y:a.y},platforms);e.warningBox={x:Math.min(a.x,beam.z.x),y:e.y+e.h-18,w:Math.abs(beam.z.x-a.x),h:18}}
  e.windupTimer=Math.max(0,s.warning-e.stateTime);if(e.stateTime>=s.warning){enter(e,'attack');if(camera)e.beam=targetBeam(e,p,platforms)}
 }else if(e.towerState==='attack'){
  const box=towerAttackBox(e,platforms);e.attackBox=box;if(camera&&e.beam)e.beam=clipTowerBeam(e.beam.a,e.beam.z,platforms);if(!e.attackHit&&box&&box.w>0&&intersects(p,box)){e.attackHit=hurt(p,s.damage,center(e),{source:e.assetId==='interceptor_i9'?'i9_blade':'h0_discharge',entity:e.id,x:box.x,y:box.y})}
  if(camera&&towerBeamActive(e)&&e.beam&&!e.attackHit){const r=e.beam.radius,pad={x:p.x-r,y:p.y-r,w:p.w+r*2,h:p.h+r*2};if(segmentRect(e.beam.a,e.beam.z,pad)!==null)e.attackHit=hurt(p,s.damage,e.beam.a.x,{source:'s6_laser',entity:e.id,x:e.beam.a.x,y:e.beam.a.y})}
  if(e.stateTime>=s.frames/s.fps){enter(e,'recovery');e.pendingAttack=null;e.beam=null;e.attackCooldown=s.cooldown}
 }else if(e.towerState==='recovery'){
  if(e.stateTime>=s.recovery)enter(e,camera?'tracking':'patrol');
 }else{
  if(detected)e.facing=Math.sign(dx)||e.facing;
  if(camera){e.towerState=detected?'tracking':'patrol';e.moving=false}
  else{e.vx=detected?(Math.abs(dx)>s.range-5?Math.sign(dx)*s.speed:0):e.facing*s.speed*.45;e.moving=Math.abs(e.vx)>1}
  const visible=!camera||segmentRect(targetBeam(e,p,platforms).a,targetBeam(e,p,platforms).z,p)!==null;
  if(detected&&Math.abs(dx)<s.range&&e.attackCooldown<=0&&visible){e.meleeFacing=e.facing;e.pendingAttack=e.assetId;e.moving=false;e.vx=0;enter(e,'windup');if(camera)e.beam=targetBeam(e,p,platforms)}
 }
 if(['attack','windup','recovery'].includes(e.towerState)){e.vx=0;e.moving=false}
 if(camera){if(e.towerState==='windup')e.beam=targetBeam(e,p,platforms)}else{
  const oldX=e.x;moveBody(e,dt,platforms);e.x=clamp(e.x,e.patrolBounds.left,e.patrolBounds.right);e.moving=Math.abs(e.x-oldX)>.001;
  if(!detected&&(e.x<=e.patrolBounds.left||e.x>=e.patrolBounds.right))e.facing*=-1;
 }
 // Keep the locomotion phase across stops/attacks. Idle time must not select a random
 // walking pose on resumption; only simulation movement (or fixed-mount tracking) advances it.
 if(e.moving||(camera&&e.towerState==='tracking'))e.walkTime=(e.walkTime||0)+dt;
 e.lastAnimation=towerAnimation(e);e.lastFrame=towerFrame(e);
}
export function renderTowerEnemy(c,e,camera,renderer){
 if(e.dead&&e.deathTime>=.65)return;
 const s=TOWER_ENEMY_SPECS[e.assetId],ox=camera.x||0,oy=camera.y||0;c.save();c.translate(-ox,-oy);
 if(e.dead)c.globalAlpha=Math.max(0,1-e.deathTime/.65);else if(e.hurtTimer>0)c.globalAlpha=.6;
 const facing=e.meleeFacing&&['windup','attack'].includes(e.towerState)?e.meleeFacing:e.facing;
 // The fixed mount is centered at source X=71, not the cell center (64).
 // Compensate its 4.2px offset when flipping, keeping the ceiling bolt fixed.
 renderer?.draw(c,e.assetId,towerAnimation(e),e,0,{x:center(e)+(e.assetId==='optic_s6'?facing*4.2:0),y:e.assetId==='optic_s6'?e.y:e.y+e.h,facing,frameOverride:towerFrame(e)});
 if(!e.dead){
  const preparing=['windup','attack'].includes(e.towerState);if(preparing){
   if(e.assetId==='optic_s6'&&e.beam){const active=towerBeamActive(e);c.lineWidth=active?8:1;c.strokeStyle=active?'#ff3b6c':'#ffb17f';if(!active)c.setLineDash([5,6]);c.beginPath();c.moveTo(e.beam.a.x,e.beam.a.y);c.lineTo(e.beam.z.x,e.beam.z.y);c.stroke();c.setLineDash([]);if(active){c.lineWidth=2;c.strokeStyle='#fff4ee';c.stroke()}}
   else if(e.assetId==='synaptic_h0'){const facing=e.meleeFacing,box=e.attackBox||e.warningBox||{x:facing>0?center(e)+8:center(e)-148,y:e.y+e.h-18,w:140,h:18};const active=!!towerAttackBox(e);c.fillStyle=active?'#ff497e55':'#ffbf5555';c.fillRect(box.x,box.y,box.w,box.h);c.strokeStyle=active?'#fff1e5':'#fa698b';c.beginPath();for(let i=0;i<=box.w;i+=5){const y=box.y+9+(active?Math.sin(i*.7+e.visualTime*40)*7:0);if(!i)c.moveTo(box.x+i,y);else c.lineTo(box.x+i,y)}c.stroke()}
   else{const box=towerAttackBox(e);if(box){c.fillStyle='#ff426a66';c.fillRect(box.x,box.y,box.w,box.h)}else if(e.towerState==='windup'){c.fillStyle='#ffbd71';c.fillRect(e.x,e.y-8,e.w,3)}}
  }
  c.fillStyle='#101820';c.fillRect(e.x,e.y-5,e.w,3);c.fillStyle='#e95b76';c.fillRect(e.x,e.y-5,e.w*Math.max(0,e.health/e.maxHealth),3);
  if(e.nameTimer>0){c.font='11px monospace';c.textAlign='center';c.fillStyle='#101820ed';c.fillRect(center(e)-99,e.y-34,198,20);c.fillStyle='#a4ffff';c.fillText('PROTÓTIPO SINÁPTICO H-0',center(e),e.y-20)}
 }
 c.restore();
}
