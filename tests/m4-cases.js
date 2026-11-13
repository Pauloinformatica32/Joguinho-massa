import {spawnEnemies,updateEnemies} from '../js/enemies.js';
import {M4_CLAW,m4AttackBox,drawM4} from '../js/m4.js';
import {playerDamage} from '../js/combat.js';
import {createPlayer} from '../js/player.js';
import {GROUND,buildMap} from '../js/map.js';

export function runM4Tests(config){
 const checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
 const world={map:{platforms:[{x:2400,y:GROUND,w:2800,h:110}]}};
 const fresh=()=>{const e=spawnEnemies().find(e=>e.assetId==='m4');e.attackCooldown=0;e.grounded=true;e.vx=e.vy=0;return e};
 const target=(e,side=1)=>{const p=createPlayer();p.x=e.x+e.w/2+side*40-p.w/2;p.y=GROUND-p.h;return p};
 check('one original maintenance spawn',spawnEnemies().filter(e=>e.type==='maintenance').length===1&&fresh().id==='1-600-maintenance'&&fresh().x===3070);
 check('M4 config and strike event match simulation',config.scale===1&&config.origin.x===64&&config.origin.y===96&&config.animations.attack.fps===M4_CLAW.fps&&config.animations.attack.events.some(e=>e.frame===M4_CLAW.impactFrame&&e.name==='strike'));
 for(const fps of [30,60,120]){
  const dt=1/fps;
  for(const side of [-1,1]){
   const e=fresh(),p=target(e,side);let hits=0,firstHit=null;const frames=new Set();
   updateEnemies([e],p,dt,world);const x=e.x;
   check('windup stops and locks facing '+fps+'/'+side,e.pendingAttack==='claw'&&e.vx===0&&e.facing===side&&p.health===100);
   const renderer={available:()=>true,animations:{reset(){}},draw(c,id,anim,t,delta,opts){if(anim==='attack')frames.add(opts.frameOverride);return true}};
   drawM4({},e,{x:0,y:0},renderer,0);
   for(let i=0;i<fps;i++){
    const before=p.health;p.invuln=0;updateEnemies([e],p,dt,world);
    if(p.health<before){hits++;firstHit??=e.clawTime;check('hit occurs on frame 3 '+fps+'/'+side,Math.floor(e.clawTime*10+1e-8)===3)}
    drawM4({},e,{x:0,y:0},renderer,dt);
    if(e.m4Phase)check('no sliding in attack/recovery '+fps+'/'+side,e.x===x&&e.vx===0);
   }
   check('six frames and one hit per claw '+fps+'/'+side,frames.size===6&&hits===1&&p.health===100-e.damage&&firstHit>=.3-1e-8&&firstHit<.4);
   check('inactive after impact and no projectiles '+fps+'/'+side,m4AttackBox(e)===null&&e.projectiles.length===0);
  }
  for(const dodge of ['jump','dash','leave','behind']){
   const e=fresh(),p=target(e);updateEnemies([e],p,dt,world);
   if(dodge==='jump')p.y-=100;
   if(dodge==='leave')p.x+=150;
   if(dodge==='behind')p.x=e.x-30;
   for(let i=0;i<fps*.9;i++){p.invuln=dodge==='dash'?1:0;updateEnemies([e],p,dt,world)}
   check('dodge via '+dodge+' '+fps,p.health===100);
  }
  const late=fresh(),p=target(late);p.x+=150;
  // Start nearby, then leave until the active frame has passed.
  const close=target(late);updateEnemies([late],close,dt,world);
  for(let i=0;i<Math.ceil(.45*fps);i++)updateEnemies([late],p,dt,world);
  Object.assign(p,{x:close.x,y:close.y,invuln:0});
  for(let i=0;i<fps*.3;i++)updateEnemies([late],p,dt,world);
  check('entering after active frame cannot be hit '+fps,p.health===100);
  for(const interrupt of ['stunTimer','hurtTimer']){
   const e=fresh(),q=target(e);updateEnemies([e],q,dt,world);e[interrupt]=.8;
   for(let i=0;i<fps*.6;i++)updateEnemies([e],q,dt,world);
   check(interrupt+' cancels claw '+fps,q.health===100&&!e.pendingAttack&&m4AttackBox(e)===null);
  }
  const dying=fresh(),q=target(dying);updateEnemies([dying],q,dt,world);
  const attacker={attackTimer:1,state:'attack',attackHitConsumed:false,attackBox:{...dying},facing:1,combo:0};
  dying.health=1;playerDamage(attacker,dying);dying.respawn=30;updateEnemies([dying],q,dt,world);
  let spriteCalls=0;const ctx={save(){},restore(){},fillRect(){}};
  drawM4(ctx,dying,{x:0,y:0},{available:()=>true,draw(){spriteCalls++}},dt);
  check('Kael kills M4; death cancels attack and sprite playback '+fps,dying.dead&&!dying.pendingAttack&&q.health===100&&spriteCalls===0);
  dying.respawn=0;updateEnemies([dying],q,dt,world);
  check('respawn resets claw '+fps,!dying.dead&&dying.health===48&&!dying.m4Phase&&!dying.pendingAttack);
  const wall=fresh(),far=target(wall);wall.x=3200;wall.homeX=3200;wall.attackCooldown=10;far.x=3400;
  const obstacle={map:{platforms:[...world.map.platforms,{x:3260,y:700,w:80,h:90}]}};
  for(let i=0;i<fps*2;i++)updateEnemies([wall],far,dt,obstacle);
  check('solid cover blocks movement '+fps,wall.x+wall.w<=3260&&wall.y+wall.h===GROUND&&!wall.moving);
  const blocked=fresh();blocked.x=3200;const victim=target(blocked);victim.x=3261;updateEnemies([blocked],victim,dt,obstacle);
  for(let i=0;i<fps;i++)updateEnemies([blocked],victim,dt,obstacle);
  check('claw cannot pass through cover '+fps,victim.health===100);
  const ledge=fresh();ledge.x=3000;ledge.homeX=3000;ledge.y=600-ledge.h;ledge.grounded=true;const below=target(ledge);below.x=3500;
  const upper={map:{platforms:[{x:2960,y:600,w:150,h:18,oneWay:true},...world.map.platforms]}};
  for(let i=0;i<fps*4;i++)updateEnemies([ledge],below,dt,upper);
  check('patrol respects ledges '+fps,ledge.y+ledge.h===600&&ledge.x>=2960&&ledge.x+ledge.w<=3110);
  const patrol=fresh(),distant=target(patrol);distant.x=3600;patrol.attackCooldown=10;
  for(let i=0;i<fps*8;i++)updateEnemies([patrol],distant,dt,world);
  check('small patrol area '+fps,Math.abs(patrol.x-patrol.homeX)<=123);
  const other=spawnEnemies().find(e=>e.type==='drone'),near=createPlayer();near.x=other.x-40;near.y=other.y;other.attackCooldown=0;
  updateEnemies([other],near,dt,{map:buildMap()});
  check('industrial drone delegates to V3 without changing M4 '+fps,other.pendingAttack==='suppression'&&other.assetId==='v3_drone'&&other.v3State==='warning');
 }
 return checks;
}
