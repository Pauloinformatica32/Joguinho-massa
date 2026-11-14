import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{spawnEnemies,updateEnemies}from'../js/enemies.js';
import{createPlayer,updatePlayer}from'../js/player.js';
import{playerDamage}from'../js/combat.js';
import{Engine}from'../js/engine.js';
import{buildMap}from'../js/map.js';
import{TOWER_ENEMY_SPECS as SPECS,TOWER_ENEMY_SLOTS,isTowerEnemy,resetTowerEnemy,updateTowerEnemy,towerAttackBox,towerBeamActive,clipTowerBeam,opticMuzzle,segmentRect,towerFrame}from'../js/tower-enemies.js';
let checks=0;const check=(name,ok)=>{checks++;assert.ok(ok,name)};
// Combat fixtures use a flat floor; encounter placement is checked against the real map below.
const make=id=>{const e=spawnEnemies().find(e=>e.assetId===id);e.y=e.homeY=790-e.h;return e};
const world={map:{platforms:[{x:5200,y:790,w:7400,h:110}]}};
const hero=e=>({...createPlayer(),x:e.x-35,y:736,health:100,maxHealth:100});
// Runtime assets are independent of the user's extracted source-package directory.
const approvedAssets=JSON.parse(readFileSync('tests/tower-enemy-assets.json'));
for(const id of Object.keys(SPECS)){
 const cfg=JSON.parse(readFileSync(`assets/enemies/${id}/config.json`));
 for(const [name,a]of Object.entries(cfg.animations)){
  const bytes=readFileSync(a.sheet);
  check(id+' '+name+' approved asset',createHash('sha256').update(bytes).digest('hex')===approvedAssets[a.sheet]);
  check(id+' '+name+' grid',bytes.readUInt32BE(16)===a.frameWidth*a.count&&bytes.readUInt32BE(20)===a.frameHeight&&a.columns===a.count);
  check(id+' '+name+' loops',a.loop===(name!=='attack'));
 }
}
const list=spawnEnemies();check('seven original slots',list.filter(isTowerEnemy).length===7&&TOWER_ENEMY_SLOTS.every(slot=>list.some(e=>e.id===slot.id&&e.assetId===slot.assetId)));
for(const fps of [30,60,120])for(const id of Object.keys(SPECS)){
 const e=make(id),p=hero(e);e.attackCooldown=99;p.x=e.x+450;
 if(id==='optic_s6'){e.y=e.homeY=670;p.y=736}
 updateTowerEnemy(e,p,1/fps,world);
 const phase=e.walkTime,frame=towerFrame(e);
 for(let i=0;i<20;i++)check('draw sampling does not advance phase '+id,towerFrame(e)===frame);
 // A stopped recovery must hold locomotion phase even as world/effect time advances.
 e.towerState='recovery';e.stateTime=0;e.moving=false;
 updateTowerEnemy(e,p,1/fps,world);
 check('idle recovery holds locomotion phase '+id,e.walkTime===phase);
 e.towerState=id==='optic_s6'?'tracking':'patrol';e.stateTime=0;
 updateTowerEnemy(e,p,1/fps,world);
 check('movement resumes phase without reset '+id,e.walkTime>phase);
}
check('industrial enemies preserved',list.find(e=>e.assetId==='m4').homeX===3070&&list.find(e=>e.assetId==='e7_shield').homeX===3770&&list.find(e=>e.assetId==='v3_drone').homeX===4290);
for(const fps of [30,60,120]){
 const dt=1/fps;
 for(const id of Object.keys(SPECS))for(const direction of [-1,1]){
  const e=make(id),p=hero(e),spec=SPECS[id];e.attackCooldown=0;e.facing=direction;e.meleeFacing=direction;
  // Keep test geometry clear, but retain real floor identity and collision.
  if(id==='optic_s6'){e.y=e.homeY=670;p.x=e.x+direction*100}
  else{p.x=e.x+direction*(id==='interceptor_i9'?30:90);p.y=e.y+e.h-p.h}
  let detectedActive=false,sawRecovery=false,firstDamage=null,hitFrame=null;
  for(let tick=0;tick<fps*3;tick++){
   p.invuln=Math.max(0,p.invuln-dt);updateEnemies([e],p,dt,world);
   const active=id==='optic_s6'?towerBeamActive(e):!!towerAttackBox(e,world.map.platforms);detectedActive ||= active;
   if(p.health<100&&firstDamage===null){firstDamage=tick*dt;hitFrame=towerFrame(e);check('damage on active frame '+id+' '+fps,active)}
   if(e.towerState==='recovery'){sawRecovery=true;break}
  }
  check(id+' hit '+direction+' '+fps,p.health===100-spec.damage);
  check(id+' window '+direction+' '+fps,hitFrame>=spec.impact&&hitFrame<spec.impact+spec.activeFrames&&firstDamage>=spec.warning+spec.impact/spec.fps-dt*2);
  check(id+' recovery '+fps,detectedActive&&sawRecovery&&e.attackCooldown>0);
  check('stops during recovery '+id,e.vx===0);
  if(id==='optic_s6')check('ceiling mount immobile',e.x===e.homeX&&e.y===e.homeY);
  // Repeat for a full swing with a high player: no entire-body or invisible hit.
  resetTowerEnemy(e);e.attackCooldown=0;e.facing=e.meleeFacing=direction;e.towerState='attack';e.pendingAttack=id;e.beam=id==='optic_s6'?{a:opticMuzzle(e),z:{x:p.x+direction*100,y:p.y+p.h/2},radius:4}:null;p.y=300;p.health=100;p.invuln=0;
  for(let tick=0;tick<Math.ceil(spec.frames/spec.fps*fps);tick++)updateTowerEnemy(e,p,dt,world);
  check('height-safe '+id+' '+fps,p.health===100);
  // Interrupting through the actual EMP path cancels every offensive window.
  resetTowerEnemy(e);e.towerState='attack';e.stateTime=spec.impact/spec.fps;e.pendingAttack=id;p.y=e.y;p.x=e.x-15;
  const fake={state:{abilities:{emp:true},player:{...p,energy:100},bosses:[]},enemies:[e],effects:{add(){}},ui:{toast(){}}};Engine.prototype.useImplant.call(fake);updateTowerEnemy(e,p,dt,world);
  check('EMP cancellation '+id+' '+fps,!towerAttackBox(e)&&!towerBeamActive(e)&&!e.beam);
  // Real melee consumes one hit and starts a clean death/fade.
  e.dead=false;e.health=1;e.hurtTimer=e.stunTimer=0;p.state='attack';p.attackTimer=.2;p.attackHitConsumed=false;p.combo=0;p.attackBox={...e};
  check('melee death '+id+' '+fps,playerDamage(p,e)&&e.dead);updateTowerEnemy(e,p,dt,world);
  check('death disables offense '+id+' '+fps,e.towerState==='death'&&!e.pendingAttack&&!e.beam&&!towerAttackBox(e)&&!towerBeamActive(e));
  e.respawn=.01;updateTowerEnemy(e,p,.02,world);check('respawn policy '+id+' '+fps,id==='optic_s6'?e.dead:!e.dead&&e.x===e.homeX&&e.y===e.homeY);
 }
 // Laboratory discharge can be escaped using the existing jump physics.
 const h=make('synaptic_h0'),p=hero(h);p.x=h.x-90;p.y=736;p.grounded=true;h.attackCooldown=0;
 const labWorld={map:{platforms:[{x:8800,y:790,w:3800,h:110}]}};
 for(let tick=0;tick<fps*1.5;tick++){updatePlayer(p,{jump:tick===Math.round(fps*.4),platforms:labWorld.map.platforms},dt,{doubleJump:true});updateTowerEnemy(h,p,dt,labWorld)}
 check('jump evades H0 '+fps,p.health===100);
 const optical=make('optic_s6'),dodger=hero(optical);dodger.x=optical.x-100;dodger.y=736;dodger.grounded=true;optical.attackCooldown=0;
 for(let tick=0;tick<fps*1.7;tick++){updatePlayer(dodger,{jump:tick===Math.round(fps*.65),platforms:world.map.platforms},dt,{doubleJump:true});updateTowerEnemy(optical,dodger,dt,world)}
 check('jump evades locked S6 ray '+fps,dodger.health===100);
 const interceptor=make('interceptor_i9'),jumper=hero(interceptor);jumper.x=interceptor.x-35;jumper.y=736;jumper.grounded=true;interceptor.attackCooldown=0;
 for(let tick=0;tick<fps*1.2;tick++){updatePlayer(jumper,{jump:tick===Math.round(fps*.3),platforms:world.map.platforms},dt,{doubleJump:true});updateTowerEnemy(interceptor,jumper,dt,world)}
 check('jump evades I9 blade '+fps,jumper.health===100);
 // Floor changes and respawn cancellation cannot leave a live ray behind.
 const camera=make('optic_s6'),far=hero(camera);camera.towerState='attack';camera.pendingAttack=camera.assetId;camera.beam={a:{x:0,y:0},z:{x:10,y:10}};far.x=9500;updateTowerEnemy(camera,far,dt,world);
 check('inactive floor clears camera '+fps,!camera.beam&&!camera.pendingAttack);
}
const clipped=clipTowerBeam({x:6000,y:700},{x:6500,y:700},[{x:6200,y:600,w:40,h:190}]);check('beam clipped by cover',clipped.z.x===6200);
check('beam segment precision',segmentRect(clipped.a,clipped.z,{x:6300,y:690,w:30,h:30})===null&&segmentRect(clipped.a,clipped.z,{x:6100,y:690,w:30,h:30})!==null);
const h=make('synaptic_h0');h.towerState='attack';h.pendingAttack=h.assetId;h.stateTime=.35;h.meleeFacing=1;const box=towerAttackBox(h,[{x:h.x+60,y:700,w:20,h:90}]);check('discharge clipped by cover',box.x+box.w===h.x+60);
const map=buildMap();check('cameras attach below actual decks',list.filter(e=>e.assetId==='optic_s6').every(e=>map.platforms.some(p=>e.y===p.y+p.h&&e.x>=p.x&&e.x+e.w<=p.x+p.w)));
check('H0 patrols supported by current lab decks',list.filter(e=>e.assetId==='synaptic_h0').every(e=>map.platforms.some(p=>p.y===e.y+e.h&&e.patrolBounds.left>=p.x&&e.patrolBounds.right+e.w<=p.x+p.w)));
console.log(`PASS: ${checks} tower enemy checks at 30/60/120 FPS.`);
