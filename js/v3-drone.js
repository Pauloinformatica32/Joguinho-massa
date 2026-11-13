import {hurt,intersects} from './combat.js';
import {REGIONS} from './map.js';

export const isV3=e=>e.assetId==='v3_drone';
export const V3_DEFAULTS=Object.freeze({detect:420,warning:.45,shots:3,shotInterval:.16,projectileSpeed:230,projectileLife:2.4,cooldown:2.5,recovery:.8,patrolSpeed:40,combatSpeed:52,hoverAmplitude:4});
const config=e=>({...V3_DEFAULTS,...e.v3Config});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function enter(e,state){e.v3State=e.state=state;e.v3Time=0;}
export function cancelV3(e){
 e.pendingAttack=null;e.windupTimer=0;e.v3Shots=0;e.v3Aim=null;e.v3Flash=0;e.vx=e.vy=0;
 enter(e,e.dead?'death':'patrol');e.attackCooldown=1.2;
}
export function resetV3(e,atSpawn=false){
 cancelV3(e);e.projectiles=[];e.v3Clock=0;e.v3TotalShots=0;
 if(atSpawn){e.x=e.homeX;e.y=e.homeY;e.hurtTimer=e.stunTimer=0;}
 e.v3BaseY=e.y;
}
export function shutdownV3(e){resetV3(e);e.attackCooldown=0;e.deathTimer=e.deathTimer||.75;}
export function v3Muzzle(e){return{x:e.x+e.w/2+e.facing*17,y:e.y+e.h/2+14.5};}
export function v3Sensor(e){return{x:e.x+e.w/2+e.facing*12,y:e.y+e.h/2+2.5};}

