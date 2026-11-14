import{Engine}from'../js/engine.js';
import{NETWORK_QUESTIONS,TUTORIAL_QUESTION}from'../js/network-terminals.js';
import{saveGame}from'../js/save.js';
import{checkpointFor}from'../js/campaign.js';
import{lockedInventory,afterUnlock}from'./implant-inventory-browser-cases.js';
import{probe as probeYara}from'./yara-assistance-browser-cases.js';
let checks=0;
const check=(condition,message)=>{checks++;if(!condition)throw Error(message)};
const clickFirst=()=>document.querySelector('#dialog-actions button').click();
function captureEngine(){const render=Engine.prototype.render;Engine.prototype.render=function(...args){window.__networkEngine=this;return render.apply(this,args)}}
function closeConversation(e){for(let i=0;i<30&&e.paused&&!document.querySelector('#dialog-screen').classList.contains('hidden');i++)e.advanceDialog();}
function place(e,t){
 const supports=e.world.map.platforms.filter(s=>!s.disabled&&(s.h<30||s.kind==='ground')&&t.x>=s.x&&t.x<=s.x+s.w&&Math.abs(s.y-t.y)<100).sort((a,b)=>Math.abs(a.y-t.y)-Math.abs(b.y-t.y));
 check(supports.length>0,'terminal has reachable standing surface '+t.questionId);
 Object.assign(e.state.player,{x:t.x-e.state.player.w/2,y:supports[0].y-e.state.player.h,vx:0,vy:0,grounded:true});e.paused=false;
}
export async function start(){
 captureEngine();document.querySelector('#new-game').click();const e=window.__networkEngine,p=e.state.player;e.paused=true;
 check(!e.state.abilities.hook&&e.state.network.completedTerminalIds.length===0,'new journey resets tutorial');
 lockedInventory(e);
 p.x=600;p.y=790-p.h;e.paused=false;e.interact();
 check(document.querySelector('#dialog-text').textContent.includes('abandonado a rede'),'new Yara first dialogue');
 check(e.ui.dialogueLines.some(l=>l.text.includes('limpava nossos rastros')),'shared hacker history');
 closeConversation(e);check(e.state.events.includes('yara-reunion'),'intro progression retained');check(!e.state.abilities.hook,'intro alone cannot award hook');
 const t=e.world.map.terminals.find(t=>t.questionId===TUTORIAL_QUESTION);place(e,t);e.interact();check(e.network.session?.stage==='story','tutorial story opens');
 check(!document.querySelector('#dialog-text').textContent.includes(NETWORK_QUESTIONS[0].options[1]),'story does not disclose answer');clickFirst();
 check(document.querySelectorAll('#dialog-actions button').length===4,'exactly four choices');check(e.paused,'question pauses game');
 probeYara(e,'question');
 e.keydown('d');const x=p.x;e.update(.033);check(p.x===x,'no movement behind modal');
 const full=document.querySelector('#dialog-screen .dialog').getBoundingClientRect();check(full.width>200,'question rendered');
 return{checks};
}
export function wrong(){const e=window.__networkEngine,p=e.state.player,hp=p.health;
 document.querySelector('#dialog-actions button').click();check(e.network.session.stage==='failure','wrong DNS rejected');check(document.querySelector('#dialog-text').textContent.includes('O DNS permite resolver nomes'),'useful explanation');check(!e.state.abilities.hook&&p.health===hp,'wrong answer no damage or reward');probeYara(e,'failure');return{checks};
}
export function fit(){const r=document.querySelector('#dialog-screen .dialog').getBoundingClientRect();check(r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,'modal fits '+innerWidth+'x'+innerHeight);check(document.querySelector('.dialog').scrollWidth<=r.width+1,'no horizontal overflow');return{width:innerWidth,height:innerHeight,checks};}
export async function complete(){
 const e=window.__networkEngine,p=e.state.player;clickFirst();
 document.querySelector('#yara-help-toggle').click();
 document.querySelector('#dialog-screen').dispatchEvent(new KeyboardEvent('keydown',{key:'2',bubbles:true}));check(e.network.session.stage==='success','numeric keyboard selects correct DNS');
 check(e.state.abilities.hook,'grapple awarded');const rewards=e.state.network.grantedRewardIds.length;e.network.answer(1);check(e.state.network.grantedRewardIds.length===rewards,'success is single payout');clickFirst();
 check(e.ui.dialogueLines[0].text.includes('assinatura antiga'),'Yara continues tutorial');closeConversation(e);check(e.state.events.includes('yara-network-training'),'tutorial follow-up saved');
 p.x=525;p.y=790-p.h;p.energy=100;e.useImplant();check(p.hookCable&&p.vy<0,'actual grapple works');
 const cancelTerminal=e.world.map.terminals.find(t=>t.questionId==='t02_setor9_dhcp');place(e,cancelTerminal);e.interact();clickFirst();document.querySelector('#dialog-screen').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check(!e.paused&&!e.network.session,'unanswered modal can close');check(!e.state.network.completedTerminalIds.includes('t02_setor9_dhcp'),'closing does not complete question');
 for(const q of NETWORK_QUESTIONS.slice(1)){
  const t=e.world.map.terminals.find(t=>t.questionId===q.id);place(e,t);e.interact();check(e.network.session?.q.id===q.id,'actual terminal interaction '+q.id);clickFirst();
  probeYara(e,'question');const before=JSON.stringify({h:p.health,m:p.maxHealth,n:e.state.network});document.querySelectorAll('#dialog-actions button')[(q.correctIndex+1)%4].click();check(e.network.session.stage==='failure','wrong rejected '+q.id);check(before===JSON.stringify({h:p.health,m:p.maxHealth,n:e.state.network}),'wrong unchanged '+q.id);probeYara(e,'failure');clickFirst();document.querySelector('#yara-help-toggle').click();
  const button=document.querySelectorAll('#dialog-actions button')[q.correctIndex];button.click();afterUnlock(e,q.id);const paid=e.state.network.grantedRewardIds.length;button.click();check(e.state.network.grantedRewardIds.length===paid,'stale click no duplication '+q.id);clickFirst();check(!e.paused,'controls restored '+q.id);
 }
 check(e.state.network.completedTerminalIds.length===12,'all twelve completed');check(p.maxHealth===140&&Math.abs(p.networkDamageMultiplier-1.15)<1e-8&&Math.abs(p.networkMoveSpeedMultiplier-1.06)<1e-8&&p.networkDamageReduction===.08,'all real bonuses applied');
 const tutorial=e.world.map.terminals.find(t=>t.questionId===TUTORIAL_QUESTION);place(e,tutorial);const before=JSON.stringify(e.state.network);e.interact();check(e.network.session.stage==='archive','completed archive');e.advanceDialog();check(before===JSON.stringify(e.state.network),'archive no payout');
 for(const [x,y,item]of [[640,-350,'Memória dos moradores 09'],[6270,245,'Arquivo de vigilância Aurora']]){Object.assign(p,{x:x-p.w/2,y:y-p.h});e.paused=false;e.interact();check(e.state.items.includes(item)&&!e.network.session,'nearby original secret remains collectible');}
 Object.assign(p,{x:720,y:790-p.h,vx:0,vy:0});const x=p.x;e.keydown('d');for(let i=0;i<10;i++)e.update(1/60);e.keyup('d');check(p.x>x,'movement restored through engine');
 // Preserve the established Warden → Iris sequence without an educational gate.
 e.state.bosses[0].dead=true;e.state.bosses[1].dead=false;Object.assign(p,{x:3385,y:790-p.h});e.interact();check(!e.state.abilities.emp&&!e.network.session,'Iris cannot award before Warden');e.closeDialog();e.state.bosses[1].dead=true;e.interact();check(e.state.abilities.emp&&!e.network.session,'Iris awards EMP without quiz');e.closeDialog();
 for(const x of [8190,12370,13150,8940]){Object.assign(p,{x,y:790-p.h});e.tower.syncCamera(true);e.interact();check(!!e.tower.transition,'elevator preserved '+x);for(let i=0;i<100;i++)e.tower.update(1/60);check(!e.tower.transition&&e.state.abilities.emp,'elevator completed and reusable EMP');}
 Object.assign(p,{x:310,y:790-p.h-3,vx:0,vy:0,dead:false,health:p.maxHealth});e.state.checkpoint=checkpointFor(0);p.checkpoint={...e.state.checkpoint};e.paused=true;saveGame(e.state);check(!!localStorage.getItem('nova-aurora-save-v1'),'save written');
 return{checks,completed:12,maxHealth:p.maxHealth,damage:p.networkDamageMultiplier,speed:p.networkMoveSpeedMultiplier,defense:p.networkDamageReduction};
}
export function continueGame(){captureEngine();check(!document.querySelector('#continue-game').disabled,'Continue enabled');document.querySelector('#continue-game').click();const e=window.__networkEngine,p=e.state.player;e.paused=true;
 check(e.state.network.unlockedImplants.length===3&&e.state.network.selectedImplant==='interference','Continue retains implants and selection');check(Object.values(p.cybernetics.active).every(n=>!n)&&Object.values(p.cybernetics.cooldowns).every(n=>!n),'Continue clears active effects and cooldowns');
 check(e.state.network.completedTerminalIds.length===12&&e.state.network.grantedRewardIds.length===12,'Continue retains terminal IDs');check(p.maxHealth===140&&e.state.abilities.hook&&e.state.abilities.emp,'Continue retains upgrades and abilities');p.health=0;e.respawn();e.paused=true;check(p.health===140&&p.networkDamageReduction===.08&&e.state.network.completedTerminalIds.length===12,'respawn retains bonuses');
 const t=e.world.map.terminals.find(t=>t.questionId===TUTORIAL_QUESTION);place(e,t);e.interact();check(e.network.session.stage==='archive','archive after reload');document.querySelector('#dialog-screen').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check(!e.paused&&!e.network.session,'Escape restores controls');e.paused=true;
 document.querySelector('#new-game').click();const fresh=window.__networkEngine;fresh.paused=true;check(fresh.state.network.completedTerminalIds.length===0&&!fresh.state.abilities.hook&&fresh.state.player.maxHealth===100&&fresh.state.network.unlockedImplants.length===0,'New Journey resets bonuses');return{checks};
}
