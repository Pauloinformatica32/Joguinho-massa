import{Engine,newState}from'../js/engine.js';
import{UI}from'../js/ui.js';
import{resetVespera,startVesperaAttack,updateVespera,hitVespera,empVespera,vesperaFrame,slashBox}from'../js/vespera.js';
import{damageBoss}from'../js/bosses.js';
import{normalizeSave}from'../js/save.js';

export async function runVesperaBrowser(){
 let checks=0;const check=(name,ok)=>{checks++;if(!ok)throw Error(name)};
 const before=localStorage.getItem('nova-aurora-save-v1');
 const s=newState();s.devTowerTest=true;s.bosses.slice(0,2).forEach(b=>{b.dead=true;b.health=0});s.abilities.emp=true;
 const e=new Engine(document.querySelector('#game'),s,new UI()),p=s.player,b=s.bosses[2];
 await Promise.all([e.assets.loadRegion('corporate'),e.assets.loadRegion('virus_core')]);e.applyAssetCollisionConfigs();
 const cfg=e.assets.getConfig('vespera');
 check('six animations registered',Object.keys(cfg.animations).length===6);
 check('all sprites loaded',Object.keys(cfg.animations).every(k=>e.spriteRenderer.available('vespera',k))&&e.spriteRenderer.available('nexus01','idle')&&e.assets.status().failed===0);
 const sheet=document.createElement('canvas');sheet.width=960;sheet.height=6*130;sheet.id='vespera-atlas';const c=sheet.getContext('2d');c.fillStyle='#20303b';c.fillRect(0,0,sheet.width,sheet.height);c.font='12px monospace';c.fillStyle='#c6f6f2';
 let row=0;
 for(const [key,a]of Object.entries(cfg.animations)){
  const img=e.assets.get(a.sheet);check(key+' grid',img.naturalWidth===a.count*147&&img.naturalHeight===253&&!a.invalid);
  const probe={save(){},restore(){},translate(){this.flipped=true},scale(){},drawImage(...args){this.args=args}};
  for(let frame=0;frame<a.count;frame++){
   e.spriteRenderer.draw(probe,'vespera',key,{},0,{x:100,y:100,frameOverride:frame});check(key+' source '+frame,probe.args[1]===147*frame&&probe.args[2]===0&&probe.args[3]===147&&probe.args[4]===253&&probe.args[7]===50&&probe.args[8]===86&&probe.imageSmoothingEnabled===false);
   c.fillStyle='#d0ecee';c.fillText(key+' '+frame,20+frame*115,row*130+15);c.fillStyle='#607484';c.fillRect(15+frame*115,row*130+115,80,1);
   e.spriteRenderer.draw(c,'vespera',key,{},0,{x:55+frame*115,y:row*130+115,frameOverride:frame,facing:frame%2?1:-1});
  }
  e.spriteRenderer.draw(probe,'vespera',key,{},0,{x:100,y:100,facing:-1});check(key+' flips',probe.flipped===true);row++;
 }
 const {AnimationManager}=await import('../js/engine/animationManager.js'),manager=new AnimationManager(),idle={};
 for(let i=0;i<20;i++)manager.play(idle,'idle',cfg.animations.idle,.1);check('idle loops without reset',manager.instances.get(idle).index===0||manager.instances.get(idle).index===5);
 for(const key of ['command','attack','hurt','death']){const t={};manager.play(t,key,cfg.animations[key],10);const held=manager.play(t,key,cfg.animations[key],10);check(key+' holds final frame',held.finished&&held.index===cfg.animations[key].count-1)}
 const place=()=>{p.x=b.arena.spawnX-85;p.y=736;p.vx=p.vy=0;p.health=p.maxHealth=10000;p.invuln=999;p.dead=false;b.x=b.arena.spawnX;b.y=790-b.h;b.dead=false;b.active=true;resetVespera(b);e.tower.syncCamera(true)};
 place();const originalDraw=e.spriteRenderer.draw.bind(e.spriteRenderer);let droneDraws=0;e.spriteRenderer.draw=(ctx,id,...args)=>{if(id==='nexus01')droneDraws++;return originalDraw(ctx,id,...args)};e.render();check('single independent drone',droneDraws===1);e.spriteRenderer.draw=originalDraw;
 startVesperaAttack(b,'command',p);for(let i=0;i<55;i++)updateVespera(b,p,1/60);check('drone actually fires',b.projectiles.length>0&&b.projectiles[0].originX> b.arena.left&&Math.abs(b.projectiles[0].originY-b.y)>10);
 b.drone.x=p.x;b.drone.y=p.y;const energy=p.energy;e.useImplant();check('real K EMP route interrupts command',b.drone.disabled>0&&!b.projectiles.length&&b.vesperaState==='idle'&&p.energy===energy-35&&s.abilities.emp);
 place();startVesperaAttack(b,'cyber_slash',p);for(let i=0;i<27;i++)updateVespera(b,p,1/60);check('rendered attack uses extended arm',vesperaFrame(b)===5&&slashBox(b)?.w===36);e.render(false);
 place();b.health=160;for(let i=0;i<200;i++)updateVespera(b,p,1/60);check('phase transition once',b.phase===2&&b.transitionCount===1);
 startVesperaAttack(b,'network_overload',p);for(let i=0;i<90;i++)updateVespera(b,p,1/60);check('overload active and safe',b.zones.length===4);e.render(false);
 place();b.health=1;p.state='attack';p.attackTimer=.2;p.attackFrameReady=true;p.attackHitConsumed=false;p.attackBox={...b};p.combo=0;check('real melee kills',damageBoss(b,p)&&b.dead&&!b.deathComplete);
 const frames=new Set();for(let i=0;i<70;i++){e.update(1/60);frames.add(vesperaFrame(b))}check('death eight frames and hold',frames.size===8&&vesperaFrame(b)===7&&b.deathComplete&&!b.drone.active&&!b.active);
 check('death not ending',!s.events.includes('ending')&&s.events.includes('victory-boss-3'));e.closeDialog();
 const loaded=normalizeSave(s);check('saved defeat keeps pose and computer pending',loaded.bosses[2].dead&&loaded.bosses[2].deathComplete&&!loaded.events.includes('ending'));
 p.x=15420;p.y=736;p.state='idle';e.tower.syncCamera(true);e.interact();check('computer starts EMP shutdown',e.tower.transition?.shutdown);for(let i=0;i<100;i++)e.tower.update(.02);check('ending via computer',s.events.includes('ending')&&s.events.includes('tower-central-shutdown'));
 check('no save writes',localStorage.getItem('nova-aurora-save-v1')===before);
 document.querySelectorAll('#title-screen,#ending-screen,#dialog-screen,#boss-warning').forEach(n=>n.classList.add('hidden'));
 document.body.prepend(sheet);globalThis.__vesperaEngine=e;s.events=s.events.filter(id=>!['ending','tower-central-shutdown','victory-boss-3','act-3'].includes(id));place();b.phase=2;b.phaseTransitioned=true;startVesperaAttack(b,'cyber_slash',p);b.stateTime=.45;e.debugCombat=true;e.render(false);
 return{checks,rendered:[50,86],collision:[26,80],drone:[30,26],assets:e.assets.status()};
}
