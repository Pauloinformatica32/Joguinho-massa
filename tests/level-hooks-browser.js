import{findTransition,traversalNodes}from'./level-traversal.js';
import{nearestHook}from'../js/hook.js';
import{normalizeSave}from'../js/save.js';
import{checkpointState,CHECKPOINTS}from'../js/checkpoints.js';
export async function verifyLevelHooks(e){
 e.paused=true;const p=e.state.player,map=e.world.map,nodes=traversalNodes(map),results=[],shots=[];
 e.state.bosses.forEach(b=>{b.dead=true;b.active=false;b.health=0});Object.assign(e.state.abilities,{hook:true,doubleJump:true,dash:true,emp:true});
 const step=(right,left)=>{e.keys.clear();e.pressed.clear();if(right)e.keys.add('d');if(left)e.keys.add('a');e.paused=false;e.update(1/60);e.paused=true};
 for(const hook of map.hookPoints.filter(h=>h.from)){
  const source=nodes.find(n=>n.id===hook.from),target=nodes.find(n=>n.id===hook.to),plan=findTransition(map,source,target,{anchorId:hook.id,doubleJump:false});
  let success=false,used=[];
  const starts=[plan.start,source.x+source.w/2-15,source.x+5,source.x+source.w-35];
  for(const start of starts){
   Object.assign(p,{x:start,y:source.y-p.h,vx:0,vy:0,health:10000,maxHealth:10000,invuln:9999,dead:false,grounded:true,fall:false,damageTimer:0,attackTimer:0,dashTimer:0,hookLiftTimer:0,hookCableTimer:0,facing:1});
   for(const h of map.hookPoints)h.cooldown=0;
   for(const b of map.towerBarriers)e.tower.barrierTimers[b.id]=99;e.tower.applyBarriers();e.tower.syncCamera(true);
   used=[];const touched=new Set();let desired=false;
   for(let tick=0;tick<240;tick++){
    const next=nearestHook(p,map.hookPoints);
    // Use precisely the normal nearest-anchor command, including any lower relay.
    if(next&&!touched.has(next.id)&&(tick===0||tick%8===0)&&(!desired||next.id===hook.id)){
     e.useImplant();used.push(next.id);touched.add(next.id);if(next.id===hook.id)desired=true;
    }
    const cx=target.x+target.w/2;step(p.x+p.w/2<cx-9,p.x+p.w/2>cx+9);
    if(desired&&tick>2&&p.grounded&&Math.abs(p.y+p.h-target.y)<1&&p.x+p.w>target.x&&p.x<target.x+target.w){success=true;break}
   }
   if(success)break;
  }
  if(!success)throw Error('Actual nearest-hook route failed '+hook.id+' '+JSON.stringify({x:p.x,y:p.y,used}));
  const interactables=map.terminals.filter(t=>t.x>=target.x&&t.x<=target.x+target.w&&Math.abs(t.y-target.y)<2).map(t=>t.id);
  results.push({id:hook.id,from:source.id,to:target.id,used,interactables});
  if(interactables.length||hook.id==='factory-service-hook')shots.push({id:hook.id,image:e.canvas.toDataURL()});
 }
 // Every refuge activates, dies, restores and normalizes through the actual Engine/UI lifecycle.
 const checkpoints=[];
 const rewards=[];
 const npcs=[];
 for(const id of ['yara','oren-slum','oren-factory','scientist','teo-factory','corporate-ai']){
  const n=map.npcs.find(n=>n.id===id);e.closeDialog();Object.assign(p,{x:n.x-15,y:736,vx:0,vy:0,dead:false});e.tower.syncCamera(true);e.paused=false;e.interact();e.paused=true;
  if(e.dialogNpc?.id!==id)throw Error('NPC inaccessible '+id);npcs.push(id);e.closeDialog();
 }
 for(const reward of map.secrets){
  e.closeDialog();Object.assign(p,{x:reward.x-p.w/2,y:reward.y-p.h,vx:0,vy:0,dead:false});e.tower.syncCamera(true);e.paused=false;e.interact();e.paused=true;
  if(!e.state.items.includes(reward.item))throw Error('Reward inaccessible '+reward.item);rewards.push(reward.item);e.closeDialog();
 }
 for(const cp of map.checkpoints){
  e.closeDialog();Object.assign(p,{x:cp.x,y:736,vx:0,vy:0,health:10000,dead:false,fall:false,invuln:9999});e.tower.syncCamera(true);e.paused=false;e.interact();e.paused=true;
  if(e.state.checkpoint.id!==cp.id)throw Error('Checkpoint not interactable '+cp.id);
  e.closeDialog();p.health=0;p.dead=true;e.beginPlayerDeath();e.render(false);for(let i=0;i<80;i++)e.renderPausedDeath(1/60);e.respawn();e.paused=true;
  const loaded=normalizeSave(e.state);if(p.x!==cp.x||loaded.checkpoint.id!==cp.id||loaded.player.x!==cp.x)throw Error('Checkpoint restore '+cp.id);
  checkpoints.push(cp.id);
 }
 // Attempt the rooftop bypass without the tutorial ability, even above the bulkhead.
 e.state.network.tutorialRequired=true;e.state.abilities.hook=false;Object.assign(p,{x:1340,y:100,vx:0,vy:0,dead:false,health:10000,invuln:9999});e.tower.syncCamera(true);
 for(let i=0;i<90;i++)step(true,false);if(p.x+p.w>1390.01)throw Error('Tutorial gate bypassed');
 e.state.abilities.hook=true;e.state.abilities.emp=true;
 const trips=[];
 const ride=async x=>{Object.assign(p,{x,y:736,vx:0,vy:0});e.tower.syncCamera(true);e.paused=false;e.interact();if(!e.regionTransitions.active)throw Error('Region gate failed '+x);for(let i=0;i<125;i++)step(false,false);trips.push({x:p.x,checkpoint:e.state.checkpoint.id})};
 e.state.checkpoint=checkpointState(CHECKPOINTS.find(cp=>cp.id==='factory-warden'));await ride(5110);
 e.state.checkpoint=checkpointState(CHECKPOINTS.find(cp=>cp.id==='tower-security-mid'));await ride(5280);if(e.state.checkpoint.x!==4380)throw Error('Backtracking overwrote factory refuge');await ride(5110);if(e.state.checkpoint.x!==7050)throw Error('Backtracking overwrote security refuge');
 Object.assign(p,{x:10500,y:736,vx:0,vy:0});e.tower.syncCamera(true);e.debugLevel=true;e.render(false);shots.push({id:'design-overlay',image:e.canvas.toDataURL()});e.debugLevel=false;
 const b=e.state.bosses.find(b=>b.assetId==='vespera');b.dead=true;b.deathComplete=true;
 Object.assign(p,{x:15425,y:736,vx:0,vy:0,dead:false,health:10000});e.tower.syncCamera(true);e.paused=false;e.interact();for(let i=0;i<100;i++)e.tower.update(1/60);e.paused=true;
 if(!e.state.events.includes('tower-central-shutdown'))throw Error('Final computer inaccessible');
 return {results,checkpoints,npcs,rewards,trips,lockedTutorial:true,finalShutdown:true,shots};
}
