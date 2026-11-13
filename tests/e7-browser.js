import {Engine,newState} from '../js/engine.js';
import {UI} from '../js/ui.js';
import {spawnEnemies,updateEnemies,renderEnemy} from '../js/enemies.js';
import {createPlayer} from '../js/player.js';
import {playerDamage,hurt,intersects} from '../js/combat.js';
import {E7_DEFAULTS,resetE7,damageE7,e7AttackBox,e7ShieldBox,drawE7} from '../js/e7-shield.js';
import {runM4Tests} from './m4-cases.js';
import {runCombatTests} from './combat-cases.js';
import {runDashTests} from './dash-cases.js';
import {buildMap,GROUND,WARDEN_ARENA} from '../js/map.js';
const report=document.createElement('pre');report.id='e7-results';report.style.cssText='max-height:110px;overflow:auto';document.body.prepend(report);
const checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
try{
 const engine=new Engine(document.querySelector('#game'),newState(),new UI());
 await Promise.all([engine.assets.loadRegion('industrial'),engine.assets.loadRegion('slums')]);engine.applyAssetCollisionConfigs();
 const cfg=engine.assets.getConfig('e7_shield');
 check('all registered assets load without errors / 404 / invalid grids',engine.assets.status().failed===0&&engine.assets.validate().length===0);
 const original=spawnEnemies().find(e=>e.type==='executor');
 check('single existing executor id and original placement',original.id==='1-1150-executor'&&original.x===3770&&original.y+original.h===GROUND&&spawnEnemies().filter(e=>e.assetId==='e7_shield').length===1);
 const atlas=document.createElement('canvas');atlas.width=1280;atlas.height=620;document.querySelector('main').before(atlas);const c=atlas.getContext('2d');c.fillStyle='#20313b';c.fillRect(0,0,1280,620);c.imageSmoothingEnabled=false;
 for(const [row,key] of ['idle','walk','idle_to_guard','guard'].entries()){
  const def=cfg.animations[key],img=engine.assets.get(def.sheet);
  check(key+' verified dimensions',img.naturalWidth===def.frameWidth*def.count&&img.naturalHeight===def.frameHeight&&!def.invalid);
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const pc=canvas.getContext('2d');pc.drawImage(img,0,0);const pixels=pc.getImageData(0,0,canvas.width,canvas.height).data;
  check(key+' PNG transparency',pixels[3]===0);
  for(let i=0;i<def.count;i++){
   let top=999,bottom=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<def.frameWidth;x++)if(pixels[(y*canvas.width+i*def.frameWidth+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   check(key+' frame '+i+' grounded and coherent scale',(bottom+1===(key==='walk'?122:116)||key==='walk'&&bottom+1===121)&&(bottom-top+1)>=74&&(bottom-top+1)<=84);
   c.fillStyle='#dae4e5';c.font='12px monospace';c.fillText(key+' '+i,10+i*155,18+row*125);c.fillStyle='#4b8f88';c.fillRect(8+i*155,115+row*125,145,1);
   engine.spriteRenderer.draw(c,'e7_shield',key,{},0,{x:77+i*155,y:115+row*125,frameOverride:i});
  }
 }
 check('real sheets only; no invented attack or vulnerable assets',!cfg.animations.attack&&!cfg.animations.vulnerable&&cfg.nativeFacing===-1);
 const a={},frames=new Set();for(let i=0;i<8;i++){engine.animations.play(a,'walk',cfg.animations.walk,i?1/9:0);frames.add(engine.animations.instances.get(a).index);}check('walk plays every frame',frames.size===8);
 const b={},transition=new Set();for(let i=0;i<6;i++){transition.add(engine.animations.play(b,'idle_to_guard',cfg.animations.idle_to_guard,i?.100001:0).index);}check('transition plays six frames once and holds last',transition.size===6&&engine.animations.play(b,'idle_to_guard',cfg.animations.idle_to_guard,2).index===5);
 const world={map:buildMap()},fresh=()=>{const e=spawnEnemies().find(e=>e.assetId==='e7_shield');e.e7Config=cfg.combat;e.grounded=true;return e;};
 const target=e=>{const p=createPlayer();p.x=e.x-40;p.y=GROUND-p.h;return p;};
 const strike=(e,p)=>{p.state='attack';p.attackTimer=.2;p.combo=0;p.attackHitConsumed=false;p.externalAttackAnimation=false;p.attackBox={...e};return playerDamage(p,e);};
 for(const fps of [30,60,120]){
  const dt=1/fps,e=fresh(),p=target(e);let elapsed=0,seen=new Set(),guardStart=0,bashStart=0,vStart=0,windup=0;
  for(let i=0;i<fps*4;i++){
   p.invuln=0;const before=e.e7State;updateEnemies([e],p,dt,world);elapsed+=dt;seen.add(e.e7State);
   if(e.e7State==='guard_transition'){check('transition blocks damage '+fps,!strike(e,p)&&e.health===90);}
   if(e.e7State==='guard'&&before!=='guard'){guardStart=elapsed;check('transition completes before guard '+fps,elapsed>=.6);check('guard blocks melee and feedback '+fps,!strike(e,p)&&e.health===90&&e.shieldFlash>0&&!!e.e7Impact);check('guard blocks generic ranged damage '+fps,!hurt(e,50,p.x,{source:'projectile'})&&e.health===90);
    const emp={state:{abilities:{emp:true},bosses:[],player:{...p,energy:100}},enemies:[e],effects:{add(){}},ui:{toast(){}}};Engine.prototype.useImplant.call(emp);check('guard blocks actual EMP '+fps,e.health===90&&e.stunTimer===0);}
   if(e.e7State==='attack_windup'&&before!=='attack_windup'){windup=elapsed;p.x=e.x-40;}
   if(e.e7State==='shield_bash'&&before!=='shield_bash'){bashStart=elapsed;check('clear windup '+fps,bashStart-windup>=.4-dt);}
   if(e.e7State==='shield_bash'){check('shield sized single attack '+fps,e7AttackBox(e).w===12&&e7AttackBox(e).h===50);check('no damage outside vulnerable '+fps,!damageE7(e,1)&&e.health===90);}
   if(e.e7State==='vulnerable'&&before!=='vulnerable'){
    vStart=elapsed;check('bash duration '+fps,elapsed-bashStart>=.2-dt);check('one bash hit only '+fps,p.health>=78&&p.health<=100);check('vulnerable disables offense '+fps,!e7AttackBox(e));
    check('normal counterattack works '+fps,strike(e,p)&&e.health===72);check('hit preserves vulnerability '+fps,e.e7State==='vulnerable'&&e.vulnerableTimer>.79);
   }
   if(e.e7State==='return_to_guard'){check('full vulnerable window '+fps,elapsed-vStart>=.8-dt);break;}
  }
  check('complete readable cycle '+fps,['guard_transition','guard','attack_windup','shield_bash','vulnerable','return_to_guard'].every(s=>seen.has(s)));
  for(let i=0;i<fps;i++)updateEnemies([e],p,dt,world);check('guard recovers '+fps,['guard','attack_windup'].includes(e.e7State));
  for(const dodge of ['jump','dash','retreat']){
   const q=fresh(),v=target(q);q.e7State=q.state='shield_bash';q.meleeFacing=q.facing=-1;q.e7Timer=.2;q.attackHit=false;
   if(dodge==='jump')v.y-=100;else if(dodge==='dash'){v.invuln=.3;}else v.x-=150;
   for(let i=0;i<fps*.2+1;i++)updateEnemies([q],v,dt,world);
   check(dodge+' evades bash '+fps,v.health===100);
  }
  const q=fresh(),v=target(q);q.e7State='shield_bash';q.e7Timer=.2;q.meleeFacing=-1;q.facing=-1;let hits=0;
  for(let i=0;i<fps*.2+2;i++){const box=e7ShieldBox(q);v.x=box.x;v.y=box.y;v.invuln=0;const hp=v.health;updateEnemies([q],v,dt,world);if(v.health<hp)hits++;}check('same bash never hits twice '+fps,hits===1);
  q.e7State='vulnerable';q.vulnerableTimer=q.e7Timer=.8;damageE7(q,999);check('death clears defense offense timers and movement '+fps,q.dead&&q.e7State==='death'&&!e7AttackBox(q)&&q.vx===0&&q.vulnerableTimer===0&&q.e7Timer===0&&!q.e7Impact);
  q.respawn=dt/2;updateEnemies([q],v,dt,world);check('respawn fully resets '+fps,!q.dead&&q.health===90&&q.e7State==='patrol'&&q.x===q.homeX&&q.vulnerableTimer===0&&!e7AttackBox(q));
  const patrol=fresh(),far=target(patrol);far.x=3900;far.y=400;for(let i=0;i<fps*8;i++)updateEnemies([patrol],far,dt,world);
  check('patrol stays inside safe encounter pocket '+fps,patrol.x>=3720&&patrol.x+patrol.w<=3860&&patrol.y+patrol.h===790);
 }
 const normal=spawnEnemies().find(e=>e.assetId==='m4'),p=createPlayer();check('other enemy still takes normal melee',strike(normal,p)&&normal.health===normal.maxHealth-18);
 const shieldOnly=fresh();shieldOnly.e7State='guard';p.state='attack';p.attackTimer=.2;p.attackHitConsumed=false;p.attackBox=e7ShieldBox(shieldOnly);
 check('visible shield alone intercepts melee',!intersects(p.attackBox,shieldOnly)&&!playerDamage(p,shieldOnly)&&p.attackHitConsumed&&shieldOnly.shieldFlash>0);
 p.attackHitConsumed=false;p.attackBox={...shieldOnly};p.facing=-shieldOnly.facing;check('rear attacks cannot bypass defense',!playerDamage(p,shieldOnly)&&shieldOnly.health===90);
 shieldOnly.e7State='vulnerable';shieldOnly.e7Timer=shieldOnly.vulnerableTimer=.8;check('generic ranged damage works when vulnerable',hurt(shieldOnly,10,0,{source:'projectile'})&&shieldOnly.health===80);
 const emp={state:{abilities:{emp:true},bosses:[],player:{...p,x:shieldOnly.x,energy:100}},enemies:[shieldOnly],effects:{add(){}},ui:{toast(){}}};Engine.prototype.useImplant.call(emp);check('EMP works when vulnerable without closing window',shieldOnly.health===48&&shieldOnly.e7State==='vulnerable'&&shieldOnly.vulnerableTimer===.8);
 checks.push(...runM4Tests(engine.assets.getConfig('m4')),...runCombatTests(engine.assets.getConfig('protagonist')));check('dash regressions',runDashTests()>0);
 check('Warden arena preserved',WARDEN_ARENA.left===4490&&WARDEN_ARENA.right===5160);
 const {runExistingRegressions}=await import('./e7-regressions.js');checks.push(...await runExistingRegressions());
 // Both directions and all combat poses, using the actual render path.
 for(const [i,state] of ['patrol','guard_transition','guard','attack_windup','shield_bash','vulnerable'].entries())for(const facing of [-1,1]){
  const e=fresh();e.e7State=state;e.e7Time=.4;e.facing=facing;e.x=30+i*205+(facing===1?85:0);e.y=570-e.h;e.vulnerableTimer=.8;drawE7(c,e,{x:0,y:0},engine.spriteRenderer);c.fillStyle='#dbe7eb';c.fillText(state,e.x-10,600);
 }
 engine.state.player.x=3740;engine.state.player.y=GROUND-engine.state.player.h;engine.camera.x=3380;engine.camera.y=300;engine.debugCombat=true;engine.enemies.find(e=>e.assetId==='e7_shield').e7State='guard';document.querySelector('#title-screen').classList.add('hidden');engine.render(false);
 report.textContent='PASS '+checks.length+' checks\n'+checks.join('\n');
}catch(error){report.textContent='FAIL '+error.stack;console.error(error);}
