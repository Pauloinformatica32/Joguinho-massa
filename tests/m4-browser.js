import {Engine,newState} from '../js/engine.js';
import {UI} from '../js/ui.js';
import {runM4Tests} from './m4-cases.js';
import {runCombatTests} from './combat-cases.js';
import {runDashTests} from './dash-cases.js';
import {spawnEnemies,updateEnemies,renderEnemy} from '../js/enemies.js';
import {m4AttackBox,drawM4} from '../js/m4.js';
import {GROUND,WARDEN_ARENA} from '../js/map.js';

const report=document.createElement('pre');report.id='m4-results';report.style.cssText='max-height:110px;overflow:auto';document.body.prepend(report);
const checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
try{
 const e=new Engine(document.querySelector('#game'),newState(),new UI());
 await Promise.all([e.assets.loadRegion('industrial'),e.assets.loadRegion('slums')]);e.applyAssetCollisionConfigs();
 const cfg=e.assets.getConfig('m4'),m=e.enemies.find(e=>e.assetId==='m4');
 checks.push(...runM4Tests(cfg));
 check('industrial assets loaded without errors',e.assets.status().failed===0&&e.assets.validate().length===0);
 check('M4 collision config applied without moving spawn',m.x===3070&&m.y+m.h===GROUND&&m.w===38&&m.h===60);
 const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=330;atlas.style.cssText='display:block;margin:auto;max-width:100%;image-rendering:pixelated';
 const ctx=atlas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#182b35';ctx.fillRect(0,0,1024,330);
 for(const [row,key] of ['idle','walk','attack'].entries()){
  const def=cfg.animations[key],img=e.assets.get(def.sheet);
  check(key+' PNG dimensions and transparency',img.naturalWidth===128*def.count&&img.naturalHeight===96&&img.complete&&!def.invalid);
  const probe=document.createElement('canvas');probe.width=img.naturalWidth;probe.height=96;const pc=probe.getContext('2d');pc.drawImage(img,0,0);
  const px=pc.getImageData(0,0,probe.width,96).data;check(key+' transparent corners',px[3]===0&&px[(probe.width-1)*4+3]===0);
  const columns=[];
  for(let i=0;i<def.count;i++){
   let first=96,last=-1;
   for(let y=0;y<96;y++)for(let x=0;x<128;x++)if(px[(y*probe.width+i*128+x)*4+3]){first=Math.min(first,y);last=Math.max(last,y)}
   check(key+' frame '+i+' size and floor',last===95&&last-first+1>=64&&last-first+1<=65);columns.push(i);
   ctx.fillStyle='#e4edf0';ctx.font='12px monospace';ctx.fillText(key+' '+i,20+i*165,20+row*110);
   ctx.strokeStyle='#40d4cb';ctx.beginPath();ctx.moveTo(10+i*165,107+row*110);ctx.lineTo(155+i*165,107+row*110);ctx.stroke();
   e.spriteRenderer.draw(ctx,'m4',key,{},0,{x:80+i*165,y:107+row*110,frameOverride:i});
  }
 }
 document.querySelector('main').before(atlas);
 const walk={...m,moving:true,state:'chase',pendingAttack:null};const frames=new Set();
 for(let i=0;i<6;i++){drawM4(ctx,walk,{x:3000,y:0},e.spriteRenderer,i?1/9:0);frames.add(e.animations.instances.get(walk).index)}
 check('AnimationManager advances all six walk frames',frames.size===6);
 const attack=spawnEnemies().find(e=>e.assetId==='m4'),p=e.state.player;attack.attackCooldown=0;p.x=attack.x+attack.w/2+25;p.y=GROUND-p.h;
 const activeFrames=new Set(),attackFrames=new Set();
 for(let i=0;i<40;i++){
  updateEnemies([attack],p,1/60,{map:{platforms:[{x:2400,y:790,w:2800,h:110}]}});
  drawM4(ctx,attack,{x:3000,y:0},e.spriteRenderer,1/60);
  if(attack.pendingAttack==='claw'){
   const frame=Math.min(5,Math.floor(attack.clawTime*10+1e-8));attackFrames.add(frame);
   if(m4AttackBox(attack))activeFrames.add(frame);
  }
 }
 check('real renderer uses six attack frames; hitbox only on frame 3',attackFrames.size===6&&activeFrames.size===1&&activeFrames.has(3));
 const before={...m};m.dead=true;m.deathTimer=.5;renderEnemy(ctx,m,{x:3000,y:0},e.spriteRenderer,1/60);Object.assign(m,before);
 check('procedural destruction renders without death sheet',!cfg.animations.death);
 const combat=runCombatTests(e.assets.getConfig('protagonist')),dash=runDashTests();
 check('existing combat and dash regression suites pass',combat.length>0&&dash>0);
 check('Warden arena and approach preserved',WARDEN_ARENA.left===4490&&WARDEN_ARENA.right===5160&&e.world.map.platforms.filter(p=>p.wardenDeck).length===3);
 e.camera.x=2700;e.camera.y=340;p.x=3000;p.y=GROUND-p.h;
 document.querySelector('#title-screen').classList.add('hidden');m.state='idle';m.moving=false;e.render(false);
 report.textContent='PASS '+checks.length+' M4 checks; '+combat.length+' combat checks; '+dash+' dash checks\n'+checks.join('\n');
}catch(error){report.textContent='FAIL '+error.stack;console.error(error)}
