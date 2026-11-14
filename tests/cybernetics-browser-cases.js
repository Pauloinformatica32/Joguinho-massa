import{NETWORK_QUESTIONS,networkChallenge,NETWORK_DIFFICULTIES}from'../js/network-terminals.js';
import{IMPLANTS,activateImplant,resetImplants,updateImplants}from'../js/cybernetics.js';
import{hurt,playerDamage}from'../js/combat.js';
import{scaledPlayerDamage}from'../js/upgrades.js';
import{spawnEnemies,updateEnemies}from'../js/enemies.js';
import{saveGame}from'../js/save.js';
let checks=0;const check=(value,message)=>{checks++;if(!value)throw Error(message)};
function key(e,key){window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));e.update(1/60);}
export function run(e){const s=e.state,p=s.player;e.paused=false;const enemies=e.enemies;e.enemies=[];
 check(s.network.unlockedImplants.length===3,'all hard terminals grant implants');
 resetImplants(p);s.network.selectedImplant=p.cybernetics.selected='firewall';e.render(false);check(document.querySelectorAll('#implant-hud [data-status="ready"]').length===1,'HUD equipped implant ready');
 key(e,'f');check(p.cybernetics.active.firewall>0&&p.cybernetics.cooldowns.firewall>24,'F activates selected shield');check(document.querySelector('#implant-hud').textContent.includes('ATIVO')&&document.querySelector('#implant-hud').textContent.includes('Recarga:'),'HUD active duration and cooldown');p.invuln=0;const hp=p.health;hurt(p,25,p.x+100,{source:'projectile'});check(p.health===hp&&!p.cybernetics.active.firewall,'real shield blocks one hit');hurt(p,25,p.x+100,{source:'projectile'});check(Math.abs(p.health-(hp-23))<1e-8,'next hit deals damage');key(e,'f');check(!p.cybernetics.active.firewall,'cannot reactivate during cooldown');
 key(e,'q');check(s.network.selectedImplant==='overclock','Q changes selected implant');const damage=scaledPlayerDamage(p,20);key(e,'f');check(Math.abs(scaledPlayerDamage(p,20)-damage*1.2)<1e-8,'actual Overclock damage');key(e,'f');check(Math.abs(scaledPlayerDamage(p,20)-damage*1.2)<1e-8,'no repeated stacking');
 const target={type:'patrol',room:1,x:p.x+20,y:p.y,w:30,h:54,health:100};Object.assign(p,{attackTimer:.1,state:'attack',attackHitConsumed:false,combo:0,attackBox:{...target}});playerDamage(p,target);check(Math.abs(target.health-(100-18*1.15*1.2))<1e-8,'actual outgoing hit boosted');p.attackTimer=0;
 for(let i=0;i<125;i++)e.update(1/30);check(!p.cybernetics.active.overclock&&Math.abs(scaledPlayerDamage(p,20)-damage)<1e-8,'four second effect ends through engine');check(document.querySelector('#implant-hud [data-status="cooldown"]'),'HUD reports cooldown');
 updateImplants(p,36);e.render(false);check(document.querySelectorAll('#implant-hud [data-status="ready"]').length===1,'ready after cooldown');
 key(e,'q');check(s.network.selectedImplant==='interference','Q selects interference');key(e,'f');check(p.cybernetics.active.interference>0,'F activates interference');
 Object.assign(p,{x:4200,y:646,invuln:100});const drone=spawnEnemies().find(a=>a.assetId==='v3_drone');drone.projectiles=[{x:4300,y:540,w:6,h:6,vx:100,vy:0,life:2,damage:8}];updateEnemies([drone],p,.1,{map:e.world.map});check(Math.abs(drone.projectiles[0].x-4306)<1e-8,'real projectile slowed 40 percent');check(Math.abs(drone.projectiles[0].life-1.9)<1e-8,'life clock stays real time');
 updateImplants(p,2.1);updateEnemies([drone],p,.1,{map:e.world.map});check(Math.abs(drone.projectiles[0].x-4316)<1e-8,'projectile returns to normal speed');
 resetImplants(p);activateImplant(s);e.respawn();e.paused=true;check(Object.values(p.cybernetics.active).every(n=>!n)&&Object.values(p.cybernetics.cooldowns).every(n=>!n)&&s.network.unlockedImplants.length===3,'death/respawn resets timers, preserves ownership');
 // Leave an active saved effect to verify that Continue clears transient state.
 s.network.selectedImplant=p.cybernetics.selected='interference';check(activateImplant(s),'ready after respawn');saveGame(s);e.enemies=enemies;
 return{checks,unlocked:s.network.unlockedImplants,selected:s.network.selectedImplant};
}
export function preview(e,id){resetImplants(e.state.player);e.state.network.selectedImplant=e.state.player.cybernetics.selected=id;activateImplant(e.state);e.ui.toast(IMPLANTS[id].name+' ativado.');e.paused=true;e.state.player.x=720;e.state.player.y=736;e.tower.syncCamera(true);e.render(false);return{id,hud:document.querySelector('#implant-hud').textContent};}
export function difficultyPreview(e,id){const t=e.world.map.terminals.find(t=>t.questionId===id),q=networkChallenge(NETWORK_QUESTIONS.find(q=>q.id===id));e.network.session={q,terminal:t,stage:'question'};e.paused=true; // Completed terminals normally archive; preview a fresh authentication panel.
 const original=e.network.completed;e.network.completed=()=>false;e.network.showQuestion();e.network.completed=original;
 check(document.querySelector('#speaker').textContent.includes(NETWORK_DIFFICULTIES[q.difficulty].label),'difficulty label '+id);check(document.querySelector('#speaker').textContent.includes('['+NETWORK_DIFFICULTIES[q.difficulty].rank+']'),'non-color rank '+id);check(document.querySelectorAll('#dialog-actions button').length===4,'four hard alternatives');return{difficulty:q.difficulty,checks};
}
