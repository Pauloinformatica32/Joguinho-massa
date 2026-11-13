import {Engine,newState} from '../js/engine.js';
import {UI} from '../js/ui.js';
import {spawnEnemies,updateEnemies,renderEnemy} from '../js/enemies.js';
import {createPlayer,updatePlayer,attackBox} from '../js/player.js';
import {playerDamage,intersects} from '../js/combat.js';
import {resetV3,updateV3,v3Muzzle,v3Sensor,v3SegmentHit,drawV3} from '../js/v3-drone.js';
import {buildMap,GROUND,WARDEN_ARENA} from '../js/map.js';
import {runM4Tests} from './m4-cases.js';
import {runCombatTests} from './combat-cases.js';
import {runDashTests} from './dash-cases.js';
import {runExistingRegressions} from './e7-regressions.js';
const report=document.createElement('pre');report.id='v3-results';report.style.cssText='max-height:120px;overflow:auto';document.body.prepend(report);
const checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
try{
 const engine=new Engine(document.querySelector('#game'),newState(),new UI());
 await Promise.all([engine.assets.loadRegion('industrial'),engine.assets.loadRegion('slums')]);engine.applyAssetCollisionConfigs();
 const cfg=engine.assets.getConfig('v3_drone'),image=engine.assets.get(cfg.animations.idle.sheet);
 check('252x134 original PNG, one frame, quarter scale',image.naturalWidth===252&&image.naturalHeight===134&&cfg.animations.idle.count===1&&cfg.scale===.25);
 check('manifest and sprites load without errors',engine.assets.validate().length===0&&engine.assets.status().failed===0);
 const probe=document.createElement('canvas');probe.width=252;probe.height=134;const pc=probe.getContext('2d');pc.drawImage(image,0,0);const rgba=pc.getImageData(0,0,252,134).data;
 check('original transparency preserved',rgba.filter((v,i)=>i%4===3&&v===0).length===12652);
 const originals=spawnEnemies(),drone=originals.find(e=>e.assetId==='v3_drone');
 check('one original industrial drone slot',originals.filter(e=>e.type==='drone').length===1&&drone.id==='1-1480-drone'&&drone.x===4290&&drone.homeX===4290&&drone.y===660);
 check('normal enemy balance and collision',drone.health===30&&drone.damage===8&&drone.w===60&&drone.h===28);
 const loadedDrone=engine.enemies.find(e=>e.assetId==='v3_drone');check('asset collision application preserves airborne spawn',loadedDrone.x===4290&&loadedDrone.y===660&&loadedDrone.w===60&&loadedDrone.h===28);
 const world={map:buildMap()},fresh=()=>{const e=spawnEnemies().find(e=>e.assetId==='v3_drone');e.v3Config=cfg.combat;return e;};
 const target=e=>{const p=createPlayer();p.x=e.x+100;p.y=GROUND-p.h;return p;};
 const empty={map:{platforms:[]}};
 for(const fps of [30,60,120]){
  const dt=1/fps,e=fresh(),p=target(e);e.attackCooldown=0;const times=[],shotTimes=[],states=new Set();let clock=0,lastCount=0,lastX=e.x,lastY=e.y;
  for(let i=0;i<fps*5.4;i++){
   updateEnemies([e],p,dt,world);clock+=dt;states.add(e.v3State);
   if(e.v3State==='warning'&&e.v3Time<=dt)times.push(clock);
   if(e.v3TotalShots>lastCount){shotTimes.push(clock);check('visible muzzle origin '+fps,Math.abs(v3Muzzle(e).x-e.x-e.w/2)===17&&v3Muzzle(e).y===e.y+28.5);lastCount=e.v3TotalShots;}
   check('smooth bounded flight '+fps,Math.abs(e.x-lastX)<=dt*90&&Math.abs(e.y-lastY)<=dt*36&&e.x>=4260&&e.x+e.w<=4420&&e.y>=630&&e.y+e.h<=710);
   lastX=e.x;lastY=e.y;
  }
  check('full warning burst recovery reposition cycle '+fps,['warning','burst','recovery','reposition'].every(s=>states.has(s)));
  check('exactly three shots per completed burst '+fps,shotTimes.length>=6&&shotTimes.length%3===0);
  check('warning lasts .45 seconds '+fps,shotTimes[0]-times[0]>=.45-dt-1e-6);
  check('shot interval .16 seconds '+fps,Math.abs(shotTimes[1]-shotTimes[0]-.16)<=dt+1e-6&&Math.abs(shotTimes[2]-shotTimes[1]-.16)<=dt+1e-6);
  check('cooldown at least 2.5 seconds '+fps,shotTimes[3]-shotTimes[0]>=2.5-dt-1e-6);
  const patrol=fresh(),distant=target(patrol);distant.x=3500;const ys=[],xs=[];
  for(let i=0;i<fps*12;i++){updateEnemies([patrol],distant,dt,world);ys.push(patrol.y);xs.push(patrol.x);}
  check('patrol reaches both ends and visibly hovers '+fps,Math.min(...xs)<4263&&Math.max(...xs)>4357&&Math.max(...ys)-Math.min(...ys)>5&&patrol.projectiles.length===0);
  check('no overlap with platforms or Warden arena '+fps,!world.map.platforms.some(s=>!s.disabled&&intersects(patrol,s))&&patrol.x+patrol.w<WARDEN_ARENA.left);
  // Normal jump must reach the drone using the actual player physics/attack box.
  const reachable=fresh(),jumper=createPlayer();jumper.x=reachable.x-30;jumper.y=GROUND-jumper.h;jumper.grounded=true;jumper.facing=1;let hit=false;
  for(let i=0;i<fps*.9;i++){updatePlayer(jumper,{jump:i===0,platforms:world.map.platforms},dt,{});jumper.attackBox=attackBox(jumper);if(intersects(jumper.attackBox,reachable))hit=true;}
  check('drone reachable with normal jump melee '+fps,hit);
  const dying=fresh(),attacker=target(dying);dying.health=1;attacker.state='attack';attacker.attackTimer=.2;attacker.attackBox={...dying};attacker.combo=0;attacker.facing=1;
  dying.v3State='burst';dying.pendingAttack='suppression';dying.v3Aim={x:1,y:1};dying.projectiles=[{life:2}];
  check('normal melee kills V3 '+fps,playerDamage(attacker,dying)&&dying.dead);
  dying.respawn=30;updateEnemies([dying],attacker,dt,world);check('death clears firing and flight '+fps,dying.v3State==='death'&&!dying.pendingAttack&&!dying.v3Aim&&dying.projectiles.length===0&&dying.vx===0&&dying.deathTimer>0);
  dying.respawn=dt/2;updateEnemies([dying],attacker,dt,world);check('respawn restores airborne home and health '+fps,!dying.dead&&dying.health===30&&dying.x===4290&&dying.y===660&&dying.v3State==='patrol'&&dying.v3Shots===0&&dying.projectiles.length===0);
  const interrupted=fresh();interrupted.attackCooldown=0;const ip=target(interrupted);updateEnemies([interrupted],ip,dt,world);interrupted.pendingAttack=null;updateEnemies([interrupted],ip,dt,world);check('encounter cleanup cancels pending warning '+fps,interrupted.v3State==='recovery'&&interrupted.v3TotalShots===0);
 }
 // Collision uses the first visible contact, not just end-of-frame overlap.
 check('swept collision catches thin obstacles',v3SegmentHit(0,5,100,5,{x:45,y:0,w:2,h:10},3)===.42);
 for(const dodge of ['jump','dash','reposition']){
  const e=fresh(),p=target(e);e.attackCooldown=0;p.grounded=true;p.facing=1;
  for(let i=0;i<120;i++){
   const t=i/60;
   updatePlayer(p,{jump:dodge==='jump'&&i===20,dash:dodge==='dash'&&i===20,left:dodge==='reposition'&&t>=.25,platforms:world.map.platforms},1/60,{dash:true,doubleJump:true});
   updateEnemies([e],p,1/60,world);
  }
  check('actual player '+dodge+' evades marked burst',p.health===100&&e.v3TotalShots===3);
 }
 for(const scenario of ['hit','invulnerable','above','behind-cover','expired']){
  const e=fresh(),p=target(e);e.attackCooldown=10;p.x=4330;p.y=660;p.invuln=scenario==='invulnerable'?1:0;
  if(scenario==='above')p.y=540;
  e.projectiles=[{x:4290,y:666,w:6,h:6,vx:230,vy:0,damage:8,life:scenario==='expired'?.01:1}];
  const map={map:{platforms:scenario==='behind-cover'?[{x:4310,y:640,w:4,h:70}]:[]}};
  updateV3(e,p,.35,map);check(scenario+' accurate projectile outcome',p.health===(scenario==='hit'?92:100));
  if(scenario!=='above')check(scenario+' projectile consumed once',e.projectiles.length===0);
  p.invuln=0;updateV3(e,p,.1,map);check(scenario+' no repeated damage',p.health===(scenario==='hit'?92:100));
 }
 const wallDrone=fresh(),wallPlayer=target(wallDrone);wallDrone.attackCooldown=0;
 updateV3(wallDrone,wallPlayer,2,{map:{platforms:[{x:4370,y:600,w:8,h:190}]}});check('solid cover prevents targeting through wall',wallDrone.v3TotalShots===0);
 const cancelled=fresh(),far=target(cancelled);cancelled.projectiles=[{life:2}];cancelled.pendingAttack='suppression';far.x=2000;updateEnemies([cancelled],far,1/60,world);check('distance cleanup clears stale shots',cancelled.projectiles.length===0&&!cancelled.pendingAttack);
 const foreign={...fresh(),assetId:undefined,room:2,x:5600,homeX:5600,y:730,attackCooldown:0,projectiles:[]},fp=createPlayer();fp.x=5440;fp.y=730;updateEnemies([foreign],fp,1/60,world);check('foreign-region drone retains legacy behavior',foreign.projectiles.length===1&&foreign.projectiles[0].vx===-330&&!foreign.pendingAttack);
 const emp=fresh(),ep=target(emp);const fake={state:{player:{...ep,energy:100,x:emp.x},abilities:{emp:true},bosses:[]},enemies:[emp],effects:{add(){}},ui:{toast(){}}};Engine.prototype.useImplant.call(fake);updateEnemies([emp],ep,1/60,world);check('EMP death preserves existing respawn policy',emp.dead&&emp.respawn<8&&emp.v3State==='death'&&!emp.pendingAttack);
 checks.push(...runM4Tests(engine.assets.getConfig('m4')),...runCombatTests(engine.assets.getConfig('protagonist')),...await runExistingRegressions());check('dash regressions',runDashTests()>0);
 const atlas=document.createElement('canvas');atlas.width=1000;atlas.height=210;const c=atlas.getContext('2d');c.fillStyle='#20313b';c.fillRect(0,0,1000,210);document.querySelector('main').before(atlas);
 for(const [i,state] of ['patrol','warning','burst','hurt','death'].entries())for(const facing of [-1,1]){
  const e=fresh();e.v3State=state;e.x=30+i*195+(facing===1?80:0);e.y=75;e.facing=facing;e.v3Time=.2;e.v3Clock=1;if(state==='burst')e.v3Flash=.08;if(state==='hurt')e.hurtTimer=.2;if(state==='death'){e.dead=true;e.deathTimer=.5;}drawV3(c,e,{x:0,y:0},engine.spriteRenderer);c.fillStyle='#dbe7eb';c.font='12px monospace';c.fillText(state,e.x-4,145);
 }
 const actual=engine.enemies.find(e=>e.assetId==='v3_drone');actual.v3State='warning';actual.v3Time=.2;actual.pendingAttack='suppression';actual.v3Aim={x:4250,y:750};actual.windupTimer=.25;
 engine.state.player.x=4260;engine.state.player.y=GROUND-engine.state.player.h;engine.camera.x=3860;engine.camera.y=300;engine.debugCombat=true;document.querySelector('#title-screen').classList.add('hidden');engine.render(false);
 check('redraw and F3 cannot fire or advance warning',actual.v3TotalShots===0&&actual.v3Time===.2&&actual.v3State==='warning');
 report.textContent='PASS '+checks.length+' V3/regression checks\n'+checks.join('\n');
}catch(error){report.textContent='FAIL '+error.stack;console.error(error);}
