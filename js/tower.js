import{TOWER_ELEVATORS,towerFloorAt}from'./tower-layout.js';
import{saveGame}from'./save.js';
export class TowerController{
 constructor(engine){this.e=engine;this.transition=null;this.barrierTimers={};this.syncCamera(true)}
 syncCamera(snap=false){const e=this.e,f=towerFloorAt(e.state.player.x);e.state.towerFloor=f?.id||null;e.camera.region=f||null;e.camera.arena=e.state.bosses.find(b=>b.active&&!b.dead)?.arena||null;if(snap)e.camera.update(e.state.player,e.canvas.width,e.canvas.height,15600,900,1)}
 interact(){const e=this.e,p=e.state.player,s=e.state;
  if(this.transition)return true;
  for(const lift of TOWER_ELEVATORS)for(let i=0;i<2;i++){
   const stop=lift.stops[i];if(Math.abs(p.x+p.w/2-stop.x)>86||Math.abs(p.y+p.h-790)>90)continue;
   if(!s.events.includes(lift.id)&&!s.abilities.emp){e.ui.toast('ACESSO RESTRITO — AUTORIZAÇÃO AURORA DYNAMICS. Obtenha o EMP com Íris após Warden.');return true}
   if(!s.events.includes(lift.id)){s.events.push(lift.id);p.pulseTimer=.3;e.ui.toast('EMP autorizado · trava desativada.')}else e.ui.toast('Elevador autorizado · portas abertas.');
   this.transition={time:0,lift,from:i,moved:false};e.world.map.liftPresentation=this.transition;p.vx=p.vy=0;p.hookCable=null;p.hookLiftTimer=p.hookCableTimer=p.dashTimer=p.attackTimer=0;e.keys.clear();e.pressed.clear();return true;
  }
  const t=e.world.map.terminals.find(t=>(t.barrier||t.id==='tower-central-shutdown')&&Math.hypot(p.x+p.w/2-t.x,p.y+p.h-t.y)<(t.barrier?160:105));
  if(!t)return false;
  if(!s.abilities.emp){e.ui.toast('EMP necessário. Retorne ao Complexo Industrial e fale com Íris.');return true}
  if(t.barrier){if(!s.events.includes(t.id))s.events.push(t.id);this.barrierTimers[t.id]=9;p.pulseTimer=.3;e.ui.toast('Barreira desativada por 9 segundos.');this.applyBarriers();saveGame(s);return true}
  if(!s.bosses.find(b=>b.id==='boss-3')?.dead){e.ui.toast('PROTOCOLO CENTRAL — TRANSMISSÃO GLOBAL ATIVA. Véspera mantém o bloqueio.');return true}
  if(s.events.includes('tower-central-shutdown')){e.ui.toast('REDE DESCONECTADA — CONTROLE CENTRAL DESATIVADO');return true}
  this.transition={time:0,shutdown:true};p.vx=p.vy=0;p.pulseTimer=.3;e.keys.clear();e.pressed.clear();return true;
 }
 applyBarriers(){for(const b of this.e.world.map.towerBarriers){b.solid.disabled=(this.barrierTimers[b.id]||0)>0}}
 update(dt){const e=this.e,p=e.state.player;
  for(const b of e.world.map.towerBarriers){let t=Math.max(0,(this.barrierTimers[b.id]||0)-dt);if(!t&&p.x+p.w>b.x&&p.x<b.x+b.w)t=.1;this.barrierTimers[b.id]=t}this.applyBarriers();
  const t=this.transition;if(!t)return false;t.time+=dt;p.vx=p.vy=0;e.keys.clear();e.pressed.clear();
  if(!t.shutdown&&!t.moved&&t.time>=.65){const stop=t.lift.stops[1-t.from];p.x=stop.arrivalX;p.y=790-p.h-3;p.grounded=false;p.doubleJumpUsed=false;p.fall=false;p.invuln=2;t.moved=true;this.syncCamera(true);const f=towerFloorAt(p.x);e.state.checkpoint={x:f.checkpoint,y:790-p.h-3,region:2,floor:f.id,name:f.name+' · Abrigo'};p.checkpoint={...e.state.checkpoint};e.state.lastRegion='corporate';saveGame(e.state);e.requestRegionAssets()}
  if(t.time>=1.5){this.transition=null;e.world.map.liftPresentation=null;p.invuln=2;if(t.shutdown){e.state.events.push('tower-central-shutdown','ending');e.ui.toast('REDE DESCONECTADA — CONTROLE CENTRAL DESATIVADO');saveGame(e.state);e.paused=true;e.ui.showEnding(e.state)}}
  e.world.update(dt);e.render(false);if(this.transition){const c=e.ctx;c.fillStyle=t.shutdown?'#250710cc':'#020a12';c.globalAlpha=Math.sin(Math.min(1,t.time/1.5)*Math.PI);c.fillRect(0,0,e.canvas.width,e.canvas.height);c.globalAlpha=1;c.fillStyle='#89f7ef';c.font='18px monospace';c.textAlign='center';c.fillText(t.shutdown?'DESCONECTANDO A REDE…':'ELEVADOR · '+(t.from===0?'SUBINDO':'DESCENDO'),e.canvas.width/2,e.canvas.height/2)}return true;
 }
 constrain(previousX){const p=this.e.state.player,f=towerFloorAt(previousX);if(!f)return;if(f.index===0&&p.x<f.left)return;p.x=Math.max(f.left,Math.min(f.right-p.w,p.x));this.syncCamera()}
}
export function drawTower(c,state,map,time){
 const f=towerFloorAt(state.player.x);if(!f)return;
 c.fillStyle=f.index===0?'#34434d':f.index===1?'#251e2c':'#190f22';c.fillRect(f.left,-1600,f.right-f.left,2390);
 for(let x=f.left+80;x<f.right;x+=280){c.fillStyle=f.index===0?'#bfdae122':'#14202c';c.fillRect(x,170,110,390);c.fillStyle=f.color;c.fillRect(x+5,176,3,370);if(f.index===1){c.fillStyle='#81ded42b';c.fillRect(x+16,210,70,280)}if(f.index===2)for(let y=210;y<550;y+=22)c.fillRect(x+20,y,50,3)}
 c.font='18px monospace';c.textAlign='left';c.fillStyle=f.color;c.fillText(f.name,f.left+220,130);c.font='12px monospace';c.fillText(f.objective,f.left+220,154);
 for(const lift of TOWER_ELEVATORS)for(const stop of lift.stops){if(stop.x<f.left||stop.x>f.right)continue;const open=state.events.includes(lift.id);c.fillStyle='#627781';c.fillRect(stop.x-64,610,128,180);c.fillStyle='#0a111c';c.fillRect(stop.x-52,620,104,170);c.fillStyle=open?'#224650':'#3d2635';const ride=map.liftPresentation,opening=ride?.lift.id===lift.id?Math.min(1,ride.time/.45):0,doorWidth=44*(1-opening);c.fillRect(stop.x-48,625,doorWidth,165);c.fillRect(stop.x+48-doorWidth,625,doorWidth,165);if(opening>0){c.fillStyle='#e4ffff';for(let i=0;i<5;i++)c.fillRect(stop.x-65+Math.sin(time*70+i)*14,650+i*5,3,3)}c.fillStyle=open?'#63ffec':'#ff3d61';c.fillRect(stop.x-60,650,9,25);c.font='11px monospace';c.textAlign='center';c.fillText(open?'E · VIAJAR':'E · AUTORIZAR EMP',stop.x,590);if(!open){c.font='8px monospace';c.fillText('ACESSO RESTRITO — AUTORIZAÇÃO AURORA DYNAMICS',stop.x,575)}}
 for(const b of map.towerBarriers){c.fillStyle=b.solid.disabled?'#40ffce44':'#ff315ca0';c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle=b.solid.disabled?'#40ffce':'#ff315c';c.fillRect(b.x+b.w+20,746,18,28);c.font='11px monospace';c.fillText(b.solid.disabled?'PASSAGEM TEMPORÁRIA':'E · EMP',b.panelX,720)}
 if(f.index===2){c.fillStyle='#151d2d';c.fillRect(15390,610,100,180);c.fillStyle=state.events.includes('tower-central-shutdown')?'#51ffd5':'#ff315c';for(let y=625;y<760;y+=22)c.fillRect(15400,y,80,8)}
}