// Segment/slab collision returns the first contact time, including thin cover.
// Sweeping the visible 6x6 projectile prevents tunneling at low frame rates.
export function v3SegmentHit(ax,ay,bx,by,box,padding=0){
 let near=0,far=1;
 for(const [start,delta,min,max] of [[ax,bx-ax,box.x-padding,box.x+box.w+padding],[ay,by-ay,box.y-padding,box.y+box.h+padding]]){
  if(Math.abs(delta)<1e-9){if(start<min||start>max)return null;continue;}
  const a=(min-start)/delta,b=(max-start)/delta;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(near>far)return null;
 }
 return near;
}
function updateProjectiles(e,p,dt,platforms){
 for(const b of e.projectiles){
  const duration=Math.min(dt,b.life),ax=b.x+b.w/2,ay=b.y+b.h/2,bx=ax+b.vx*duration,by=ay+b.vy*duration;
  let cover=null;
  for(const solid of platforms){if(solid.disabled)continue;const t=v3SegmentHit(ax,ay,bx,by,solid,b.w/2);if(t!==null&&(cover===null||t<cover))cover=t;}
  const contact=p.dead?null:v3SegmentHit(ax,ay,bx,by,p,b.w/2);
  if(contact!==null&&(cover===null||contact<cover)){
   hurt(p,b.damage,ax,{source:'projectile',entity:e.id,type:'suppression_burst',x:ax+(bx-ax)*contact,y:ay+(by-ay)*contact});b.life=0;
  }else if(cover!==null)b.life=0;
  else{b.x=bx-b.w/2;b.y=by-b.h/2;b.life-=dt;}
 }
 e.projectiles=e.projectiles.filter(b=>b.life>0);
}
function fire(e,cfg){
 const muzzle=v3Muzzle(e),dx=e.v3Aim.x-muzzle.x,dy=e.v3Aim.y-muzzle.y,length=Math.hypot(dx,dy)||1;
 e.projectiles.push({x:muzzle.x-3,y:muzzle.y-3,w:6,h:6,vx:dx/length*cfg.projectileSpeed,vy:dy/length*cfg.projectileSpeed,life:cfg.projectileLife,damage:e.damage});
 e.v3Flash=.09;e.v3Shots++;e.v3TotalShots++;e.vx-=e.facing*16;
}
function moveFlight(e,dt,platforms){
 const oldX=e.x,oldY=e.y;
 e.x+=e.vx*dt;
 for(const s of platforms)if(!s.disabled&&intersects(e,s)){e.x=e.vx>0?s.x-e.w:s.x+s.w;e.vx=0;}
 e.y+=e.vy*dt;
 for(const s of platforms)if(!s.disabled&&intersects(e,s)){e.y=e.vy>0?s.y-e.h:s.y+s.h;e.vy=0;}
 const bounds=e.flightBounds,r=REGIONS[e.room];
 e.x=clamp(e.x,Math.max(bounds.left,r.x+40),Math.min(bounds.right-e.w,r.x+r.width-e.w-40));
 e.y=clamp(e.y,bounds.top,bounds.bottom-e.h);
 if(e.v3State==='patrol'&&Math.abs(e.x-oldX)<.001&&Math.abs(e.vx)>1)e.facing*=-1;
 e.moving=Math.abs(e.x-oldX)+Math.abs(e.y-oldY)>.001;
}
function stepV3(e,p,dt,world,cfg){
 const platforms=world.map.platforms;
 e.v3Clock+=dt;e.v3Time+=dt;e.v3Flash=Math.max(0,e.v3Flash-dt);e.attackCooldown=Math.max(0,e.attackCooldown-dt);
 const muzzle=v3Muzzle(e),dx=p.x+p.w/2-e.x-e.w/2;
 const detected=!p.dead&&Math.abs(dx)<cfg.detect&&Math.abs(p.y+p.h/2-e.y-e.h/2)<260;
 const target={x:p.x+p.w/2,y:p.y+p.h/2};
 const sight=detected&&!platforms.some(s=>!s.disabled&&v3SegmentHit(muzzle.x,muzzle.y,target.x,target.y,s,3)!==null);
 if(['warning','burst'].includes(e.v3State)&&!e.pendingAttack){enter(e,'recovery');e.v3Aim=null;}
 if(p.dead||e.stunTimer>0){
  if(e.pendingAttack){e.pendingAttack=null;e.windupTimer=0;e.v3Aim=null;enter(e,'recovery');}
  e.vx*=Math.exp(-12*dt);e.vy=0;
 }else{
  let desired=0;
  if(e.v3State==='patrol'||e.v3State==='reposition'){
   if(detected){e.facing=Math.sign(dx)||e.facing;e.v3State=e.state='reposition';desired=Math.abs(dx)>155?e.facing*cfg.combatSpeed:Math.abs(dx)<95?-e.facing*cfg.combatSpeed:0;}
   else{e.v3State=e.state='patrol';if(e.x<=e.flightBounds.left+2)e.facing=1;if(e.x+e.w>=e.flightBounds.right-2)e.facing=-1;desired=e.facing*cfg.patrolSpeed;}
   if(sight&&e.attackCooldown<=0){
    enter(e,'warning');e.pendingAttack='suppression';e.v3Aim=target;e.v3Shots=0;e.windupTimer=cfg.warning;e.attackCooldown=cfg.cooldown;desired=0;
   }
  }else if(e.v3State==='warning'){
   e.windupTimer=Math.max(0,cfg.warning-e.v3Time);
   if(e.v3Time+1e-9>=cfg.warning){enter(e,'burst');e.windupTimer=0;fire(e,cfg);}
  }else if(e.v3State==='burst'){
   if(e.v3Shots<cfg.shots&&e.v3Time+1e-9>=e.v3Shots*cfg.shotInterval)fire(e,cfg);
   if(e.v3Shots>=cfg.shots){enter(e,'recovery');e.pendingAttack=null;e.v3Aim=null;}
  }else if(e.v3State==='recovery'&&e.v3Time+1e-9>=cfg.recovery)enter(e,detected?'reposition':'patrol');
  e.vx+=(desired-e.vx)*(1-Math.exp(-7*dt));
  const hover=cfg.hoverAmplitude,bounds=e.flightBounds;
  const base=detected?clamp(p.y+p.h/2-60,bounds.top+hover,bounds.bottom-e.h-hover):e.homeY;
  e.v3BaseY+=(base-e.v3BaseY)*(1-Math.exp(-2*dt));
  const y=clamp(e.v3BaseY+Math.sin(e.v3Clock*2.5)*hover,bounds.top,bounds.bottom-e.h);
  e.vy=clamp((y-e.y)*7,-35,35);
 }
 moveFlight(e,dt,platforms);updateProjectiles(e,p,dt,platforms);
}
export function updateV3(e,p,dt,world){
 if(!e.v3State)resetV3(e);
 const cfg=config(e);
 // Fixed maximum step keeps the three shot deadlines and collision stable
 // when the browser supplies a long frame. Rendering never fires projectiles.
 for(let remaining=Math.max(0,dt);remaining>1e-9;){const step=Math.min(remaining,1/120);stepV3(e,p,step,world,cfg);remaining-=step;}
}
export function drawV3(c,e,camera,renderer){
 const x=e.x+e.w/2-camera.x,y=e.y+e.h/2-camera.y;
 c.save();c.imageSmoothingEnabled=false;
 if(e.dead){
  if(e.deathTimer>0){const t=.75-e.deathTimer;c.globalAlpha=Math.min(1,e.deathTimer/.3);for(let i=0;i<12;i++){const angle=i*Math.PI/6;c.fillStyle=i%3?'#a4a7a3':'#ffbd66';c.fillRect(Math.round(x+Math.cos(angle)*t*75),Math.round(y+Math.sin(angle)*t*60+t*t*80),i%3+2,3);}}
  c.restore();return true;
 }
 // Render the single original frame at its physical center, without skew,
 // rotations, frame fabrication or independent recoil offsets.
 const drawn=renderer?.draw(c,'v3_drone','idle',e,0,{x,y,frameOverride:0});
 const sensor=v3Sensor(e),muzzle=v3Muzzle(e),glow=2+Math.floor((Math.sin((e.v3Clock||0)*9)+1));
 c.fillStyle='#ff674d66';for(const [offset,dy] of [[-28,9],[15,15]])c.fillRect(Math.round(x-e.facing*offset-3),Math.round(y+dy),7,glow);
 if(e.v3State==='warning'){
  c.fillStyle=Math.floor(e.v3Time*14)%2?'#fff0b8':'#ff2947';c.fillRect(Math.round(sensor.x-camera.x-2),Math.round(sensor.y-camera.y-2),4,4);
  c.strokeStyle='#ff425b';c.strokeRect(Math.round(muzzle.x-camera.x-3),Math.round(muzzle.y-camera.y-3),6,6);
  c.fillStyle='#ffd8ad';c.font='9px monospace';c.fillText('! RAJADA',x-24,y-29);
 }
 if(e.v3Flash>0){c.fillStyle='#ff3753';c.fillRect(Math.round(muzzle.x-camera.x-4),Math.round(muzzle.y-camera.y-4),8,8);c.fillStyle='#ffe3a8';c.fillRect(Math.round(muzzle.x-camera.x-1),Math.round(muzzle.y-camera.y-1),2,2);}
 if(e.hurtTimer>0){c.fillStyle='#ffe8a3';for(let i=0;i<4;i++)c.fillRect(Math.round(x+(i-2)*8),Math.round(y-8-i*2-(.22-e.hurtTimer)*20),2,2);}
 c.fillStyle='#111820';c.fillRect(x-20,y-24,40,3);c.fillStyle='#ed5670';c.fillRect(x-20,y-24,40*e.health/e.maxHealth,3);
 for(const b of e.projectiles){c.fillStyle='#f72f4c';c.fillRect(Math.round(b.x-camera.x),Math.round(b.y-camera.y),b.w,b.h);c.fillStyle='#ffcfb0';c.fillRect(Math.round(b.x-camera.x+2),Math.round(b.y-camera.y+2),2,2);}
 c.restore();return drawn;
}
