import{ACTIONS,controls,keyLabel,keyName,canonical,codeOf,validBinding}from'./input.js';
export class SettingsMenu{
 constructor(){this.capture=null;this.pending=null;this.confirmReset=false;this.root=null;this.clearInput=()=>{};this.canCapture=()=>true;this.fullscreen=null;this.tab='controls'}
 configure({clearInput,canCapture,fullscreen}){this.clearInput=clearInput;this.canCapture=canCapture;this.fullscreen=fullscreen;fullscreen.subscribe(()=>{if(this.root?.isConnected&&this.tab==='video')this.updateVideo()})}
 close(){this.capture=null;this.pending=null;this.confirmReset=false;this.root=null;this.clearInput()}
 render(root,tab='controls'){
  this.root=root;this.tab=tab;
  root.innerHTML=tab==='video'?'<section class="settings-video"><h3>VÍDEO</h3><p id="video-mode"></p><button type="button" data-fullscreen>TELA CHEIA</button><p id="video-message" role="status"></p><p>A imagem mantém a proporção 16:9 e os pixels nítidos. Barras pretas podem aparecer. O modo de tela cheia precisa ser ativado por você; F11 pertence ao navegador.</p></section>':
   '<section class="settings-controls"><h3>CONTROLES</h3><p>Selecione ALTERAR e pressione uma tecla. Esc cancela a captura e permanece disponível para pausar. Setas e clique continuam como alternativas, salvo substituição confirmada.</p><div class="binding-list">'+Object.entries(ACTIONS).map(([id,a])=>`<div class="binding-row"><span>${a.name}</span><kbd>${keyLabel(id)}</kbd><button type="button" data-rebind="${id}" aria-label="Alterar ${a.name}">${this.capture===id?'PRESSIONE UMA TECLA':'ALTERAR'}</button></div>`).join('')+'</div><div id="binding-status" role="status" aria-live="polite"></div><div id="binding-confirm"></div><button type="button" id="restore-controls">RESTAURAR PADRÕES</button><p>Descer por plataformas ainda não está disponível nesta versão. Nos desafios de rede, 1–4 respondem às alternativas; não trocam equipamento. G e F3 continuam reservados às ferramentas de desenvolvimento.</p></section>';
  root.querySelectorAll('[data-rebind]').forEach(b=>b.onclick=()=>{if(!this.canCapture())return;this.capture=b.dataset.rebind;this.pending=null;this.confirmReset=false;this.clearInput();this.redraw();this.root.querySelector(`[data-rebind="${this.capture}"]`).focus({preventScroll:true});this.status('PRESSIONE UMA TECLA · Esc cancela.')});
  const restore=root.querySelector('#restore-controls');if(restore)restore.onclick=()=>{this.capture=null;this.pending=null;this.confirmReset=true;this.confirm('Restaurar todos os controles padrão?','RESTAURAR',()=>{controls.reset();this.confirmReset=false;this.redraw();this.status('Controles padrão restaurados.');this.root.querySelector('#restore-controls').focus()})};
  root.querySelector('[data-fullscreen]')?.addEventListener('click',()=>this.fullscreen?.toggle());this.updateVideo();
 }
 redraw(){const position=this.root.scrollTop;this.render(this.root,this.tab);this.root.scrollTop=position}
 status(message){const el=this.root?.querySelector('#binding-status');if(el)el.textContent=message}
 confirm(message,label,accept){const el=this.root.querySelector('#binding-confirm');el.replaceChildren();const text=document.createElement('p');text.textContent=message;el.append(text);for(const [name,action]of [[label,accept],['CANCELAR',()=>{this.pending=null;this.confirmReset=false;el.replaceChildren();this.status('Alteração cancelada.')} ]]){const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=action;el.append(b)}el.querySelector('button:last-child').focus()}
 handleCapture(event){
  if(!this.capture)return false;
  if(event.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return false;
  if(event.repeat){event.preventDefault();return true}
  const code=canonical(codeOf(event));
  if(code==='Escape'){event.preventDefault();const action=this.capture;this.capture=null;this.redraw();this.root.querySelector(`[data-rebind="${action}"]`).focus();this.status('Alteração cancelada.');this.clearInput();return true}
  if(event.ctrlKey||event.altKey||event.metaKey||!validBinding(code)||code==='Mouse0'){
   // Do not intercept browser shortcuts such as F5, F11, Alt+Tab or Ctrl+R.
   if(!event.ctrlKey&&!event.altKey&&!event.metaKey&&!/^F(?:5|11|12)$/.test(code))event.preventDefault();
   this.status('Tecla ou combinação reservada. Escolha outra tecla.');return true;
  }
  event.preventDefault();const action=this.capture,proposal=controls.proposal(action,code);if(!proposal){this.status('Tecla reservada. Escolha outra.');return true}
  this.capture=null;this.clearInput();this.redraw();
  if(proposal.owner){this.pending=proposal;this.confirm(`${keyName(code)} já está em ${ACTIONS[proposal.owner].name}. Ao substituir, essa ação ficará em ${proposal.bindings[proposal.owner].map(keyName).join(' / ')}.`, 'SUBSTITUIR',()=>this.commit(proposal))}
  else this.commit(proposal);
  return true;
 }
 commit(proposal){controls.apply(proposal);this.pending=null;this.clearInput();this.redraw();this.status(controls.saveError?'Controles aplicados, mas o navegador não permitiu salvar as preferências.':'Controle atualizado e salvo.');this.root.querySelector(`[data-rebind="${proposal.action}"]`)?.focus({preventScroll:true})}
 updateVideo(){if(this.tab!=='video'||!this.root)return;const mode=this.root.querySelector('#video-mode'),message=this.root.querySelector('#video-message'),button=this.root.querySelector('[data-fullscreen]');if(!mode||!this.fullscreen)return;mode.textContent='Modo de exibição: '+(this.fullscreen.active?'TELA CHEIA':'JANELA');message.textContent=this.fullscreen.message||(!this.fullscreen.supported?'Tela cheia não disponível neste navegador.':'Esc também pode sair da tela cheia pelo navegador.');button.textContent=this.fullscreen.active?'SAIR DA TELA CHEIA':'TELA CHEIA';button.disabled=!this.fullscreen.supported;button.setAttribute('aria-pressed',String(this.fullscreen.active))}
}
export const settingsMenu=new SettingsMenu();
