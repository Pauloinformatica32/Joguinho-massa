import{findTransition}from'./level-traversal.js';
import assert from 'node:assert/strict';
import {buildMap,REGIONS,GROUND,factoryX} from '../js/map.js';
import {spawnEnemies,updateEnemies,industrialAttackBox} from '../js/enemies.js';
import {createPlayer,updatePlayer} from '../js/player.js';
import {Engine,newState} from '../js/engine.js';
import {normalizeSave} from '../js/save.js';
import {checkpointFor} from '../js/campaign.js';
import {Camera} from '../js/camera.js';
const map=buildMap(),world={map},pool=map.hazards.find(h=>h.kind==='coolant');
for(const fps of [30,60,120]){
 const dt=1/fps,p=createPlayer(),e=spawnEnemies().find(e=>e.type==='executor');
 p.x=e.x-40;p.y=GROUND-p.h;e.attackCooldown=0;
 updateEnemies([e],p,dt,world);assert.equal(p.health,100);assert.equal(e.e7State,'guard_transition');
 for(let i=0;i<fps*2;i++)updateEnemies([e],p,dt,world);
 assert.equal(p.health,100-e.damage);assert.equal(p.lastDamage.entity,e.id);assert.equal(p.lastDamage.source,'enemy_melee');
 p.health=100;p.invuln=0;p.y-=150;e.e7State='shield_bash';e.e7Timer=.2;e.attackHit=false;updateEnemies([e],p,dt,world);assert.equal(p.health,100);
 p.y=GROUND-p.h;
 const drone=spawnEnemies().find(e=>e.type==='drone');drone.attackCooldown=10;
 drone.projectiles=[{x:p.x,y:p.y,w:6,h:6,vx:0,vy:0,life:2,damage:8}];updateEnemies([drone],p,dt,world);assert.equal(p.health,92);assert.equal(p.lastDamage.source,'projectile');assert.equal(drone.projectiles.length,0);
 e.dead=true;e.respawn=30;e.projectiles=[{life:2}];updateEnemies([e],p,dt,world);assert.equal(e.projectiles.length,0);
 const fake={state:{player:p,abilities:{}},world,hazardTick:0,damagePlayer:Engine.prototype.damagePlayer};
 p.x=pool.x+20;p.y=GROUND-p.h;p.invuln=0;p.health=100;Engine.prototype.updateHazards.call(fake,dt);assert.equal(p.health,88);assert.equal(p.lastDamage.source,'hazard_pool');
 Engine.prototype.updateHazards.call(fake,dt);assert.equal(p.health,88);
 p.invuln=0;p.x=pool.x-p.w-1;fake.hazardTick=0;Engine.prototype.updateHazards.call(fake,dt);assert.equal(p.health,88);
 // Walk the full industrial floor using the actual movement/collision code.
 const q=createPlayer();q.x=2440;q.y=GROUND-q.h;let jumped=0;
 for(let t=0;t<fps*35&&q.x<4480;t++){
  const obstacle=map.platforms.find(s=>s.h>=70&&s.y<GROUND&&s.x>=q.x&&s.x-q.x<85);
  const jump=!!obstacle&&q.grounded;if(jump)jumped++;
  updatePlayer(q,{right:true,jump,platforms:map.platforms},dt,{doubleJump:true,dash:true});
 }
 assert.ok(q.x>=4480,'main route at '+fps+' '+JSON.stringify({x:q.x,y:q.y,jumped}));assert.ok(jumped>=4);
 const route=['factory-assembly','factory-log','factory-maintenance','factory-coolant-west'];
 for(let i=0;i<route.length-1;i++)assert.ok(findTransition(map,map.platforms.find(p=>p.id===route[i]),map.platforms.find(p=>p.id===route[i+1]),{fps,doubleJump:true,hook:false}), 'authored industrial catwalk '+route[i]);
}
for(const x of [2700,3980,4100,4710,4900,6500]){
 const old=newState();delete old.factoryLayout;old.bosses[0].dead=true;old.bosses[1].dead=x>=4800;old.player.x=x;old.player.y=736;old.checkpoint={x:3980,y:733,region:1};old.credits=123;
 const next=normalizeSave(old);assert.equal(next.player.x,factoryX(x));assert.equal(next.checkpoint.x,next.player.x>=5200?5390:4380);assert.equal(next.credits,123);assert.equal(normalizeSave(next).player.x,next.player.x);
}
assert.equal(checkpointFor(1,true).x,4380);assert.equal(REGIONS[1].width,2800);
const oldPoolSave=newState();delete oldPoolSave.factoryLayout;oldPoolSave.bosses[0].dead=true;oldPoolSave.player.x=3550;oldPoolSave.player.y=736;
assert.equal(normalizeSave(oldPoolSave).player.x,pool.x-42);
const cam=new Camera();for(let i=0;i<120;i++)cam.update({x:3650,y:340,w:30,h:54},960,540,7600,900,1/60);assert.ok(cam.x>3100&&cam.y<200);
console.log('PASS: factory damage, telegraphs, height, projectile consumption/death cleanup, pool boundaries, full floor route and optional platform jumps at 30/60/120 FPS; saves and camera.');
