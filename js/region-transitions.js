import{primaryKey}from'./input.js';
import{towerFloorAt}from'./tower-layout.js';
import {saveGame} from './save.js';
import {syncProgress} from './campaign.js';
import {travelCheckpoint} from './checkpoints.js';
export const ACCESS_GATES=[
 {id:'industrial',x:2390,stops:[2310,2470],arrivals:[2470,2290],title:'COMPLEXO INDUSTRIAL — INSTALAÇÕES AURORA',back:'SETOR 9 — DISTRITO EM QUARENTENA',boss:'boss-0'},
 {id:'corporate',x:5190,stops:[5110,5280],arrivals:[5310,5090],title:'TORRE AURORA — ACESSO CORPORATIVO',back:'COMPLEXO INDUSTRIAL — INSTALAÇÕES AURORA',boss:'boss-2',emp:true}
];
export class RegionTransitions{
 constructor(e){this.e=e;this.active=null;this.state='idle'}
 interact(){const e=this.e,p=e.state.player;if(this.active||e.tower.transition)return true;
  for(const gate of ACCESS_GATES)for(let side=0;side<2;side++){
   if(Math.abs(p.x+p.w/2-gate.stops[side])>85||Math.abs(p.y+p.h-790)>90)continue;
   if(!e.state.bosses.some(b=>b.id===gate.boss&&b.dead)||(gate.emp&&side===0&&!e.state.abilities.emp)){e.ui.toast(gate.emp?'Credencial de Warden e EMP de Íris necessários.':'Derrote Matrona para liberar a porta de carga.');return true;}
   this.active={gate,side,time:0,moved:false,origin:{x:p.x,y:p.y}};this.state='locking_controls';e.world.map.regionPresentation=this.active;
   Object.assign(p,{vx:0,vy:0,hookCable:null,hookLiftTimer:0,hookCableTimer:0,dashTimer:0,attackTimer:0});e.keys.clear();e.pressed.clear();return true;
  }return e.tower.interact();
 }
 constrain(previousX){const p=this.e.state.player;if(this.active)return;if(this.e.state.network?.tutorialRequired&&!this.e.state.abilities.hook&&previousX<1390&&p.x+p.w>1390){p.x=1390-p.w;p.vx=0;}for(const g of ACCESS_GATES){if(previousX<g.x&&p.x+p.w>g.x){p.x=g.x-p.w;p.vx=0}if(previousX>=g.x&&p.x<g.x+10){p.x=g.x+10;p.vx=0}}}
 update(dt){const t=this.active;if(!t)return this.e.tower.update(dt);const e=this.e,p=e.state.player;t.time+=dt;e.keys.clear();e.pressed.clear();p.vx=p.vy=0;
  this.state=t.time<.15?'locking_controls':t.time<.7?'opening':t.time<1?'fade_out':t.time<1.1?'loading':t.time<1.2?'repositioning':t.time<2?'fade_in':'complete';
  if(t.time>=1&&!t.moved){
   try{
    p.x=t.gate.arrivals[t.side];p.y=790-p.h-3;
    for(const s of e.world.map.platforms)if(!s.disabled&&s.h>=70&&p.x+p.w>s.x&&p.x<s.x+s.w&&p.y+p.h>s.y&&p.y<s.y+s.h)throw Error('Destino bloqueado');
    Object.assign(p,{grounded:false,doubleJumpUsed:false,fall:false,invuln:2,facing:t.side? -1:1});
    for(const enemy of e.enemies){enemy.projectiles=[];enemy.pendingAttack=null;enemy.windupTimer=0;}
    e.effects.clear();syncProgress(e.state);e.state.lastRegion=e.state.region;e.state.checkpoint=travelCheckpoint(e.state,e.state.currentMap,towerFloorAt(p.x)?.id);p.checkpoint={...e.state.checkpoint};e.camera.arena=null;e.tower.syncCamera(true);e.requestRegionAssets();saveGame(e.state);t.moved=true;
   }catch(error){Object.assign(p,t.origin);this.active=null;e.world.map.regionPresentation=null;this.state='idle';e.ui.toast('Acesso indisponível. Tente novamente.');return false;}
  }
  e.world.update(dt);e.render(false);const c=e.ctx;
  const alpha=t.time<.7?0:t.time<1?(t.time-.7)/.3:t.time<1.25?1:Math.max(0,1-(t.time-1.25)/.75);
  c.save();c.fillStyle='#030a12';c.globalAlpha=alpha;c.fillRect(0,0,e.canvas.width,e.canvas.height);c.globalAlpha=Math.min(1,alpha*2);c.fillStyle='#98ddd9';c.font='16px monospace';c.textAlign='center';c.fillText(t.side?t.gate.back:t.gate.title,e.canvas.width/2,e.canvas.height/2);c.restore();
  if(t.time>=2){this.active=null;this.state='idle';e.world.map.regionPresentation=null;e.keys.clear();e.pressed.clear();}return true;
 }
}
export function drawAccessGates(c,state,map){
 for(const g of ACCESS_GATES){if(Math.abs(state.player.x-g.x)>1400)continue;const authorized=state.bosses.some(b=>b.id===g.boss&&b.dead)&&(!g.emp||state.abilities.emp||state.player.x>=5200),ride=map.regionPresentation,opening=ride?.gate.id===g.id?Math.min(1,ride.time/.7):0;
  c.fillStyle='#101c26';c.fillRect(g.x-66,470,142,320);c.fillStyle='#64747b';c.fillRect(g.x-62,470,134,16);
  for(const dx of [-64,60]){c.fillStyle='#3b4c57';c.fillRect(g.x+dx,486,12,304);c.fillStyle=authorized?'#62d9d3':'#d94c62';c.fillRect(g.x+dx+3,505,3,90);}
  const dh=280*(1-opening);c.fillStyle='#283842';c.fillRect(g.x-49,510,98,dh);for(let y=520;y<510+dh;y+=28){c.fillStyle='#53616a';c.fillRect(g.x-44,y,88,3);c.fillStyle='#a3834d';c.fillRect(g.x-44,y+5,12,5);}
  c.fillStyle='#13222c';c.fillRect(g.x-180,565,74,108);for(let y=578;y<670;y+=17){c.fillStyle='#4a5a63';c.fillRect(g.x-174,y,62,4);}
  c.font='11px monospace';c.textAlign='center';c.fillStyle='#a4bac2';c.fillText('AURORA DYNAMICS',g.x,450);c.font='9px monospace';c.fillStyle='#c57b75';c.fillText('ACESSO RESTRITO / SEGURANÇA',g.x,463);
  for(const sx of g.stops){c.fillStyle='#354a55';c.fillRect(sx-13,733,26,57);c.fillStyle=authorized?'#63dfce':'#e75066';c.fillRect(sx-8,739,16,17);if(Math.abs(state.player.x-sx)<125){c.font='11px monospace';c.fillText(primaryKey('interact')+' · '+(authorized?'ACESSAR':'BLOQUEADO'),sx,716);}}
 }
}
