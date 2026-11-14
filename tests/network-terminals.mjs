import assert from 'node:assert/strict';
import {NETWORK_QUESTIONS,NETWORK_TERMINALS,validateQuestionBank,TUTORIAL_QUESTION} from '../js/network-terminals.js';
import {newState} from '../js/engine.js';
import {normalizeSave} from '../js/save.js';
import {answerNetworkQuestion,networkTotals,buyOrenUpgrade} from '../js/upgrades.js';
import {buildMap,regionAt} from '../js/map.js';
import {playerDamage,hurt} from '../js/combat.js';
import {createPlayer,updatePlayer} from '../js/player.js';
import {createBosses,damageBoss} from '../js/bosses.js';
import {RegionTransitions} from '../js/region-transitions.js';

let checks=0;const check=(value,message)=>{checks++;assert.ok(value,message)};
check(NETWORK_QUESTIONS.length===12,'12 authoritative questions');
for(const broken of [[],NETWORK_QUESTIONS.map((q,i)=>i===0?{...q,correctIndex:4}:q),NETWORK_QUESTIONS.map((q,i)=>i===0?{...q,options:['x','x','y','z']}:q),NETWORK_QUESTIONS.map((q,i)=>i===0?{...q,explanation:''}:q)])assert.throws(()=>validateQuestionBank({questions:broken}));
const map=buildMap(),terminals=map.terminals.filter(t=>t.questionId);
check(terminals.length===12,'12 consoles');check(new Set(terminals.map(t=>t.questionId)).size===12,'one placement per question');
for(const region of ['slum','factory','corporate'])check(terminals.filter(t=>regionAt(t.x).id===region).length===4,'four per region '+region);
check(!map.npcs.find(n=>n.id==='yara').ability,'Yara cannot unlock without DNS');
check(!terminals.some(t=>map.platforms.some(s=>s.h>=70&&t.x>s.x&&t.x<s.x+s.w&&t.y>s.y&&t.y<=s.y+s.h)),'consoles outside solid walls');
const state=newState();check(state.network.tutorialRequired&&!state.abilities.hook,'fresh mandatory tutorial');
for(const q of NETWORK_QUESTIONS){
 for(let i=0;i<4;i++){const s=newState(),before=JSON.stringify({p:s.player,n:s.network,a:s.abilities});const result=answerNetworkQuestion(s,q.id,i);check(result.correct===(i===q.correctIndex),'zero based grading '+q.id+' '+i);if(i!==q.correctIndex)check(before===JSON.stringify({p:s.player,n:s.network,a:s.abilities}),'wrong answers unchanged');else check(result.rewardGranted,'every correct answer rewarded');}
 const result=answerNetworkQuestion(state,q.id,q.correctIndex);check(result.rewardGranted,'reward '+q.id);const once=JSON.stringify(state);check(!answerNetworkQuestion(state,q.id,q.correctIndex).rewardGranted&&JSON.stringify(state)===once,'no duplicate '+q.id);
}
check(state.abilities.hook,'existing hook unlocked');check(state.player.maxHealth===140&&state.player.health===140,'40 actual HP');
const totals=networkTotals(state);check(Math.abs(totals.damageMultiplier-1.15)<1e-9,'15% damage');check(Math.abs(totals.moveSpeedMultiplier-1.06)<1e-9,'6% speed');check(totals.damageReduction===.08,'8% defense');
const enemy={x:10,y:0,w:30,h:54,health:100,type:'patrol',room:1};Object.assign(state.player,{attackTimer:1,state:'attack',attackBox:{...enemy},combo:0,facing:1});playerDamage(state.player,enemy);check(Math.abs(enemy.health-(100-18*1.15))<1e-9,'real melee formula');
Object.assign(state.player,{health:140,invuln:0,dead:false});hurt(state.player,25);check(Math.abs(state.player.health-117)<1e-9,'real incoming damage');
for(const boss of createBosses().slice(0,2)){Object.assign(boss,{active:true,attackType:'recovery',hitCooldown:0,health:200});Object.assign(state.player,{attackTimer:1,state:'attack',attackHitConsumed:false,attackBox:{x:boss.x-10,y:boss.y-10,w:boss.w+20,h:boss.h+20},combo:0,overloadTimer:0});damageBoss(boss,state.player);check(Math.abs(boss.health-177)<1e-9,'real boss damage '+boss.id);}
for(const fps of [30,60,120]){const base=createPlayer(),buff=createPlayer();Object.assign(buff,{networkMoveSpeedMultiplier:1.06});for(let i=0;i<fps;i++){for(const p of [base,buff])updatePlayer(p,{right:true,platforms:map.platforms},1/fps,{})}check(buff.vx>base.vx&&buff.x>base.x,'real speed '+fps);}
state.credits=200;for(let i=0;i<6;i++)check(buyOrenUpgrade(state).success,'Oren independently stacks');check(state.player.maxHealth===230,'Oren + network health');check(!buyOrenUpgrade(state).success,'mechanical limit retained');
const stored=JSON.parse(JSON.stringify(state));let loaded=normalizeSave(stored);for(let i=0;i<5;i++)loaded=normalizeSave(JSON.parse(JSON.stringify(loaded)));check(loaded.player.maxHealth===230&&loaded.network.grantedRewardIds.length===12,'idempotent stats across loads');check(loaded.abilities.hook&&loaded.network.completedTerminalIds.length===12,'completion retained');
const old=newState();delete old.network;old.abilities.hook=true;old.player.maxHealth=145;old.events.push('yara-terminal');const migrated=normalizeSave(old);check(migrated.abilities.hook&&migrated.player.maxHealth===145&&migrated.network.completedTerminalIds.includes(TUTORIAL_QUESTION),'legacy hook migration');check(migrated.events.includes('yara-terminal'),'legacy story retained');
const fresh=newState();check(!fresh.abilities.hook&&fresh.network.completedTerminalIds.length===0,'new journey resets');
const injured=newState();injured.player.health=42;answerNetworkQuestion(injured,'t02_setor9_dhcp',2);check(injured.player.maxHealth===110&&injured.player.health===52,'HP award adds ten to current health');check(normalizeSave(injured).player.health===52,'loading never heals or reapplies HP');
delete injured.network.baseMaxHealth;injured.player.networkDamageMultiplier=99;const repaired=normalizeSave(injured);check(repaired.player.maxHealth===110&&repaired.player.networkDamageMultiplier===1,'partial upgrade metadata repaired without double HP');
const tutorialGate=new RegionTransitions({state:fresh,tower:{},keys:new Set(),pressed:new Set()});fresh.player.x=1400;tutorialGate.constrain(1380);check(fresh.player.x+fresh.player.w===1390,'cannot jump past tutorial gate');answerNetworkQuestion(fresh,TUTORIAL_QUESTION,1);fresh.player.x=1400;tutorialGate.constrain(1380);check(fresh.player.x===1400,'tutorial gate releases');
console.log(`PASS: ${checks} networking checks; 12 questions, four choices, 48 grading cases, all reward formulas, no duplicate payouts, placement and legacy/new saves.`);
