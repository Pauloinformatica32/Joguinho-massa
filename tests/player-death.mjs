import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Engine,newState} from '../js/engine.js';
import {AnimationManager} from '../js/engine/animationManager.js';
import {SpriteRenderer} from '../js/engine/spriteRenderer.js';
import {World} from '../js/world.js';
const cfg=JSON.parse(readFileSync('assets/characters/protagonist/config.json'));
const nodes=new Map();
globalThis.document={querySelector(id){if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{disabled:false,textContent:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}})}return nodes.get(id)}};
const screen=()=>document.querySelector('#death-screen');
let checks=0;const check=(value,message)=>{checks++;assert.ok(value,message)};
for(const fps of [30,60,120]){
 const e=Object.create(Engine.prototype),s=newState(),p=s.player;
 s.devTowerTest=true;s.checkpoint={...s.checkpoint,x:5390,y:733,name:'Teste'};
 Object.assign(e,{state:s,enemies:[],keys:new Set(['d','j']),pressed:new Set(['k']),animations:new AnimationManager(),assetLab:{toggle(){}},tower:{syncCamera(){}},camera:{update(){}},canvas:{width:960,height:540},ctx:{save(){},restore(){},translate(){},scale(){},drawImage(){}},assets:{getConfig:()=>cfg,get:()=>({naturalWidth:1160,naturalHeight:114})}});
 e.spriteRenderer=new SpriteRenderer(e.assets,e.animations);
 e.world={map:{platforms:[]},draw(c,canvas,camera,state,enemies,r){World.prototype.drawPlayer.call({},c,p,r.spriteRenderer,r.dt)}};
 for(let cycle=0;cycle<3;cycle++){
  p.health=0;p.dead=true;p.vx=250;p.vy=-210;p.attackTimer=p.dashTimer=.2;
  const cp=JSON.stringify(s.checkpoint),position=[p.x,p.y];
  e.beginPlayerDeath();World.prototype.drawPlayer.call({},e.ctx,p,e.spriteRenderer,0);
  check(e.deathStage==='animation'&&e.paused&&p.state==='death','stage A');
  check(screen().classList.contains('hidden')&&document.querySelector('#respawn-button').disabled,'screen and button blocked');
  check(p.vx===0&&p.vy===0&&!p.attackTimer&&!p.dashTimer&&!e.keys.size&&!e.pressed.size,'actions cancelled');
  check(e.respawn()===false&&p.dead,'early respawn rejected');
  const instance=e.animations.instances.get(p),frames=new Set([0]);let elapsed=0,lastAt=null;
  while(e.deathStage==='animation'){
   const remaining=e.deathAnimationTimer;e.beginPlayerDeath();check(e.deathAnimationTimer===remaining,'fatal event is idempotent');
   e.keydown('d');check(e.keys.size===0,'dead input ignored');
   e.renderPausedDeath(1/fps);elapsed+=1/fps;
   const a=e.animations.instances.get(p);frames.add(a.index);if(a.index===7&&lastAt===null)lastAt=elapsed;
   check(a===instance,'animation instance retained');
   check(p.x===position[0]&&p.y===position[1],'position frozen');
   if(elapsed<1.3-1e-8)check(screen().classList.contains('hidden'),'no early overlay');
  }
  check(frames.size===8,'all death frames');check(elapsed>=1.3-1e-8&&elapsed<1.3+1/fps+1e-8,'config duration plus hold');
  check(elapsed-lastAt>=.3-1/fps,'last frame held');
  check(!screen().classList.contains('hidden')&&!document.querySelector('#respawn-button').disabled,'stage B');
  e.respawn();check(!p.dead&&!e.paused&&e.deathStage===null&&!e.deathAnimationTimer,'respawn clears lifecycle');
  check(p.x===s.checkpoint.x&&p.y===s.checkpoint.y&&JSON.stringify(s.checkpoint)===cp,'checkpoint unchanged');
 }
}
// Duration is read from the current definition, not hardcoded to the present PNG.
const original=cfg.animations.death.fps;cfg.animations.death.fps=4;
const e=Object.create(Engine.prototype);Object.assign(e,{state:newState(),assets:{getConfig:()=>cfg},keys:new Set(),pressed:new Set(),animations:new AnimationManager(),assetLab:{toggle(){}}});
e.beginPlayerDeath();check(e.deathAnimationTimer===2.3,'alternate config FPS respected');cfg.animations.death.fps=original;
console.log(`PASS: ${checks} player death lifecycle checks (3 cycles at 30/60/120 FPS).`);
