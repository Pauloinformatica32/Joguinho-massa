import{buildTraversalGraph}from'./level-traversal.js';
import assert from 'node:assert/strict';
import {buildMap} from '../js/map.js';
import {createPlayer,updatePlayer} from '../js/player.js';
import {activateHook,hookInRange} from '../js/hook.js';
import {Camera} from '../js/camera.js';
import {WORLD_TOP} from '../js/world-design.js';
import {newState} from '../js/engine.js';
import {normalizeSave} from '../js/save.js';
const map=buildMap();
const fps=Number(process.argv[2]||60);
for(const barrier of map.towerBarriers)barrier.solid.disabled=true;
const graph=buildTraversalGraph(map,{fps});
assert.deepEqual(graph.missing.map(n=>n.id),[],'route accessibility');
const reached=new Set(graph.nodes.filter(n=>graph.reached.includes(n.id)));
const count=map.platforms.filter(p=>p.architecture).length;
for(const reward of map.secrets.slice(-7)){assert.ok(map.platforms.some(s=>reward.x>=s.x-20&&reward.x<=s.x+s.w+20&&Math.abs(reward.y-s.y)<2),'reward supported '+reward.item)}
for(const t of map.terminals.filter(t=>t.questionId))assert.ok([...reached].some(s=>t.x>=s.x&&t.x<=s.x+s.w&&Math.abs(s.y-t.y)<100),'network console accessible via real physics '+t.questionId);
const camera=new Camera();camera.update({x:600,y:-400,w:30,h:54},960,540,15600,900,1);assert.ok(camera.y>=WORLD_TOP&&camera.y<0);
const walker=createPlayer();walker.x=1340;walker.y=790-walker.h;for(let i=0;i<fps*2;i++)updatePlayer(walker,{right:true,platforms:map.platforms},1/fps,{});assert.ok(walker.x+walker.w<=1390,'quarantine requires upper route');
for(const x of [1400,10625,12025]){const s=newState();s.bosses.slice(0,2).forEach(b=>b.dead=true);s.player.x=x;s.player.y=733;s.abilities.emp=true;const next=normalizeSave(s);assert.ok(next.player.y>=WORLD_TOP);assert.ok(!map.platforms.some(w=>w.h>=70&&next.player.x+next.player.w>w.x&&next.player.x<w.x+w.w&&next.player.y+next.player.h>w.y&&next.player.y<w.y+w.h),'safe migrated wall '+x);assert.equal(normalizeSave(next).player.x,next.player.x);}
console.log(`PASS at ${fps} FPS: ${count} added platforms reachable using actual physics; rewards supported; upper camera bounds.`);
