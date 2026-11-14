import{awardAbility}from'./abilities.js';
import{NETWORK_QUESTIONS,TUTORIAL_QUESTION,networkChallenge}from'./network-terminals.js';
import{syncImplants,resetImplants,implantActive,IMPLANTS}from'./cybernetics.js';
const rewardId=id=>'network-reward:'+id;
const bounded=(n,fallback,min,max)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
export function networkTotals(state){
 const ids=new Set(state.network?.grantedRewardIds||[]),stats={healthBonus:0,damageMultiplier:1,moveSpeedMultiplier:1,damageReduction:0};
 for(const q of NETWORK_QUESTIONS){if(!ids.has(rewardId(q.id)))continue;const r=q.reward;
  if(r.type==='max_health')stats.healthBonus+=r.value;
  if(r.type==='damage_multiplier')stats.damageMultiplier+=r.value;
  if(r.type==='move_speed_multiplier')stats.moveSpeedMultiplier+=r.value;
  if(r.type==='damage_reduction')stats.damageReduction+=r.value;
 }
 stats.damageMultiplier=Math.min(1.25,stats.damageMultiplier);stats.moveSpeedMultiplier=Math.min(1.12,stats.moveSpeedMultiplier);stats.damageReduction=Math.min(.2,stats.damageReduction);return stats;
}
export function normalizeNetworkProgress(state){
 const old=state.network,p=state.player,valid=new Set(NETWORK_QUESTIONS.map(q=>q.id)),completed=new Set();
 for(const id of Array.isArray(old?.completedTerminalIds)?old.completedTerminalIds:[])if(valid.has(id))completed.add(id);
 for(const q of NETWORK_QUESTIONS)if(Array.isArray(old?.grantedRewardIds)&&old.grantedRewardIds.includes(rewardId(q.id)))completed.add(q.id);
 // Existing hooks are permanent. Their tutorial is migrated with no stat payout.
 if(state.abilities.hook)completed.add(TUTORIAL_QUESTION);
 const grantedRewardIds=[...completed].map(rewardId),healthBonus=networkTotals({network:{grantedRewardIds}}).healthBonus;
 const fallbackBase=bounded(p.maxHealth-(old?healthBonus:0),100,100,250);
 state.network={version:2,unlockedImplants:Array.isArray(old?.unlockedImplants)?old.unlockedImplants:[],selectedImplant:old?.selectedImplant||null,tutorialRequired:old?.tutorialRequired===true,baseMaxHealth:bounded(old?.baseMaxHealth,fallbackBase,100,250),completedTerminalIds:[...completed],grantedRewardIds};
 applyNetworkStats(state);
 resetImplants(p);p.cybernetics.selected=state.network.selectedImplant;
 if(completed.has(TUTORIAL_QUESTION))awardAbility(state,'hook');
 return state.network;
}
export function applyNetworkStats(state){
 const totals=networkTotals(state),p=state.player;
 p.maxHealth=state.network.baseMaxHealth+totals.healthBonus;p.health=Math.min(p.health,p.maxHealth);
 p.networkDamageMultiplier=totals.damageMultiplier;p.networkMoveSpeedMultiplier=totals.moveSpeedMultiplier;p.networkDamageReduction=totals.damageReduction;
 syncImplants(state);
 return totals;
}
export function answerNetworkQuestion(state,id,index){
 const q=NETWORK_QUESTIONS.find(q=>q.id===id);if(!q)throw Error('Terminal de rede desconhecido.');
 if(!state.network)normalizeNetworkProgress(state);
 const challenge=networkChallenge(q);
 if(!Number.isInteger(index)||index!==q.correctIndex)return{correct:false,explanation:challenge.explanation,rewardGranted:false};
 if(state.network.grantedRewardIds.includes(rewardId(id)))return{correct:true,explanation:challenge.explanation,rewardGranted:false};
 const newImplant=challenge.implantId&&!state.network.unlockedImplants.includes(challenge.implantId)?challenge.implantId:null;
 state.network.completedTerminalIds.push(id);state.network.grantedRewardIds.push(rewardId(id));
 applyNetworkStats(state);
 if(q.reward.type==='max_health')state.player.health=Math.min(state.player.maxHealth,state.player.health+q.reward.value);
 if(q.reward.type==='unlock_grapple')awardAbility(state,'hook');
 return{correct:true,explanation:challenge.explanation,rewardGranted:true,rewardLabel:q.reward.label,implantId:newImplant,implantLabel:IMPLANTS[newImplant]?.name||null};
}
export const scaledPlayerDamage=(player,amount)=>amount*(player.networkDamageMultiplier||1)*(implantActive(player,'overclock')?1.2:1);
export const orenBaseHealth=state=>state.player.maxHealth-networkTotals(state).healthBonus;
export const OREN_UPGRADE=Object.freeze({price:20,health:15,maxHealth:190});
export function buyOrenUpgrade(state){
 const p=state.player;
 if(orenBaseHealth(state)+OREN_UPGRADE.health>OREN_UPGRADE.maxHealth)return{success:false,message:'Esse reforço já está no nível máximo. Nem minhas ferramentas fazem milagres.'};
 if(state.credits<OREN_UPGRADE.price)return{success:false,message:'Preciso de 20 créditos. Ferramentas não se pagam com promessas, garoto.'};
 const gain=OREN_UPGRADE.health;
 state.credits-=OREN_UPGRADE.price;p.maxHealth+=gain;p.health=p.maxHealth;
 if(state.network)state.network.baseMaxHealth+=gain;
 return{success:true,message:`Reforço instalado: +${gain} PV máximos por 20 créditos. Agora trate de não estragar meu trabalho.`};
}
