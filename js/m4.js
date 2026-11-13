import {hurt,intersects} from './combat.js';
import {moveBody} from './physics.js';
import {REGIONS} from './map.js';

// attack.png: frames 0–2 open the claw, frame 3 closes it, 4–5 retract it.
// Time comes from simulation so pausing/redrawing cannot create extra strikes.
export const M4_CLAW=Object.freeze({fps:10,frames:6,impactFrame:3,active:.1,recovery:.35,cooldown:1.4,range:60,detect:350});
export function cancelM4Attack(e){
 e.pendingAttack=null;e.m4Phase=null;e.clawTime=0;e.recoveryTimer=0;
 e.attackHit=false;e.windupTimer=0;
}
function clawBox(e){
 const center=e.x+e.w/2,facing=e.meleeFacing??e.facing;
 return {x:facing>0?center+24:center-50,y:e.y+e.h-55,w:26,h:24};
}
export function m4AttackBox(e){
 const start=M4_CLAW.impactFrame/M4_CLAW.fps;
 return !e.dead&&!(e.hurtTimer>0)&&!(e.stunTimer>0)&&e.pendingAttack==='claw'&&e.clawTime+1e-9>=start&&e.clawTime+1e-9<start+M4_CLAW.active?clawBox(e):null;
}
export function updateM4(e,p,dt,world){
 const platforms=world.map.platforms;
 e.vx??=0;e.vy??=0;e.projectiles=[];
 e.attackCooldown=Math.max(0,e.attackCooldown-dt);
 const dx=p.x+p.w/2-e.x-e.w/2;
 const detected=!p.dead&&Math.abs(dx)<M4_CLAW.detect&&Math.abs(p.y+p.h/2-e.y-e.h/2)<80;
 // Existing region/boss cleanup clears pendingAttack. Honor that cancellation.
 if(e.m4Phase==='claw'&&e.pendingAttack!=='claw')cancelM4Attack(e);
 if(e.hurtTimer>0||e.stunTimer>0){
  cancelM4Attack(e);e.state='hurt';
  e.vx=e.stunTimer>0?0:e.vx*Math.exp(-14*dt);
  e.attackCooldown=Math.max(e.attackCooldown,.6);
 }else if(e.m4Phase==='claw'){
  e.vx=0;e.state='attack';e.facing=e.meleeFacing;
  const previous=e.clawTime,start=M4_CLAW.impactFrame/M4_CLAW.fps;
  e.clawTime+=dt;e.windupTimer=Math.max(0,start-e.clawTime);
  // Crossing the window also works at low FPS; one strike cannot hit twice,
  // even if Kael's invulnerability expires or he enters the box later.
  if(!e.attackHit&&previous+1e-9<start+M4_CLAW.active&&e.clawTime+1e-9>=start){
   const box=clawBox(e);
   if(!platforms.some(s=>s.h>=70&&intersects(box,s))&&intersects(box,p)){
    hurt(p,e.damage,e.x+e.w/2,{source:'enemy_melee',entity:e.id,type:'hydraulic_claw',x:box.x,y:box.y});e.attackHit=true;
   }
   if(e.clawTime+1e-9>=start+M4_CLAW.active)e.attackHit=true;
  }
  if(e.clawTime+1e-9>=M4_CLAW.frames/M4_CLAW.fps){
   e.pendingAttack=null;e.m4Phase='recovery';e.recoveryTimer=M4_CLAW.recovery;
  }
 }else if(e.m4Phase==='recovery'){
  e.vx=0;e.state='idle';e.recoveryTimer=Math.max(0,e.recoveryTimer-dt);
  if(!e.recoveryTimer)e.m4Phase=null;
 }else{
  if(detected)e.facing=Math.sign(dx)||e.facing;
  else if(Math.abs(e.x-e.homeX)>=120)e.facing=e.x>e.homeX?-1:1;
  const near=detected&&Math.abs(dx)<=M4_CLAW.range;
  e.state=near?'idle':detected?'chase':'patrol';e.vx=near?0:e.facing*e.speed;
  if(near&&e.attackCooldown<=0){
   e.m4Phase='claw';e.pendingAttack='claw';e.meleeFacing=e.facing;
   e.clawTime=0;e.attackHit=false;e.windupTimer=.3;e.state='attack';e.vx=0;
   e.attackSerial=(e.attackSerial||0)+1;e.attackCooldown=M4_CLAW.cooldown;
  }
 }
 const direction=Math.sign(e.vx),ahead=e.x+e.w/2+direction*(e.w/2+6);
 const supported=platforms.some(s=>!s.disabled&&ahead>=s.x&&ahead<=s.x+s.w&&Math.abs(s.y-e.y-e.h)<8);
 if(e.grounded&&direction&&!supported){e.vx=0;if(!detected)e.facing*=-1}
 const previousX=e.x,attempt=e.vx;
 moveBody(e,dt,platforms);
 const region=REGIONS[e.room];e.x=Math.max(region.x+40,Math.min(region.x+region.width-e.w-40,e.x));
 if(!detected&&attempt&&e.x===previousX)e.facing*=-1;
 e.moving=Math.abs(e.x-previousX)>.01;
}

export function drawM4(c,e,camera,renderer,dt){
 if(e.dead){
  // No death sheet: a short deterministic spray of mechanical fragments.
  if(e.deathTimer>0){
   const t=.75-e.deathTimer,x=e.x+e.w/2-camera.x,y=e.y+e.h/2-camera.y;
   c.save();c.globalAlpha=Math.min(1,e.deathTimer/.3);
   for(let i=0;i<9;i++){const dir=i%2?1:-1;c.fillStyle=i%3?'#69716e':'#ffc449';c.fillRect(Math.round(x+dir*(i+2)*13*t),Math.round(y-55*t+110*t*t+(i%3)*6),3+i%3,3)}
   c.restore();
  }
  return true;
 }
 if(!renderer?.available('m4','idle'))return false;
 const attacking=e.pendingAttack==='claw'&&!(e.hurtTimer>0)&&!(e.stunTimer>0);
 const anim=attacking?'attack':e.moving&&e.state!=='hurt'?'walk':'idle';
 if(attacking&&e.renderAttackSerial!==e.attackSerial){renderer.animations.reset(e);e.renderAttackSerial=e.attackSerial}
 const frame=attacking?Math.min(5,Math.floor(e.clawTime*M4_CLAW.fps+1e-8)):null;
 return renderer.draw(c,'m4',anim,e,dt,{x:e.x+e.w/2-camera.x,y:e.y+e.h-camera.y,frameOverride:frame});
}
