import assert from 'node:assert/strict';
import {createBosses} from '../js/bosses.js';
import {updateWarden,resetWarden,clearWarden,transitionWarden,selectWardenPhase2Attack,wardenAttackState} from '../js/warden.js';
import {buildMap,GROUND} from '../js/map.js';
let seed=18721;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const platforms=buildMap().platforms,totals={slam:0,discharge:0,charge:0};
for(const fps of [30,60,120]){
 const b=createBosses()[1];assert.deepEqual(Object.fromEntries(Object.keys(wardenAttackState()).map(k=>[k,b[k]])),wardenAttackState());
 resetWarden(b);Object.assign(b,{active:true,phase:2,transformed:true});
 const p={x:b.x-150,y:GROUND-54,w:30,h:54,health:100,invuln:1e9};
 let count=0,time=0,lastChargeEnd=-Infinity,between=new Set(),haveCharged=false,last=null,lastWindup=false;
 const counts={slam:0,discharge:0,charge:0};
 for(let frame=0;frame<fps*2500&&count<150;frame++){
  // Alternate close, medium and far targets on either side; include >285-unit distances.
  const offsets=[70,-150,500,-500];p.x=Math.max(b.arena.left,Math.min(b.arena.right-p.w,b.x+offsets[count%4]));
  const cooldown=b.chargeCooldown,previous=b.wardenState;
  updateWarden(b,p,1/fps,{platforms,random});time+=1/fps;
  if(previous==='blast'&&b.wardenState==='recovery'){lastChargeEnd=time;assert.equal(b.chargeCooldown,10);}
  if(b.wardenState==='windup'&&!lastWindup){
   const attack=b.pattern;count++;counts[attack]++;totals[attack]++;
   if(attack==='charge'){
    assert.notEqual(last,'charge');assert(cooldown<=1/fps+1e-8,'no cooldown bypass');
    if(haveCharged){assert(between.has('slam')&&between.has('discharge'),'two distinct noncharges');assert(time-lastChargeEnd>=10-1/fps-1e-8,'10 seconds after explosion');}
    haveCharged=true;between.clear();
   }else between.add(attack);
   last=attack;
  }
  lastWindup=b.wardenState==='windup';
 }
 assert.equal(count,150,'no deadlock');assert(counts.slam>40&&counts.discharge>35&&counts.charge>0&&counts.charge<40);
 // Lifecycle reset (creation checked above).
 transitionWarden(Object.assign(b,{transformed:false,health:100}));assert.equal(b.chargeCooldown,0);assert.deepEqual(b.recentAttacks,[]);
 b.chargeCooldown=10;resetWarden(b);assert.equal(b.chargeCooldown,0);assert.equal(b.chargeHasOccurred,false);
 b.chargeCooldown=10;clearWarden(b);assert.equal(b.chargeCooldown,0);assert.deepEqual(b.nonChargeSinceCharge,[]);
 console.log(fps+' FPS, 150 complete attack selections:',counts);
}
// Measure unconstrained eligible weights independently, then blocked-charge normalization.
for(const blocked of [false,true]){
 const counts={slam:0,discharge:0,charge:0};
 for(let i=0;i<20000;i++){const b=wardenAttackState();if(blocked)b.chargeCooldown=10;counts[selectWardenPhase2Attack(b,random)]++;}
 const expected=blocked?{slam:.5625,discharge:.4375,charge:0}:{slam:.45,discharge:.35,charge:.2};
 for(const k of Object.keys(counts))assert(Math.abs(counts[k]/20000-expected[k])<.02);
 console.log(blocked?'Charge blocked:':'All eligible:',counts);
}
// Time expiry alone never permits another charge without BOTH alternative attacks.
const b=wardenAttackState();assert.equal(selectWardenPhase2Attack(b,()=>.99),'charge');
for(let i=0;i<10;i++)assert.equal(selectWardenPhase2Attack(b,()=>0),'slam');
assert.equal(selectWardenPhase2Attack(b,()=>.99),'discharge');
assert.equal(selectWardenPhase2Attack(b,()=>.99),'charge');
console.log('PASS: 450 live selections, 40000 weighted samples, distance, cooldown, distinct spacing, reset, no deadlocks.',totals);
