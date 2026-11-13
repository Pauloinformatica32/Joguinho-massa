import assert from 'node:assert/strict';
import {buildMap,WARDEN_ARENA as a,GROUND,WORLD_W,WORLD_H} from '../js/map.js';
import {createPlayer,updatePlayer} from '../js/player.js';
import {hookInRange,nearestHook,activateHook} from '../js/hook.js';
import {updateLevelPlatforms,resetLevelPlatforms} from '../js/level-platforms.js';
import {createBosses} from '../js/bosses.js';
import {resetWarden,updateWarden} from '../js/warden.js';
import {Engine,newState} from '../js/engine.js';
import {Camera} from '../js/camera.js';
for(const fps of [30,60,120]){
 const dt=1/fps,map=buildMap(),decks=map.platforms.filter(s=>s.wardenDeck),hooks=map.hookPoints.filter(h=>h.industrial);
 assert.equal(decks.length,3);assert.equal(hooks.length,2);
 for(const deck of [...decks,map.platforms.find(s=>s.id==='warden-approach')]){
  const p=createPlayer();Object.assign(p,{x:deck.x+deck.w/2-15,y:GROUND-p.h,grounded:true});
  let landed=false;
  for(let i=0;i<fps*2;i++){
   updatePlayer(p,{platforms:map.platforms,jump:i===0||(deck.y<690&&i===Math.round(fps*.3))},dt,{doubleJump:true});
   if(p.grounded&&Math.abs(p.y+p.h-deck.y)<1){landed=true;break;}
  }assert(landed,'reachable deck '+deck.id+' '+fps);
 }
 for(const h of hooks){
  const p=createPlayer();Object.assign(p,{x:h.x-15,y:GROUND-p.h,grounded:true});
  assert(hookInRange(p,h));assert.equal(nearestHook(p,map.hookPoints),h);
  assert(activateHook(p,h));assert.equal(h.cooldown,3);assert.equal(activateHook(p,h),false);
  let apex=0,landed=false;
  for(let i=0;i<fps*3;i++){
   updateLevelPlatforms(map,p,dt);updatePlayer(p,{platforms:map.platforms},dt,{doubleJump:true});
   apex=Math.max(apex,GROUND-p.y-p.h);if(i>fps*.3&&p.grounded)landed=true;
  }assert(apex>250);assert(landed,'hook returns to floor');assert(h.cooldown<.001);
 }
 // No permanent camping; platforms disappear and restore using existing timers.
 for(const deck of decks){
  const p=createPlayer();Object.assign(p,{x:deck.x+10,y:deck.y-p.h,grounded:true});
  for(let i=0;i<fps*.7;i++)updateLevelPlatforms(map,p,dt);
  assert(deck.disabled);assert(deck.y>GROUND-180,'phase2 waves hit platform occupants');
 }
 resetLevelPlatforms(map);assert(decks.every(d=>!d.disabled));assert(hooks.every(h=>h.cooldown===0));
 // Thin decks do not intercept either direction of Warden's floor charge.
 for(const facing of [-1,1]){
  const b=createBosses()[1];resetWarden(b);Object.assign(b,{active:true,phase:2,transformed:true,facing,wardenState:'charge',pattern:'charge',x:facing>0?a.left+10:a.right-74});
  const p=createPlayer();p.invuln=1e9;
  let frames=0;while(b.wardenState==='charge'&&frames++<fps*4)updateWarden(b,p,dt,{platforms:map.platforms});
  assert.equal(b.wardenState,'blast_warning');assert.equal(b.x,facing>0?a.right-b.w:a.left);assert.equal(b.y+b.h,GROUND);
 }
 // Use a real anchor to leave the chest laser band before its firing window.
 {
  resetLevelPlatforms(map);
  const b=createBosses()[1];resetWarden(b);Object.assign(b,{active:true,phase:2,transformed:true,facing:-1,wardenState:'windup',pattern:'discharge',timer:.5});
  const p=createPlayer(),h=hooks[0];Object.assign(p,{x:h.x-15,y:GROUND-p.h,grounded:true});
  activateHook(p,h);
  for(let i=0;i<fps;i++){updateLevelPlatforms(map,p,dt);updatePlayer(p,{platforms:map.platforms},dt,{doubleJump:true});updateWarden(b,p,dt,{platforms:map.platforms});}
  assert.equal(p.health,100,'hook dodges core laser');
 }
 const state=newState();state.bosses[0].dead=true;state.bosses[1].active=true;
 const fake={state,ui:{toast(){}},gateToast:-1};state.player.y=400;
 for(const x of [a.left-250,a.right+250]){state.player.x=x;Engine.prototype.checkGates.call(fake);assert(state.player.x>=a.left&&state.player.x+state.player.w<=a.right);}
 const camera=new Camera();camera.arena=a;camera.update({x:4800,y:480,w:30,h:54},960,540,WORLD_W,WORLD_H,1);
 for(const h of hooks){assert(h.x-camera.x>0&&h.x-camera.x<960);assert(h.y-54-camera.y>0&&h.y-camera.y<540);}
 console.log('PASS arena at '+fps+' FPS: every deck reachable, anchors/cooldown/landing, no camping, both wall charges, aerial locks, camera.');
}
