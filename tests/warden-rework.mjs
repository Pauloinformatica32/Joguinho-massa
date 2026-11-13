import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPlayer,updatePlayer} from '../js/player.js';
import {createBosses,updateBoss} from '../js/bosses.js';
import {resetWarden,updateWarden,wardenCore,wardenHammerImpact,wardenFrame,beamHits,WARDEN_COMBAT as C} from '../js/warden.js';
import {GROUND,buildMap} from '../js/map.js';
import {intersects} from '../js/combat.js';
const config=JSON.parse(readFileSync(new URL('../assets/bosses/warden/config.json',import.meta.url)));
// Flat-floor attack benchmarks; arena routes are covered by warden-arena.mjs.
const platforms=buildMap().platforms.filter(s=>!s.wardenDeck),context={platforms,config};
const make=(phase,pattern,facing=-1)=>{const b=createBosses()[1];resetWarden(b);Object.assign(b,{active:true,phase,transformed:phase===2,pattern,facing,wardenState:'windup',timer:1.15,x:4800});return b;};
const player=()=>{const p=createPlayer();return Object.assign(p,{x:4600,y:GROUND-p.h,grounded:true});};
const results=[];
for(const fps of [30,60,120]){
 const dt=1/fps;let normal=0,double=0,bestSecond=0;
 for(let second=-1;second<fps*.6;second++){
  const p=player();let peak=0;for(let i=0;i<fps*1.4;i++){updatePlayer(p,{platforms,jump:i===0||i===second},dt,{doubleJump:true});peak=Math.max(peak,GROUND-p.y-p.h);}
  if(second===-1)normal=peak;else if(peak>double){double=peak;bestSecond=second;}
 }
 assert(normal>C.waveHeight1&&normal<C.waveHeight2);assert(double>C.waveHeight2);
 const windows=[];
 for(const phase of [1,2])for(const facing of [-1,1]){
  const b=make(phase,'slam',facing),p=player();p.invuln=99;
  while(b.wardenState==='windup'){assert.equal(b.waves.length,0);updateBoss(b,p,dt,context);}
  assert.equal(wardenFrame(b),phase===2?4:3);assert.equal(b.waves.length,2);
  const impact=wardenHammerImpact(b,config);assert.equal(b.impact.x,impact.x);
  const initial=b.waves.find(q=>Math.sign(q.vx)===facing);
  assert.equal(initial.y+initial.h,GROUND);assert.equal(initial.h,phase===2?180:100);
  // Search encounter times with real input/movement, no dash or invulnerability.
  // Player runs towards the approaching crest; phase 2 uses an apex double jump.
  let successes=[],normalSuccess=0;
  for(let k=12;k<=100;k++){
   const encounter=k/100;
   for(const useDouble of phase===2?[false,true]:[false]){
    const p=player();p.vx=-facing*250;
    const q={...initial,hit:false};
    q.x=p.x+p.w/2-facing*(Math.abs(q.vx)+250)*encounter-q.w/2;
    let collided=false,overlapped=false;
    for(let i=0;i<fps*1.2;i++){
     updatePlayer(p,{platforms,jump:i===0||(useDouble&&i===bestSecond),left:facing>0,right:facing<0},dt,{doubleJump:true});
     q.x+=q.vx*dt;
     if(p.x<q.x+q.w&&p.x+p.w>q.x){overlapped=true;if(intersects(p,q))collided=true;}
    }
    if(overlapped&&!collided){if(useDouble||phase===1)successes.push(encounter);else normalSuccess++;}
   }
  }
  assert(successes.length>=3,'reasonable jump timing window '+fps+' phase '+phase);
  if(phase===2)assert.equal(normalSuccess,0,'normal jump cannot clear phase 2');
  // Standing/low trajectories intersect the visible moving volume.
  const low=player();low.x=initial.x;assert(intersects(low,initial));
  windows.push({phase,facing,earliest:Math.min(...successes),latest:Math.max(...successes)});
 }
 for(const facing of [-1,1]){
  const b=make(2,'discharge',facing),p=player();p.x=facing<0?b.x-150:b.x+150;
  for(let i=0;i<fps*.5;i++)updateBoss(b,p,dt,context);
  assert.equal(p.health,100);const q=b.laser,core=wardenCore(b,config);
  assert.deepEqual(q.a,core);assert.equal(q.a.y,q.z.y);
  assert.equal(q.z.x,facing>0?b.arena.right:b.arena.left);
  assert.equal(q.y,core.y-C.laserAbove);assert.equal(q.h,C.laserAbove+C.laserBelow);
  assert(beamHits(p,q),'standing threatened');
  const locked=JSON.stringify(q);p.x+=20;updateBoss(b,p,dt,context);assert.equal(JSON.stringify(b.laser),locked);
  while(b.wardenState==='windup')updateBoss(b,p,dt,context);
  updateBoss(b,p,dt,context);assert.equal(p.health,78);p.invuln=0;updateBoss(b,p,dt,context);assert.equal(p.health,78);
  while(b.wardenState==='laser')updateBoss(b,p,dt,context);
  assert.equal(b.laser,null);assert.equal(b.offense.length,0);
  // Jump started .25s before firing clears the chest-height band for its full duration.
  const dodge=make(2,'discharge',facing),j=player();j.x=facing<0?dodge.x-150:dodge.x+150;
  while(dodge.timer>.25)updateBoss(dodge,j,dt,context);
  let i=0;while(['windup','laser'].includes(dodge.wardenState)){
   updatePlayer(j,{platforms,jump:i++===0},dt,{doubleJump:true});updateBoss(dodge,j,dt,context);
  }assert.equal(j.health,100,'normal jump over chest laser');
  dodge.dead=true;updateWarden(dodge,j,dt,context);assert(!dodge.laser&&!dodge.laserFade&&!dodge.waves.length);
 }
 const b=make(2,'charge'),p=player();p.invuln=99;b.timer=0;b.x=b.arena.right-b.w-10;
 updateBoss(b,p,dt,context);let steps=0;
 while(b.wardenState==='charge'&&steps++<fps*4)updateBoss(b,p,dt,context);
 assert(steps>fps*.68);assert.equal(b.x,b.arena.left);assert.equal(b.wardenState,'blast_warning');
 const blast=b.blast;while(b.wardenState==='blast_warning')updateBoss(b,p,dt,context);
 assert.equal(b.blast,blast);while(b.wardenState==='blast')updateBoss(b,p,dt,context);
 assert(!b.blast&&b.timer>1.3);
 results.push({fps,normal,double,secondJump:bestSecond/fps,windows});
}
console.log(JSON.stringify(results,null,2));
console.log('PASS giant waves, actual jump trajectories, core laser both directions, charge/blast, death cleanup.');
