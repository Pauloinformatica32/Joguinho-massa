import {hurt,intersects} from './combat.js';
import {moveBody} from './physics.js';
import {REGIONS} from './map.js';

export const E7_DEFAULTS=Object.freeze({detect:340,range:78,guard:.65,transition:.6,windup:.4,active:.2,vulnerable:.8,recovery:.5,bashSpeed:170});
export const isE7=e=>e.assetId==='e7_shield';
const settings=e=>({...E7_DEFAULTS,...e.e7Config});
function enter(e,state,duration=0){e.e7State=e.state=state;e.e7Time=0;e.e7Timer=duration;e.e7Serial=(e.e7Serial||0)+1;e.vx=0;}
export function resetE7(e){
 enter(e,e.dead?'death':'patrol');e.vx=e.vy=0;e.attackHit=false;e.projectiles=[];
 e.pendingAttack=null;e.vulnerableTimer=0;e.attackCooldown=.5;e.shieldFlash=0;e.e7Impact=null;e.bashImpact=0;e.hurtTimer=e.stunTimer=0;e.moving=false;
}
export function shutdownE7(e){resetE7(e);enter(e,'death');e.attackCooldown=0;}
// Coordinates come from the shield's pixels in the normalized guard pose.
// Both the body and shield advance together through moveBody during the bash.
export function e7ShieldBox(e){const center=e.x+e.w/2;return{x:e.facing>0?center+22:center-34,y:e.y+e.h-56,w:12,h:50};}
export function e7AttackBox(e){return !e.dead&&e.e7State==='shield_bash'?e7ShieldBox(e):null;}
export const e7CanTakeDamage=e=>!e.dead&&e.e7State==='vulnerable'&&e.vulnerableTimer>0;
let audio;
function clang(){
 // AudioContext starts only after a user gesture; headless and muted hosts are OK.
 try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio||!globalThis.navigator?.userActivation?.hasBeenActive)return;
 audio??=new Audio();if(audio.state!=='running')return;
 for(const frequency of [730,1170,1830]){const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.value=frequency;gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.1);}
 }catch{/* audio is optional on hosts without Web Audio */}
}
export function blockE7(e){if(e.dead)return;e.shieldFlash=.16;e.e7Impact={...e7ShieldBox(e),time:.2};clang();}
export function damageE7(e,amount,direction=0){
 if(!e7CanTakeDamage(e)){blockE7(e);return false;}
 e.health=Math.max(0,e.health-amount);e.hurtTimer=.22;e.vx=direction*65;
 if(!e.health){e.dead=true;e.deathTimer=.75;e.respawn=30;shutdownE7(e);}
 return true;
}
export function updateE7(e,p,dt,world){
 if(!e.e7State)resetE7(e);
 const cfg=settings(e),platforms=world.map.platforms;
 e.vy??=0;e.e7Time+=dt;e.e7Timer=Math.max(0,e.e7Timer-dt);e.attackCooldown=Math.max(0,e.attackCooldown-dt);
 e.shieldFlash=Math.max(0,e.shieldFlash-dt);e.bashImpact=Math.max(0,(e.bashImpact||0)-dt);if(e.e7Impact){e.e7Impact.time-=dt;if(e.e7Impact.time<=0)e.e7Impact=null;}
 e.projectiles=[];e.vx=0;
 const dx=p.x+p.w/2-e.x-e.w/2,detected=!p.dead&&Math.abs(dx)<cfg.detect&&Math.abs(p.y+p.h-e.y-e.h)<100;
 if(p.dead){enter(e,'idle');e.vulnerableTimer=0;}
 switch(e.e7State){
 case 'idle':case 'patrol':case 'approach':{
  if(detected){e.facing=Math.sign(dx)||e.facing;if(Math.abs(dx)<=cfg.range){enter(e,'guard_transition',cfg.transition);break;}e.e7State=e.state='approach';}
  else {e.e7State=e.state='patrol';if(e.x<=e.patrolBounds.left)e.facing=1;if(e.x+e.w>=e.patrolBounds.right)e.facing=-1;}
  e.vx=p.dead?0:e.facing*e.speed;break;
 }
 case 'guard_transition':case 'return_to_guard':if(!e.e7Timer)enter(e,'guard',cfg.guard);break;
 case 'guard':
  if(detected)e.facing=Math.sign(dx)||e.facing;
  if(!e.e7Timer&&!e.attackCooldown){if(detected&&Math.abs(dx)<=cfg.range+20){e.meleeFacing=e.facing;enter(e,'attack_windup',cfg.windup);}else enter(e,detected?'approach':'patrol');}break;
 case 'attack_windup':e.facing=e.meleeFacing;if(!e.e7Timer){enter(e,'shield_bash',cfg.active);e.attackHit=false;}break;
 case 'shield_bash':
  e.facing=e.meleeFacing;e.vx=e.facing*cfg.bashSpeed;break;
 case 'vulnerable':
  e.vulnerableTimer=e.e7Timer;e.vx=e.hurtTimer>0?(e.facing*-25):0;
  if(!e.e7Timer){e.vulnerableTimer=0;enter(e,'return_to_guard',cfg.transition);e.attackCooldown=cfg.recovery+cfg.transition;}break;
 }
 // Respect the original encounter pocket, solid cover, floor edges and hazards.
 const dir=Math.sign(e.vx),ahead=e.x+e.w/2+dir*(e.w/2+6+Math.abs(e.vx)*dt);
 const supported=platforms.some(s=>!s.disabled&&ahead>=s.x&&ahead<=s.x+s.w&&Math.abs(s.y-e.y-e.h)<8);
 const unsafe=(world.map.hazards||[]).some(h=>ahead>=h.x-4&&ahead<=h.x+h.w+4&&e.y+e.h>h.y&&e.y<h.y+h.h);
 if(dir&&((e.grounded&&!supported)||unsafe)){e.vx=0;if(e.e7State==='patrol')e.facing*=-1;}
 const previous=e.x;moveBody(e,dt,platforms);
 const r=REGIONS[e.room];e.x=Math.max(r.x+40,e.patrolBounds.left,Math.min(r.x+r.width-e.w-40,e.patrolBounds.right-e.w,e.x));
 if(e.e7State==='patrol'&&dir&&e.x===previous)e.facing*=-1;e.moving=Math.abs(e.x-previous)>.01;
 if(e.e7State==='shield_bash'){
  const box=e7ShieldBox(e);
  if(!e.attackHit&&!platforms.some(s=>!s.disabled&&s.h>=70&&intersects(s,box))&&intersects(p,box)){
   hurt(p,e.damage,e.x+e.w/2,{source:'enemy_melee',entity:e.id,type:'hydraulic_shield_bash',x:box.x,y:box.y});e.attackHit=true;e.bashImpact=.12;
  }
  if(!e.e7Timer){enter(e,'vulnerable',cfg.vulnerable);e.vulnerableTimer=cfg.vulnerable;e.attackCooldown=cfg.vulnerable+cfg.recovery+cfg.transition;}
 }
}
export function drawE7(c,e,camera,renderer){
 const x=e.x+e.w/2-camera.x,y=e.y+e.h-camera.y;
 if(e.dead){if(e.deathTimer>0){c.save();c.globalAlpha=e.deathTimer/.75;renderer?.draw(c,'e7_shield','idle',e,0,{x,y});c.fillStyle='#a4adb0';for(let i=0;i<6;i++)c.fillRect(x+(i-3)*(1-e.deathTimer)*14,y-20-i*4,3,3);c.restore();}return true;}
 const cfg=settings(e),s=e.e7State;
 const transition=s==='guard_transition'||s==='return_to_guard';
 const guarding=['guard','attack_windup','shield_bash'].includes(s);
 const anim=transition?'idle_to_guard':guarding?'guard':e.moving&&s!=='vulnerable'?'walk':'idle';
 // Simulation controls frames, so rendering and pause never restart transitions.
 const frame=transition?Math.min(5,Math.floor(e.e7Time/cfg.transition*6)):anim==='walk'?Math.floor(e.e7Time*9)%8:0;
 const lean=s==='attack_windup'?-e.facing*2:s==='vulnerable'?e.facing*2:0;
 // Lean the complete pose about grounded feet; never offset the shield hitbox.
 c.save();if(lean){c.translate(x,y);c.transform(1,0,lean/70,1,0,0);c.translate(-x,-y);}
 const drawn=renderer?.draw(c,'e7_shield',anim,e,0,{x,y,frameOverride:frame});c.restore();
 const shield=e7ShieldBox(e),sx=shield.x-camera.x,sy=shield.y-camera.y;
 c.save();c.font='9px monospace';
 if(guarding){c.fillStyle='#ff4259';c.fillRect(sx+4,sy+4,5,3);}
 if(e.shieldFlash>0||s==='attack_windup'){
  c.strokeStyle=e.shieldFlash>0?'#ffe4a2':'#ff384c';c.lineWidth=2;c.strokeRect(sx,sy,shield.w,shield.h);
  if(s==='attack_windup'){c.fillStyle='#ffd6ae';c.fillText('! ESCUDO',x-26,y-80);}
 }
 if(e.bashImpact>0){c.strokeStyle='#fff0ba';c.strokeRect(sx-3,sy+12,shield.w+6,25);}
 if(e.e7Impact){const b=e.e7Impact,t=.2-b.time;c.fillStyle='#ffe3a0';for(let i=0;i<5;i++)c.fillRect(Math.round(b.x-camera.x+b.w/2+(i-2)*t*48),Math.round(b.y-camera.y+22+(i%2?1:-1)*t*70),2,2);c.fillText('BLOQUEADO',x-30,y-77);}
 if(s==='vulnerable'){
  c.fillStyle=Math.floor(e.e7Time*12)%2?'#ff4954':'#ffc392';c.fillRect(x-3,y-47,6,5);
  c.fillText('PRESSÃO BAIXA',x-36,y-80);c.fillStyle='#b9c2bd';
  for(let i=0;i<3;i++)c.fillRect(Math.round(x+e.facing*17+i*4),Math.round(y-32-((e.e7Time*25+i*5)%18)),3,3);
 }
 if(e.hurtTimer>0){c.fillStyle='#fff2d755';c.fillRect(e.x-camera.x,e.y-camera.y,e.w,e.h);}
 c.fillStyle='#111820';c.fillRect(x-17,y-e.h-7,34,3);c.fillStyle='#ed5670';c.fillRect(x-17,y-e.h-7,34*e.health/e.maxHealth,3);c.restore();return drawn;
}
