import{Engine,newState}from'../js/engine.js';
import{UI}from'../js/ui.js';
import{buildMap}from'../js/map.js';
import{TOWER_ARENA}from'../js/tower-layout.js';
import{resetVespera,restoreDefeatedVespera,startVesperaAttack,updateVespera}from'../js/vespera.js';
import{centralComputerState,drawCentralComputer,drawCentralConsole,CORE_VISUAL,CENTRAL_TERMINAL_ID}from'../js/tower-core-visuals.js';
import{normalizeSave}from'../js/save.js';
export async function runTowerCoreBrowser(){
 let checks=0;const check=(name,ok)=>{checks++;if(!ok)throw Error(name)};
 const oldSave=localStorage.getItem('nova-aurora-save-v1'),s=newState();s.devTowerTest=true;s.bosses.slice(0,2).forEach(b=>{b.dead=true;b.health=0});s.abilities.emp=true;
 const e=new Engine(document.querySelector('#game'),s,new UI());await e.assets.loadRegion('virus_core');const b=s.bosses[2],p=s.player;
 const geometry=map=>JSON.stringify({platforms:map.platforms.map(p=>({x:p.x,y:p.y,w:p.w,h:p.h,id:p.id,kind:p.kind,disabled:!!p.disabled,oneWay:!!p.oneWay})),hazards:map.hazards,terminals:map.terminals,checkpoints:map.checkpoints,hooks:map.hookPoints});
 const originalGeometry=geometry(e.world.map),arena=JSON.stringify(b.arena);
 const hide=()=>document.querySelectorAll('#title-screen,#ending-screen,#dialog-screen,#death-screen,#boss-warning').forEach(n=>n.classList.add('hidden'));
 function setStage(stage){
  hide();clearTimeout(e.ui.toastTimer);document.querySelector('#toast').classList.remove('show');s.events=s.events.filter(id=>![CENTRAL_TERMINAL_ID,'ending','victory-boss-3','act-3'].includes(id));e.world.map.coreShutdownProgress=0;e.tower.transition=null;e.paused=false;b.dead=false;b.active=false;b.health=b.maxHealth;b.x=b.arena.spawnX;resetVespera(b);p.x=14770;p.y=736;p.vx=p.vy=0;p.health=p.maxHealth=100;p.dead=false;p.invuln=99;e.world.time=1.36;
  if(stage==='phase1'){b.active=true;startVesperaAttack(b,'command',p);for(let i=0;i<45;i++)updateVespera(b,p,1/60)}
  if(stage==='phase2'){b.active=true;b.phase=2;b.phaseTransitioned=true;startVesperaAttack(b,'isolation_protocol',p);for(let i=0;i<84;i++)updateVespera(b,p,1/60)}
  if(['critical','shutdown','off'].includes(stage)){restoreDefeatedVespera(b);p.x=15360}
  if(stage==='shutdown'){e.world.map.coreShutdownProgress=.65;e.camera.x=CORE_VISUAL.x-e.canvas.width/2;e.camera.y=790-e.canvas.height}
  if(stage==='off')s.events.push(CENTRAL_TERMINAL_ID,'ending');
  e.tower.syncCamera(stage!=='shutdown');e.render(false);return centralComputerState(s,e.world.map);
 }
 const hashes={};
 for(const stage of ['standby','phase1','phase2','critical','shutdown','off']){
  const v=setStage(stage);check(stage+' presentation state',v.mode===stage);check(stage+' original layout',geometry(e.world.map)===originalGeometry&&JSON.stringify(b.arena)===arena);
  const offscreen=document.createElement('canvas');offscreen.width=1000;offscreen.height=540;const c=offscreen.getContext('2d');c.translate(-CORE_VISUAL.x+500,-250);const old=JSON.stringify(s);drawCentralComputer(c,s,e.world.map,1.36);drawCentralConsole(c,s,e.world.map,1.36);check(stage+' render does not mutate state',old===JSON.stringify(s));
  const rgba=c.getImageData(0,0,1000,540).data;let hash=0;for(let i=0;i<rgba.length;i+=29)hash=(Math.imul(hash,31)+rgba[i])|0;hashes[stage]=hash;
 }
 check('distinct core reactions',new Set(Object.values(hashes)).size===6);
 const rain=e.world.drawRain;b.active=false;
 for(const x of [120,2700,5390,9090,14770]){p.x=x;e.tower.syncCamera(true);let calls=0;e.world.drawRain=()=>{calls++};e.render(false);check('rain isolated to other maps '+x,calls===(x<2400?1:0))}e.world.drawRain=rain;
 setStage('phase1');const start=e.spriteRenderer.draw.bind(e.spriteRenderer),text=e.ctx.fillText.bind(e.ctx),order=[];
 e.ctx.fillText=(value,...args)=>{if(value==='AURORA DYNAMICS')order.push('core');return text(value,...args)};
 e.spriteRenderer.draw=(ctx,id,...args)=>{if(['vespera','nexus01','protagonist'].includes(id))order.push(id);return start(ctx,id,...args)};e.render(false);e.ctx.fillText=text;e.spriteRenderer.draw=start;
 check('machinery behind characters',order.indexOf('core')>=0&&['vespera','nexus01','protagonist'].every(id=>order.indexOf(id)>order.indexOf('core')));
 for(const x of [TOWER_ARENA.left+5,TOWER_ARENA.right-40]){p.x=x;e.tower.syncCamera(true);check('core fits arena framing '+x,CORE_VISUAL.x-99>=e.camera.x&&CORE_VISUAL.x+99<=e.camera.x+e.canvas.width)}
 const terminal=e.world.map.terminals.find(t=>t.id===CENTRAL_TERMINAL_ID);check('existing terminal not duplicated',e.world.map.terminals.filter(t=>t.id===CENTRAL_TERMINAL_ID).length===1&&terminal.x===15440&&terminal.y===790);
 check('console beyond boss hit zones on solid floor',terminal.x>TOWER_ARENA.right&&e.world.map.platforms.some(q=>q.kind==='ground'&&terminal.x>=q.x&&terminal.x<q.x+q.w&&q.y===terminal.y));
 setStage('standby');p.x=terminal.x-20;e.interact();check('locked before defeat',!e.tower.transition&&!s.events.includes('ending'));
 b.dead=true;b.deathComplete=false;e.interact();check('death animation still locks console',!e.tower.transition&&!centralComputerState(s,e.world.map).ready);
 setStage('critical');let v=centralComputerState(s,e.world.map);check('post-defeat console available',v.ready&&v.near);s.abilities.emp=false;e.interact();check('EMP ownership required',!e.tower.transition);s.abilities.emp=true;
 const prompt=[],fill=e.ctx.fillText.bind(e.ctx);e.ctx.fillText=(value,...args)=>{prompt.push(value);return fill(value,...args)};e.render(false);e.ctx.fillText=fill;check('explicit console prompt',prompt.includes('[E] DESATIVAR NÚCLEO CENTRAL')&&!prompt.includes('E · LER'));
 const oldP={x:p.x,y:p.y};e.interact();check('existing shutdown starts',e.tower.transition?.shutdown&&!s.events.includes('ending'));
 for(let i=0;i<40;i++)e.tower.update(.02);v=centralComputerState(s,e.world.map);check('core fading before ending',v.mode==='shutdown'&&v.power>0&&v.power<.6&&!s.events.includes('ending'));
 check('shutdown focuses the computer',Math.abs((e.camera.x+e.canvas.width/2)-CORE_VISUAL.x)<1&&p.x===oldP.x&&p.y===oldP.y);
 for(let i=0;i<40;i++)e.tower.update(.02);v=centralComputerState(s,e.world.map);check('core off and ending',v.mode==='off'&&v.power===0&&s.events.includes('ending')&&s.abilities.emp);
 check('existing ending UI opens',e.paused&&!document.querySelector('#ending-screen').classList.contains('hidden'));
 const loaded=normalizeSave(s);check('shutdown persists',centralComputerState(loaded,buildMap(loaded.events)).mode==='off');
 check('no normal save changes',localStorage.getItem('nova-aurora-save-v1')===oldSave);
 check('final geometry intact',geometry(e.world.map)===originalGeometry);
 globalThis.__corePreview={engine:e,setStage};setStage('phase1');return{checks,hashes,terminal:{x:terminal.x,y:terminal.y},machine:CORE_VISUAL};
}
