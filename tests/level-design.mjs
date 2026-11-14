import assert from'node:assert/strict';
import{readFileSync,writeFileSync}from'node:fs';
import{buildMap,WORLD_W,WORLD_H}from'../js/map.js';
import{newState}from'../js/engine.js';
import{normalizeSave}from'../js/save.js';
import{CHECKPOINTS,checkpointState,travelCheckpoint}from'../js/checkpoints.js';
import{buildTraversalGraph,traversalNodes,findTransition}from'./level-traversal.js';
import{activateRouteCheckpoint}from'../js/level-routes.js';
const before=JSON.parse(readFileSync('tests/level-design-before.json')),map=buildMap();
assert.equal(WORLD_W,15600);assert.equal(WORLD_H,900);
assert.equal(new Set(map.checkpoints.map(cp=>cp.id)).size,map.checkpoints.length);
assert.equal(new Set(map.checkpoints.map(cp=>cp.x)).size,map.checkpoints.length);
const overlap=(a,b)=>a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h;
for(const cp of CHECKPOINTS){const body={x:cp.x,y:733,w:30,h:54};assert.ok(!map.hazards.some(h=>overlap(body,h)),cp.id+' hazard');assert.ok(!map.platforms.some(p=>p.h>=70&&p.y<790&&overlap(body,p)),cp.id+' wall')}
for(const floor of ['tower_floor_1','tower_floor_2','tower_floor_3'])assert.ok(CHECKPOINTS.some(cp=>cp.floor===floor));
for(const cp of before.checkpoints){
 const s=newState();s.bosses.forEach(b=>{b.dead=true;b.health=0});s.player.x=cp.x;s.player.health=0;s.player.dead=true;s.checkpoint={...cp,region:cp.x<2400?0:cp.x<5200?1:2,y:733};s.credits=137;s.events.push('log-1','shortcut-maintenance');
 const n=normalizeSave(s);assert.ok(CHECKPOINTS.some(c=>c.x===n.checkpoint.x));assert.equal(n.player.x,n.checkpoint.x);assert.equal(n.credits,137);assert.ok(n.events.includes('shortcut-maintenance'));if(cp.floor)assert.equal(n.checkpoint.floor,cp.floor);assert.equal(normalizeSave(n).checkpoint.x,n.checkpoint.x);
}
const state=newState();state.checkpoint=checkpointState(CHECKPOINTS.find(cp=>cp.id==='tower-lab-mid'));state.checkpoint=travelCheckpoint(state,2,'tower_floor_3');state.checkpoint=travelCheckpoint(state,2,'tower_floor_2');assert.equal(state.checkpoint.x,11200,'backtracking keeps advanced refuge');
const arriving=newState();arriving.checkpoint=checkpointState(CHECKPOINTS.find(cp=>cp.id==='tower-lab-mid'));arriving.checkpoint=travelCheckpoint(arriving,2,'tower_floor_3');assert.equal(arriving.checkpoint.x,13210,'first core arrival does not skip the ascent');
arriving.bosses.forEach(b=>{b.dead=true;b.health=0});arriving.player.x=13210;arriving.player.health=0;arriving.player.dead=true;assert.equal(normalizeSave(arriving).player.x,13210,'transit spawn persists on death');
const suspended=newState();suspended.worldDesign=1;suspended.bosses[0].dead=true;suspended.player.x=3600;suspended.player.y=341;suspended.checkpoint=checkpointState(CHECKPOINTS.find(cp=>cp.id==='factory-entry'));suspended.credits=91;
const migrated=normalizeSave(suspended);assert.equal(migrated.player.x,2570,'removed suspended deck migrates to refuge');assert.equal(migrated.credits,91);
const authorized=buildMap();for(const b of authorized.towerBarriers)b.solid.disabled=true;
for(const fps of [30,60,120]){
 const graph=buildTraversalGraph(authorized,{fps});assert.deepEqual(graph.missing.map(n=>n.id),[],'reachable supports at '+fps);
 if(fps===60)writeFileSync('tests/level-traversal-results.json',JSON.stringify(graph,null,2));
 console.log(`PASS: ${graph.nodes.length} supports / ${graph.edges.length} simulated links at ${fps} FPS`);
}
const nodes=traversalNodes(authorized);
const closed=buildTraversalGraph(map);assert.ok(closed.missing.some(n=>n.id==='lab-exit'),'first EMP barrier blocks the downstream route');assert.ok(!closed.reached.includes('lab-exit'));
const firstOpen=buildMap();firstOpen.towerBarriers[0].solid.disabled=true;assert.ok(!buildTraversalGraph(firstOpen).reached.includes('lab-lift'),'second EMP barrier blocks the elevator');
const shortcutState=newState(),shortcutMap=buildMap(),preBoss=CHECKPOINTS.find(cp=>cp.id==='s9-matrona');activateRouteCheckpoint(shortcutMap,shortcutState,preBoss);assert.ok(!shortcutMap.platforms.find(p=>p.id==='s9-quarantine-bulkhead').disabled,'no early story bypass');shortcutState.abilities.hook=true;activateRouteCheckpoint(shortcutMap,shortcutState,preBoss);activateRouteCheckpoint(shortcutMap,shortcutState,preBoss);assert.equal(shortcutState.events.filter(id=>id==='s9-quarantine-return').length,1);
for(const root of [1440,12310]){const returning=buildMap(['s9-quarantine-return']);for(const b of returning.towerBarriers)b.solid.disabled=true;const reverse=buildTraversalGraph(returning,{roots:[root]});assert.deepEqual(reverse.missing.filter(p=>root<2400?p.x<2400:p.x>=8800&&p.x<12600).map(p=>p.id),[],'reverse exploration '+root)}
for(const h of authorized.hookPoints.filter(h=>h.from)){
 assert.ok(h.purpose&&h.to&&h.from);const source=nodes.find(n=>n.id===h.from),target=nodes.find(n=>n.id===h.to);
 assert.ok(source&&target,h.id+' endpoints');assert.ok(findTransition(authorized,source,target,{anchorId:h.id,doubleJump:false}),h.id+' ballistic landing');
}
for(const t of map.terminals.filter(t=>t.questionId))assert.ok(map.platforms.some(p=>t.x>=p.x&&t.x<=p.x+p.w&&Math.abs(t.y-p.y)<2),'console support '+t.id);
const bridge=buildMap(['shortcut-maintenance']).platforms.find(p=>p.id==='factory-repaired-bridge');assert.ok(bridge&&bridge.x<4010&&bridge.x+bridge.w>4080&&bridge.y<690,'Teo bridge crosses the press');
for(const b of map.towerBarriers){assert.ok(b.y<=-720&&b.y+b.h===790,'EMP barrier seals elevated paths')}
writeFileSync('tests/level-design-after.json',JSON.stringify(map,null,2));
console.log('PASS: stable checkpoints, all old checkpoint migrations, floor preservation, travel history, every authored grapple, consoles and Teo shortcut.');
