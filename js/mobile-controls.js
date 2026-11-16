import{touchPreference}from'./input.js';

// Optional UI adapter. Pointer sources never masquerade as keyboard keys.
export class MobileControls{
 constructor({stage,getEngine,pause,fullscreen}){
  this.getEngine=getEngine;this.screens=[...stage.querySelectorAll('.screen')];this.pointers=new Map();this.mode=touchPreference();this.coarse=matchMedia('(any-pointer: coarse)');this.primary=matchMedia('(pointer: coarse)');this.portrait=matchMedia('(orientation: portrait)');this.continued=false;
  const root=this.root=document.createElement('div');root.className='touch-controls hidden';root.setAttribute('aria-label','Controles na tela');
  const button=(action,label,icon)=>`<button type="button" data-action="${action}" aria-label="${label}"><b aria-hidden="true">${icon}</b><span>${label}</span></button>`;
  root.innerHTML='<div class="touch-movement">'+button('moveLeft','Esquerda','◀')+button('moveDown','Baixo','▼')+button('moveRight','Direita','▶')+'</div><div class="touch-actions">'+button('special','Especial','⌁')+button('dash','Dash','»')+button('interact','Interagir','E')+button('attack','Ataque','✧')+button('jump','Pular','↑')+'</div><div class="touch-quick">'+button('pause','Pausa','Ⅱ')+button('fullscreen','Tela cheia','⛶')+button('cycleImplant','Implante','↻')+button('activateImplant','Ativar','ϟ')+'</div>';
  stage.append(root);
  const rotate=this.rotate=document.createElement('div');rotate.className='rotate-prompt hidden';rotate.innerHTML='<p>Para uma experiência melhor, vire o celular na horizontal.</p><button type="button">CONTINUAR ASSIM</button>';stage.append(rotate);
  rotate.querySelector('button').onclick=()=>{this.continued=true;this.sync()};
  root.addEventListener('contextmenu',e=>e.preventDefault());
  root.addEventListener('pointerdown',e=>{
   const b=e.target.closest('button');if(!b||!this.allowed()||this.rotateVisible)return;
   const action=b.dataset.action;
   e.preventDefault();e.stopPropagation();
   if(action==='pause'){this.clear();pause();this.sync();return}
   const engine=getEngine();this.pointers.set(e.pointerId,{b,action,input:engine.input});b.setPointerCapture(e.pointerId);b.classList.add('pressed');engine.input.setAction(action,'touch:'+e.pointerId,true);
   if(action==='interact'){engine.input.consume(action);engine.interact();this.sync()}
  });
  // Let the browser finish touchend and grant transient user activation first.
  root.addEventListener('pointerup',e=>{if(this.pointers.get(e.pointerId)?.action==='fullscreen'&&this.allowed()){this.clear();requestAnimationFrame(()=>fullscreen())}});
  root.addEventListener('click',e=>{if(e.detail!==0||!this.allowed())return;const action=e.target.closest('button')?.dataset.action;if(action==='pause'){this.clear();pause();this.sync()}else if(action==='fullscreen'){this.clear();fullscreen()}});
  const release=e=>{const p=this.pointers.get(e.pointerId);if(!p)return;p.input.setAction(p.action,'touch:'+e.pointerId,false);this.pointers.delete(e.pointerId);if(![...this.pointers.values()].some(v=>v.b===p.b))p.b.classList.remove('pressed');if(p.b.hasPointerCapture(e.pointerId))p.b.releasePointerCapture(e.pointerId)};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(type,release);
  root.addEventListener('pointermove',e=>{const p=this.pointers.get(e.pointerId);if(!p)return;const r=p.b.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)release(e)});
  for(const type of ['blur','orientationchange','resize','pagehide'])window.addEventListener(type,()=>{this.clear();this.sync()});
  for(const type of ['fullscreenchange','webkitfullscreenchange','visibilitychange'])document.addEventListener(type,()=>{this.clear();this.sync()});
  window.addEventListener('touchpreferencechange',e=>{this.mode=e.detail;this.clear();this.sync()});
  for(const media of [this.coarse,this.primary,this.portrait]){const changed=()=>{this.clear();if(!this.portrait.matches)this.continued=false;this.sync()};if(media.addEventListener)media.addEventListener('change',changed);else media.addListener(changed)}
  // Observe overlay visibility only; HUD updates must not trigger input work.
  this.observer=new MutationObserver(()=>this.sync());stage.querySelectorAll('.screen,#asset-lab').forEach(el=>this.observer.observe(el,{attributes:true,attributeFilter:['class']}));this.sync();
 }
 enabled(){return this.mode==='always'||this.mode==='auto'&&(this.coarse.matches||this.primary.matches||navigator.maxTouchPoints>0)}
 allowed(){const e=this.getEngine();return !!e&&!e.paused&&!e.state.player.dead&&!document.hidden&&!e.assetLab.open&&!e.network.session&&!this.screens.some(el=>!el.classList.contains('hidden'))}
 clear(){const held=[...this.pointers];this.pointers.clear();this.getEngine()?.input.clearActions();for(const [id,p]of held){p.input.setAction(p.action,'touch:'+id,false);p.b.classList.remove('pressed');if(p.b.hasPointerCapture(id))p.b.releasePointerCapture(id)}}
 sync(){const enabled=this.enabled(),layout=this.mode==='always'||this.coarse.matches||this.primary.matches||navigator.maxTouchPoints>0,allowed=this.allowed();const e=this.getEngine();if(e)e.world.mobileGraphics=layout;this.rotateVisible=enabled&&allowed&&this.portrait.matches&&!this.continued;const visible=enabled&&allowed&&!this.rotateVisible;if(!visible&&this.pointers.size)this.clear();const full=!!(document.fullscreenElement||document.webkitFullscreenElement),signature=Number(layout)+','+Number(visible)+','+Number(this.rotateVisible)+','+full;if(signature===this.signature)return;this.signature=signature;document.documentElement.classList.toggle('mobile-layout',layout);this.rotate.classList.toggle('hidden',!this.rotateVisible);this.root.classList.toggle('hidden',!visible);const b=this.root.querySelector('[data-action="fullscreen"]');b.setAttribute('aria-pressed',String(full));b.setAttribute('aria-label',full?'Sair da tela cheia':'Tela cheia')}
}
