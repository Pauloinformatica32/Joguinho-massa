import assert from'node:assert/strict';
import{newState}from'../js/engine.js';
import{answerNetworkQuestion,scaledPlayerDamage}from'../js/upgrades.js';
import{normalizeSave}from'../js/save.js';
import{equipImplant,activateImplant,cycleImplant,activeImplantId,updateImplants,resetImplants,IMPLANT_SHORTCUTS}from'../js/cybernetics.js';
let checks=0;const check=(value,label)=>{checks++;assert.ok(value,label)};
for(const fps of [30,60,120]){
 const s=newState(),p=s.player;check(s.network.selectedImplant===null&&s.network.unlockedImplants.length===0,'empty inventory');
 for(const id of ['firewall','overclock','interference','__proto__','missing'])check(!equipImplant(s,id),'locked/invalid rejected');
 check(!activateImplant(s),'no equipment cannot activate');
 answerNetworkQuestion(s,'t03_setor9_osi',2);check(s.network.selectedImplant==='firewall','first auto equipped');check(!activeImplantId(p)&&!Object.values(p.cybernetics.cooldowns).some(Boolean),'unlock does not activate');
 answerNetworkQuestion(s,'t06_industrial_subnet',2);check(s.network.selectedImplant==='firewall'&&s.network.unlockedImplants.length===2,'second unlock retains equipment');
 check(equipImplant(s,'overclock')&&s.network.selectedImplant==='overclock','manual equipment');check(cycleImplant(s)==='firewall','cycle unlocked only');check(!equipImplant(s,'interference'),'third still locked');
 check(activateImplant(s),'firewall activates');check(equipImplant(s,'overclock')&&!activateImplant(s),'cannot overlap');check(activeImplantId(p)==='firewall'&&!p.cybernetics.active.overclock&&!p.cybernetics.cooldowns.overclock,'selection preserves first effect and does not charge second');
 for(let i=0;i<fps;i++)updateImplants(p,1/fps);const cooldown=p.cybernetics.cooldowns.firewall;
 for(let i=0;i<30;i++){equipImplant(s,'firewall');equipImplant(s,'overclock');}
 check(p.cybernetics.cooldowns.firewall===cooldown&&p.cybernetics.active.firewall>0,'switches cannot reset timers');
 for(let i=0;i<fps*2;i++)updateImplants(p,1/fps);check(!activeImplantId(p)&&activateImplant(s),'second effect after first ends');
 const damage=scaledPlayerDamage(p,20);check(Math.abs(damage-20*1.05*1.2)<1e-9,'real Overclock multiplier');equipImplant(s,'firewall');check(!activateImplant(s)&&scaledPlayerDamage(p,20)===damage,'equipment cannot cancel active bonus or bypass cooldown');
 answerNetworkQuestion(s,'t09_tower_nat',3);check(s.network.unlockedImplants.length===3&&s.network.selectedImplant==='firewall','third unlock preserves selection');
 check(equipImplant(s,IMPLANT_SHORTCUTS['3'])&&!activateImplant(s),'third blocked by active effect');
 for(let i=0;i<fps*4;i++)updateImplants(p,1/fps);check(!activeImplantId(p)&&activateImplant(s),'third activates after expiry');check(activeImplantId(p)==='interference'&&p.cybernetics.cooldowns.firewall>0&&p.cybernetics.cooldowns.overclock>0,'individual cooldowns retained');
 const saved=normalizeSave(JSON.parse(JSON.stringify(s)));check(saved.network.selectedImplant==='interference'&&saved.network.unlockedImplants.length===3,'save equipment and ownership');check(!activeImplantId(saved.player)&&Object.values(saved.player.cybernetics.cooldowns).every(n=>!n),'load resets transients');
 resetImplants(p);check(s.network.selectedImplant==='interference'&&s.network.unlockedImplants.length===3&&!activeImplantId(p),'respawn helper preserves progression');
}
const old=newState();old.network.unlockedImplants=['firewall','firewall','unknown','__proto__'];old.network.selectedImplant='overclock';const migrated=normalizeSave(old);check(migrated.network.unlockedImplants.join()==='firewall'&&migrated.network.selectedImplant==='firewall','valid saved IDs preserved and invalid equipment repaired');
const legacy=newState();answerNetworkQuestion(legacy,'t06_industrial_subnet',2);delete legacy.network.unlockedImplants;delete legacy.network.selectedImplant;const loaded=normalizeSave(legacy);check(loaded.network.unlockedImplants.join()==='overclock'&&loaded.network.selectedImplant==='overclock','legacy rewarded terminals restore equipment');
const remembered=newState();remembered.network.unlockedImplants=['firewall'];remembered.network.selectedImplant='firewall';const paid=answerNetworkQuestion(remembered,'t03_setor9_osi',2);check(paid.rewardGranted&&!paid.implantId&&remembered.network.unlockedImplants.length===1,'existing ownership cannot unlock twice');
const fresh=newState();check(!fresh.network.selectedImplant&&fresh.network.unlockedImplants.length===0,'New Journey resets equipment');
console.log(`PASS: ${checks} equipment checks at 30/60/120 FPS; automatic/manual equip, exclusive effects, cooldown integrity, legacy saves and invalid IDs.`);
