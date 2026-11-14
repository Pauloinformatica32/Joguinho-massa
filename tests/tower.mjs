import assert from 'node:assert/strict';
import {buildMap} from '../js/map.js';
import {TOWER_FLOORS,TOWER_ELEVATORS} from '../js/tower-layout.js';
import {createPlayer,updatePlayer} from '../js/player.js';
import {activateHook,hookInRange} from '../js/hook.js';
import {newState} from '../js/engine.js';
import {normalizeSave,saveGame,loadGame} from '../js/save.js';
const map=buildMap();let checks=0;
const check=(label,value)=>{checks++;assert.ok(value,label)};
for(const fps of [30,60,120]){
 const dt=1/fps;
 // Climb from the lab floor onto the first high route using the actual hook
 // impulse, gravity and world collision, then clear the security partition.
 const p=createPlayer();p.x=9370;p.y=736;p.grounded=true;
 const hook={...map.hookPoints.find(h=>h.x===9510),cooldown:0};
 check('lab anchor reachable from ground '+fps,hookInRange(p,hook));activateHook(p,hook);
 let landed=false;
 for(let tick=0;tick<fps*2;tick++){
  updatePlayer(p,{right:p.x<9460,left:p.x>9490,platforms:map.platforms},dt,{doubleJump:true,hook:true});
  if(p.grounded&&p.y+p.h===560)landed=true;
 }
 check('hook reaches lab catwalk '+fps,landed);
 // Every mandatory 180px corporate partition is double-jumpable.
 for(const wallX of [6350,7430]){
  const body=createPlayer();body.x=wallX-120;body.y=736;body.grounded=true;
  let crossed=false;
  for(let tick=0;tick<fps*2;tick++){
   updatePlayer(body,{right:true,jump:tick===0||tick===Math.round(fps*.3),platforms:map.platforms},dt,{doubleJump:true});
   if(body.x>wallX+55)crossed=true;
  }
  check('corporate partition '+wallX+' '+fps,crossed);
 }
}
// Persistence uses an in-memory storage implementation and cannot touch a
// player's browser save. Round trips include elevators, logs and shutdown.
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
for(const floor of TOWER_FLOORS){
 const s=newState();s.bosses.forEach(b=>{b.dead=true;b.health=0});s.abilities.emp=true;
 s.player.x=floor.checkpoint;s.player.y=733;
 s.checkpoint={x:floor.checkpoint,y:733,region:2,floor:floor.id,name:floor.name};
 s.events.push(...TOWER_ELEVATORS.map(e=>e.id),'log-3','tower-log-employees','tower-lab-barrier-1','tower-central-shutdown','ending');
 check('write '+floor.id,saveGame(s));const loaded=loadGame();
 check('storage floor '+floor.id,loaded.towerFloor===floor.id&&loaded.checkpoint.x===floor.checkpoint&&loaded.player.x===floor.checkpoint);
 check('events and ability '+floor.id,s.events.every(id=>loaded.events.includes(id))&&loaded.abilities.emp&&loaded.bosses.every(b=>b.dead));
 const dead=normalizeSave({...s,player:{...s.player,x:floor.right-100,health:0,dead:true}});
 check('dead save respawn '+floor.id,dead.player.x===floor.checkpoint);
 const prior=memory.get('nova-aurora-save-v1');s.devTowerTest=true;s.player.x=123;saveGame(s);
 check('developer session cannot save '+floor.id,memory.get('nova-aurora-save-v1')===prior);
}
console.log(`PASS: ${checks} tower traversal and storage checks at 30/60/120 FPS.`);
