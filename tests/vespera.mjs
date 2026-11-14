import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createBosses,updateBoss,damageBoss,renderBoss} from '../js/bosses.js';
import {createPlayer,updatePlayer} from '../js/player.js';
import {newState} from '../js/engine.js';
import {normalizeSave} from '../js/save.js';
import {syncProgress} from '../js/campaign.js';
import {VESPERA as C,resetVespera,startVesperaAttack,updateVespera,slashBox,empVespera,hitVespera,chooseVesperaAttack,defeatVespera,vesperaFrame} from '../js/vespera.js';
const cfg=JSON.parse(readFileSync('assets/bosses/vespera/config.json'));
let checks=0;const check=(label,ok)=>{checks++;assert.ok(ok,label)};
const make=()=>{const b=createBosses()[2];b.active=true;return b};
const player=b=>({...createPlayer(),x:b.x-60,y:736,invuln:0,health:10000,maxHealth:10000});
for(const [name,a] of Object.entries(cfg.animations)){
 const bytes=readFileSync(a.sheet),original=readFileSync('Vespera_Boss_Sprites_Codex/'+a.sheet);
 check(name+' unchanged',createHash('sha256').update(bytes).digest('hex')===createHash('sha256').update(original).digest('hex'));
 check(name+' grid',bytes.readUInt32BE(16)===147*a.count&&bytes.readUInt32BE(20)===253&&a.columns===a.count&&a.frameWidth===147&&a.frameHeight===253);
 check(name+' loop',a.loop===['idle','walk'].includes(name));
}
check('one boss',createBosses().filter(b=>b.assetId==='vespera').length===1);
check('human scale and shared anchor',cfg.scale===.34&&cfg.origin.x===73.5&&cfg.origin.y===251&&createBosses()[2].h===80);
for(const fps of [30,60,120]){
 const dt=1/fps;
 for(const phase of [1,2]){
  for(const state of ['command','cyber_slash','isolation_protocol',...(phase===2?['network_overload']:[])]){
   const b=make(),p=player(b);b.phase=phase;b.phaseTransitioned=phase===2;startVesperaAttack(b,state,p);
   let sawOffense=false,sawRecovery=false,projectiles=0,previousShots=0;
   for(let i=0;i<fps*6;i++){
    p.invuln=Math.max(0,p.invuln-dt);updateVespera(b,p,dt);
    if(b.vesperaState==='idle'){sawRecovery=true;break}
    if(state==='command'&&b.shotsFired>previousShots){const q=b.projectiles.at(-1);projectiles++;previousShots=b.shotsFired;check('drone is projectile origin '+fps,Math.hypot(q.originX-b.drone.x,q.originY-b.drone.y)<.001)}
    sawOffense ||= !!slashBox(b)||b.projectiles.length>0||b.zones.some(z=>b.stateTime-z.start>=z.warning&&b.stateTime-z.start<z.warning+z.duration);
    if(b.zones.length){const active=b.zones.filter(z=>b.stateTime-z.start>=z.warning&&b.stateTime-z.start<z.warning+z.duration);check('safe lane '+fps,active.reduce((n,z)=>n+z.w,0)<b.arena.right-b.arena.left-220)}
   }
   check(state+' offense '+fps,sawOffense);check(state+' recovery '+fps,sawRecovery);if(state==='command')check('exactly three shots '+fps,projectiles===3);
  }
 }
 // Warning and active geometry are tested separately from the artist's body.
 const b=make(),p=player(b);startVesperaAttack(b,'cyber_slash',p);b.stateTime=C.slashStart-.001;check('slash no early hit '+fps,!slashBox(b));b.stateTime=C.slashStart+.001;
 const box=slashBox(b);check('slash follows hand '+fps,box.w===36&&box.h===30&&Math.abs(box.x-(b.x+b.w/2))<=44);b.stateTime=C.slashEnd;check('slash ends '+fps,!slashBox(b));
 // Actual jump physics clears the blade; warnings leave enough reaction time.
 const jump=player(b);jump.x=box.x;jump.grounded=true;
 for(let tick=0;tick<Math.ceil(C.slashStart*fps);tick++)updatePlayer(jump,{jump:tick===0,platforms:[{x:b.arena.left,y:790,w:1400,h:110}]},dt,{doubleJump:true});
 check('normal jump clears slash '+fps,jump.y+jump.h<box.y);
 // EMP cancellation, resistance, cooldown and reusable device.
 startVesperaAttack(b,'command',p);b.drone.x=p.x+10;b.drone.y=p.y;b.shotsFired=1;b.projectiles.push({life:1});
 check('EMP interrupts '+fps,empVespera(b,p)&&b.drone.disabled===C.empDisable&&!b.projectiles.length&&b.vesperaState==='idle'&&!b.dead);
 check('EMP resistance '+fps,!empVespera(b,p));
 for(let i=0;i<fps*8;i++)updateVespera(b,p,dt);
 b.drone.x=p.x;b.drone.y=p.y;check('EMP reusable '+fps,empVespera(b,p));
 const transition=make(),tp=player(transition);transition.health=160;
 for(let i=0;i<fps*12;i++)updateVespera(transition,tp,dt);
 check('phase changes once '+fps,transition.phase===2&&transition.transitionCount===1);
 const noDamage=make();noDamage.health=160;updateVespera(noDamage,player(noDamage),dt);check('transition protected '+fps,!hitVespera(noDamage,50));
 const selection=make(),sp=player(selection);selection.phase=2;
 for(let i=0;i<300;i++){const state=chooseVesperaAttack(selection,sp,()=>.01);startVesperaAttack(selection,state,sp);check('no triple repeat '+fps,selection.attackHistory.length<3||new Set(selection.attackHistory.slice(-3)).size>1)}
 const death=make(),dp=player(death);death.health=1;check('lethal hit '+fps,hitVespera(death,20));const frames=new Set();let completed=0;
 for(let i=0;i<fps*2;i++){const event=updateBoss(death,dp,dt);frames.add(vesperaFrame(death));if(event?.kind==='defeated')completed++}
 check('all death frames '+fps,frames.size===8&&vesperaFrame(death)===7);check('death completion once '+fps,completed===1&&death.deathComplete&&!death.drone.active&&!death.projectiles.length&&!death.zones.length&&!slashBox(death));
 const health=dp.health;updateBoss(death,dp,5);check('death cannot hurt '+fps,dp.health===health&&!empVespera(death,dp));
 // Use the real player physics, no invulnerability override, to leave every
 // beam/isolation pattern from each starting lane, in both phases.
 for(const phase of [1,2])for(const attack of ['isolation_protocol',...(phase===2?['network_overload']:[])])for(let lane=0;lane<5;lane++){
  const boss=make(),hero=createPlayer(),width=(boss.arena.right-boss.arena.left-80)/5;
  hero.x=boss.arena.left+40+lane*width+width/2-hero.w/2;hero.y=736;hero.grounded=true;
  boss.phase=phase;boss.phaseTransitioned=phase===2;startVesperaAttack(boss,attack,hero);
  for(let tick=0;tick<fps*5;tick++){
   let sequence=0;if(attack==='isolation_protocol'&&phase===2&&boss.stateTime>=C.isolationWarning+C.isolationActive+.04)sequence=1;
   const group=boss.zones.filter(z=>z.sequence===sequence),safe=[0,1,2,3,4].find(i=>!group.some(z=>Math.abs(z.x-(boss.arena.left+40+i*width+14))<1));
   const target=boss.arena.left+40+(safe??lane)*width+width/2;
   updatePlayer(hero,{left:hero.x+hero.w/2>target+5,right:hero.x+hero.w/2<target-5,platforms:[{x:boss.arena.left,y:790,w:1400,h:110}]},dt,{dash:true,doubleJump:true});
   updateVespera(boss,hero,dt);if(boss.vesperaState==='idle')break;
  }
  check('dodge '+attack+' phase '+phase+' lane '+lane+' '+fps,hero.health===100);
 }
 for(const phase of [1,2]){
  const ranged=make(),runner=createPlayer();runner.x=ranged.x-300;runner.y=736;runner.grounded=true;ranged.phase=phase;ranged.phaseTransitioned=phase===2;startVesperaAttack(ranged,'command',runner);
  for(let tick=0;tick<fps*5;tick++){
   updatePlayer(runner,{left:runner.x>ranged.arena.left+45,right:runner.x<=ranged.arena.left+45,jump:tick===Math.round(fps*.6),platforms:[{x:ranged.arena.left,y:790,w:1400,h:110}]},dt,{dash:true,doubleJump:true});updateVespera(ranged,runner,dt);if(ranged.vesperaState==='idle')break;
  }
  check('movement/jump escapes drone burst phase '+phase+' '+fps,runner.health===100);
  const boss=make(),hero=createPlayer();hero.x=boss.x-40;hero.y=736;hero.grounded=true;boss.phase=phase;boss.phaseTransitioned=phase===2;startVesperaAttack(boss,'cyber_slash',hero);
  for(let tick=0;tick<fps*3;tick++){
   updatePlayer(hero,{jump:tick===0,left:true,platforms:[{x:boss.arena.left,y:790,w:1400,h:110}]},dt,{doubleJump:true});updateVespera(boss,hero,dt);if(boss.vesperaState==='idle')break;
  }
  check('jump/move escapes slash and rupture phase '+phase+' '+fps,hero.health===100);
 }
 const injured=make();check('hurt response '+fps,hitVespera(injured,20)&&injured.vesperaState==='hurt');const hurtFrames=new Set();for(let i=0;i<fps*.4;i++){hurtFrames.add(vesperaFrame(injured));updateVespera(injured,player(injured),dt)}check('four hurt frames '+fps,hurtFrames.size===4);
}
const save=newState();save.bosses.slice(0,2).forEach(b=>{b.dead=true;b.health=0});save.abilities.emp=true;const b=save.bosses[2];b.active=true;defeatVespera(b);syncProgress(save);
check('boss death is not ending',!save.events.includes('ending'));const loaded=normalizeSave(save);check('defeat persists with final pose',loaded.bosses[2].dead&&loaded.bosses[2].deathComplete&&vesperaFrame(loaded.bosses[2])===7&&!loaded.events.includes('ending'));
save.events.push('tower-central-shutdown');syncProgress(save);check('only shutdown ends story',normalizeSave(save).events.includes('ending'));
console.log(`PASS: ${checks} Véspera checks at 30/60/120 FPS.`);
