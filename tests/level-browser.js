import{findTransition,traversalNodes}from'./level-traversal.js';
import{nearestHook}from'../js/hook.js';
import{normalizeSave}from'../js/save.js';
export async function runLevelBrowser(e,realtime=false){
 const p=e.state.player,map=e.world.map,log=[],shots=[],timings=[];e.paused=true;
 const fail=message=>{throw Error(message+' '+JSON.stringify({x:p.x,y:p.y,feet:p.y+p.h,state:p.state,hook:p.hookCable}))};
 const step=async(input={})=>{e.keys.clear();e.pressed.clear();if(input.right)e.keys.add('d');if(input.left)e.keys.add('a');if(input.jump)e.pressed.add(' ');if(input.dash)e.keys.add('shift');e.paused=false;e.update(1/60);e.paused=true;if(realtime)await new Promise(requestAnimationFrame)};
 const snap=id=>{timings.push({id,time:e.state.playTime});shots.push({id,image:e.canvas.toDataURL('image/png')})};
 const walk=async x=>{for(let i=0;i<900;i++){const d=x-p.x;if(Math.abs(d)<7&&Math.abs(p.vx)<90){for(let j=0;j<25;j++)await step();return;}const coast=Math.abs(p.vx)*.13;await step({right:d>Math.max(2,coast),left:d<-Math.max(2,coast)})}fail('Walk stuck toward '+x)};
 const close=()=>{for(let i=0;i<40&&!document.querySelector('#dialog-screen').classList.contains('hidden');i++)e.advanceDialog();e.paused=true};
 const nodes=traversalNodes(map),node=id=>nodes.find(n=>n.id===id);
 const travel=async(from,to)=>{
  const a=node(from),z=node(to);if(!a||!z)fail('Missing route endpoints '+from+' '+to);
  if(Math.abs(p.y+p.h-a.y)>2)fail('Not on launch '+from);
  for(let i=0;i<35;i++)await step(); // Release movement before the next deliberate jump.
  const options={hook:e.state.abilities.hook,doubleJump:e.state.abilities.doubleJump,dash:e.state.abilities.dash};
  let plan=findTransition(map,a,z,{...options,startAt:p.x});
  if(!plan){plan=findTransition(map,a,z,options);if(!plan)fail('No path '+from+' '+to);await walk(plan.start);for(let i=0;i<30;i++)await step();plan=findTransition(map,a,z,{...options,startAt:p.x});if(!plan)fail('No path after approach '+from+' '+to)}
  if(plan.mode.type==='hook'){
   const selected=nearestHook(p,map.hookPoints);if(selected?.id!==plan.mode.id)fail('Nearest hook mismatch '+plan.mode.id+' / '+selected?.id);
   e.useImplant();
  }
  for(const input of plan.inputs)await step(input);
  if(Math.abs(p.y+p.h-z.y)>2||p.x+p.w<z.x||p.x>z.x+z.w)fail('Missed landing '+to);
  log.push({from,to,mode:plan.mode,seconds:plan.seconds,x:p.x,y:p.y});
 };
 // New-game ability order: Yara reunion → actual tutorial question → grapple.
 e.state.bosses.forEach(b=>{b.dead=false;b.health=b.maxHealth;b.active=false});e.state.events=[];e.state.abilities.hook=false;e.state.abilities.doubleJump=false;e.state.abilities.dash=false;
 Object.assign(p,{x:120,y:736,vx:0,vy:0,health:10000,maxHealth:10000,invuln:9999});
 await walk(595);e.paused=false;e.interact();close();await walk(720);e.paused=false;e.interact();e.network.showQuestion();e.network.answer(e.network.session.q.correctIndex);e.network.finish();close();
 if(!e.state.abilities.hook)fail('Tutorial did not unlock grapple');
 await travel('ground:0','s9-tutorial-roof');await travel('s9-tutorial-roof','s9-log-roof');await travel('s9-log-roof','s9-shortcut-east');await travel('s9-shortcut-east','s9-quarantine-ledge');snap('sector9-quarantine');
 // Descend after the physical bulkhead, stopping before the unchanged arena.
 for(let i=0;i<180&&(!p.grounded||p.y+p.h!==790||p.x<1435);i++)await step({right:p.x<1440,left:p.x>1450});
 if(p.x<1426||p.x+p.w>1510)fail('Unsafe Matrona approach');
 await walk(1440);e.paused=false;e.interact();close();snap('matrona-checkpoint');
 // Boss victories are fixtures here; movesets are tested by their existing suites.
 e.state.bosses[0].dead=true;e.state.bosses[0].active=false;await walk(2295);e.paused=false;e.interact();for(let i=0;i<125;i++)await step();
 await walk(2570);e.paused=false;e.interact();close();
 await travel('ground:2400','factory-loading');await travel('factory-loading','factory-assembly');await travel('factory-assembly','factory-log');await travel('factory-log','factory-maintenance');await travel('factory-maintenance','factory-coolant-west');await travel('factory-coolant-west','factory-coolant-east');snap('factory-coolant');
 await travel('factory-coolant-east','factory-service-west');await travel('factory-service-west','factory-service-east');
 for(let i=0;i<180&&(!p.grounded||p.y+p.h!==790);i++)await step({right:p.x<4380});await walk(4380);e.paused=false;e.interact();close();snap('warden-checkpoint');
 // Tower entrances, EMP authorization and lift travel are exercised on the real controller.
 e.state.bosses[1].dead=true;e.state.bosses[1].active=false;e.state.abilities.emp=true;
 towerTest.floor(1);e.paused=true;Object.assign(p,{x:5310,y:736,vx:0,vy:0});
 await travel('ground:5200','security-entry');await travel('security-entry','security-west');await travel('security-west','security-camera');await travel('security-camera','security-partition-west');await travel('security-partition-west','security-laser-bridge');snap('security-route');
 for(let i=0;i<180&&(!p.grounded||p.y+p.h!==790);i++)await step({right:p.x<7100});await walk(7300);
 await travel('ground:6930','security-partition-east');await travel('security-partition-east','security-lift');
 for(let i=0;i<180&&(!p.grounded||p.y+p.h!==790);i++)await step({right:p.x<8190});await walk(8175);e.paused=false;e.interact();for(let i=0;i<100;i++)await step();
 await travel('ground:8800','lab-entry');await travel('lab-entry','lab-west');await travel('lab-west','lab-partition-west');await travel('lab-partition-west','lab-log');snap('lab-route');
 await travel('lab-log','lab-panel-approach');for(let i=0;i<180&&(!p.grounded||p.y+p.h!==790);i++)await step({right:p.x<10540});await walk(10525);e.paused=false;e.interact();e.paused=true;
 if(!map.towerBarriers[0].solid.disabled)fail('EMP barrier 1 not authorized');await walk(10700);
 await travel('ground:10648','lab-barrier-east');await travel('lab-barrier-east','lab-east-approach');await travel('lab-east-approach','lab-camera');await travel('lab-camera','lab-partition-east');await travel('lab-partition-east','lab-exit');
 for(let i=0;i<180&&(!p.grounded||p.y+p.h!==790);i++)await step({right:p.x<11940});await walk(11925);e.paused=false;e.interact();e.paused=true;
 if(!map.towerBarriers[1].solid.disabled)fail('EMP barrier 2 not authorized');await walk(12355);e.paused=false;e.interact();for(let i=0;i<100;i++)await step();
 await travel('ground:13000','core-step');await travel('core-step','core-maintenance');await travel('core-maintenance','core-shaft-crossing');await travel('core-shaft-crossing','core-descent');snap('core-ascent');
 for(let i=0;i<180&&(!p.grounded||p.y+p.h!==790);i++)await step({right:p.x<13810});await walk(13810);e.paused=false;e.interact();close();snap('vespera-checkpoint');
 const normalized=normalizeSave(e.state);if(normalized.checkpoint.x!==13810||normalized.checkpoint.floor!=='tower_floor_3')fail('Checkpoint reload');
 if(e.assets.errors.length)fail('Asset errors: '+e.assets.errors.join(';'));
 return {log,shots,timings,realtime,checkpoint:e.state.checkpoint,assets:e.assets.status()};
}
