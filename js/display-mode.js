export class FullscreenController{
 constructor(stage,onChange=()=>{}){this.stage=stage;this.onChange=onChange;this.message='';this.listeners=new Set();document.addEventListener('fullscreenchange',()=>{this.message='';this.update();this.onChange()});this.update()}
 get supported(){return typeof this.stage.requestFullscreen==='function'&&typeof document.exitFullscreen==='function'&&document.fullscreenEnabled!==false}
 get active(){return document.fullscreenElement===this.stage}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 async toggle(){
  if(!this.supported){this.message='Tela cheia indisponível neste navegador. O modo janela continua funcionando.';this.update();return false}
  try{if(this.active)await document.exitFullscreen();else await this.stage.requestFullscreen();this.message='';this.update();return true}
  catch{this.message='Não foi possível mudar o modo de exibição. Tente novamente pelo botão ou use o modo janela.';this.update();return false}
 }
 update(){for(const b of document.querySelectorAll('[data-fullscreen]')){const label=this.active?'SAIR DA TELA CHEIA':'TELA CHEIA';b.textContent=b.hasAttribute('data-icon')?'⛶':label;b.setAttribute('aria-label',label);b.title=label;b.setAttribute('aria-pressed',String(this.active))}for(const fn of this.listeners)fn()}
}
