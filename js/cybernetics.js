import{NETWORK_QUESTIONS,networkChallenge}from'./network-terminals.js';
export const IMPLANTS=Object.freeze({
 firewall:{name:'Firewall neural',short:'Firewall',duration:3,cooldown:25,description:'Escudo ciano: absorve um ataque em até 3 s. Não bloqueia quedas ou riscos ambientais.'},
 overclock:{name:'Overclock de combate',short:'Overclock',duration:4,cooldown:35,description:'Aumenta o dano causado em 20% por 4 s.'},
 interference:{name:'Interferência de sinal',short:'Interferência',duration:2,cooldown:35,description:'Reduz em 40% o deslocamento de projéteis hostis compatíveis a até 300 px, por 2 s. Feixes e ondas de choque não são afetados.'}
});
export const IMPLANT_SHORTCUTS=Object.freeze({'1':'firewall','2':'overclock','3':'interference'});
export const activeImplantId=player=>Object.keys(IMPLANTS).find(id=>(player.cybernetics?.active?.[id]||0)>0)||null;
export function equipImplant(state,id){
 if(!Object.hasOwn(IMPLANTS,id)||!state.network?.unlockedImplants?.includes(id))return false;
 if(!state.player.cybernetics)resetImplants(state.player);
 state.network.selectedImplant=state.player.cybernetics.selected=id;return true;
}
// Inline vector pixels are shared by inventory and HUD; no character art changes.
export function implantIcon(id){const shapes={
 firewall:'M3 2h10v7h-1v2h-2v2H9v1H7v-1H6v-2H4V9H3zm2 2v5h1v2h1v1h2v-1h1V9h1V4z',
 overclock:'M4 3h8v1h1v8h-1v1H4v-1H3V4h1zm1 2v6h6V5zm2 0h3L8 8h2l-4 4 1-4H5zM1 5h2v1H1zm0 4h2v1H1zm12-4h2v1h-2zm0 4h2v1h-2zM5 1h1v2H5zm4 0h1v2H9zM5 13h1v2H5zm4 0h1v2H9z',
 interference:'M7 6h2v2H7zm0 3h2v5H7zM5 14h6v1H5zM4 4h2v1H5v5H4zM10 4h2v6h-1V5h-1zM2 2h2v1H3v9H2zM12 2h2v10h-1V3h-1z'
 };return '<svg class="implant-icon" viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" fill-rule="evenodd" d="'+(shapes[id]||shapes.firewall)+'"/></svg>';
}
export function resetImplants(player){player.cybernetics={selected:player.cybernetics?.selected||null,active:{},cooldowns:{},blockFlash:0};}
export function syncImplants(state){
 const paid=new Set(state.network.grantedRewardIds);
 const earned=NETWORK_QUESTIONS.filter(q=>paid.has('network-reward:'+q.id)).map(q=>networkChallenge(q).implantId);
 const saved=Array.isArray(state.network.unlockedImplants)?state.network.unlockedImplants:[];
 state.network.unlockedImplants=Object.keys(IMPLANTS).filter(id=>earned.includes(id)||saved.includes(id));
 if(!state.player.cybernetics)resetImplants(state.player);
 const owned=state.network.unlockedImplants;
 if(!owned.includes(state.network.selectedImplant))state.network.selectedImplant=owned[0]||null;
 state.player.cybernetics.selected=state.network.selectedImplant;
}
export function cycleImplant(state){const owned=state.network.unlockedImplants;if(!owned.length)return null;
 const next=owned[(owned.indexOf(state.network.selectedImplant)+1)%owned.length];equipImplant(state,next);return next;
}
export function activateImplant(state){const p=state.player,id=state.network.selectedImplant,c=p.cybernetics;
 if(p.dead||p.health<=0||p.state==='death'||!Object.hasOwn(IMPLANTS,id)||!state.network.unlockedImplants.includes(id)||activeImplantId(p)||(c.cooldowns[id]||0)>0)return false;
 c.active[id]=IMPLANTS[id].duration;c.cooldowns[id]=IMPLANTS[id].cooldown;return true;
}
export function updateImplants(player,dt){const c=player.cybernetics;if(!c)return;
 for(const timers of [c.active,c.cooldowns])for(const id of Object.keys(timers)){const remaining=timers[id]-dt;timers[id]=remaining<1e-8?0:remaining;}
 c.blockFlash=Math.max(0,c.blockFlash-dt);
}
export const implantActive=(player,id)=>(player.cybernetics?.active[id]||0)>0;
export function blockWithFirewall(player,info){
 if(!implantActive(player,'firewall')||info?.source==='fall'||info?.source?.startsWith('hazard')||['environment','chemical','fall'].includes(info?.type))return false;
 player.cybernetics.active.firewall=0;player.cybernetics.blockFlash=.18;return true;
}
export function hostileProjectileScale(player,projectile){
 if(!implantActive(player,'interference')||projectile.interferenceImmune||projectile.friendly||!Number.isFinite(projectile.vx)||!Number.isFinite(projectile.life)||projectile.life<=0||!Number.isFinite(projectile.x)||!Number.isFinite(projectile.y))return 1;
 return Math.hypot(projectile.x-player.x-player.w/2,projectile.y-player.y-player.h/2)<=300?.6:1;
}
export function implantStatus(player,id){const c=player.cybernetics,active=c?.active[id]||0,cooldown=c?.cooldowns[id]||0;
 return active>0?{state:'active',text:'ATIVO · '+active.toFixed(1)+' s',cooldown}:cooldown>0?{state:'cooldown',text:'RECARGA · '+cooldown.toFixed(1)+' s',cooldown}:{state:'ready',text:'PRONTO',cooldown:0};
}
export function drawImplantEffects(c,p,time){const runtime=p.cybernetics;if(!runtime||p.dead)return;const x=Math.round(p.x),y=Math.round(p.y),w=p.w,h=p.h;c.save();c.lineWidth=2;
 if(implantActive(p,'firewall')||runtime.blockFlash>0){c.strokeStyle=runtime.blockFlash>0?'#e4ffff':'#59edeb';c.beginPath();c.moveTo(x-10,y+4);c.lineTo(x,y-8);c.lineTo(x+w,y-8);c.lineTo(x+w+10,y+4);c.lineTo(x+w+10,y+h-4);c.lineTo(x+w,y+h+8);c.lineTo(x,y+h+8);c.lineTo(x-10,y+h-4);c.closePath();c.stroke();for(let i=0;i<3;i++){c.fillStyle='#7cf5ef';c.fillRect(x+w+7,y+10+i*12,3,5);}}
 if(implantActive(p,'overclock'))for(let i=0;i<6;i++){const dx=i%2? w+5:-7,dy=5+i*8;c.fillStyle=(i+Math.floor(time*8))%2?'#ff526f':'#61e7e7';c.fillRect(x+dx,y+dy,6,2);c.fillRect(x+dx,y+dy-4,2,5);}
 if(implantActive(p,'interference')){c.strokeStyle='#6ea5c62e';c.setLineDash([8,18]);c.strokeRect(x+w/2-300,y+h/2-300,600,600);c.setLineDash([]);c.strokeStyle='#8bd8ed';c.strokeRect(x-15,y-14,w+30,h+28);for(let i=0;i<3;i++){c.fillStyle='#7ecce0';c.fillRect(x-20-i*7,y+10+i*8,3,3);}}
 c.restore();
}
