import{networkQuestion,networkChallenge,NETWORK_DIFFICULTIES,TUTORIAL_QUESTION}from'./network-terminals.js';
import{answerNetworkQuestion}from'./upgrades.js';
import{terminalText,YARA_DIALOGUES}from'./dialogue.js';
import{saveGame}from'./save.js';
import{setDialoguePortrait}from'./dialogue-portraits.js';
import{matchesAction,controlText}from'./input.js';

// Reuses the game's dialogue modal, pause flag, buttons and story event handler.
export class NetworkTerminalController{
 constructor(engine){this.e=engine;this.session=null;this.previousFocus=null;}
 interact(){
  const e=this.e,p=e.state.player;if(this.session)return true;
  const nearby=e.world.map.terminals.filter(t=>t.questionId).map(t=>({t,d:Math.hypot(p.x+p.w/2-t.x,p.y+p.h-t.y)})).filter(v=>v.d<100).sort((a,b)=>a.d-b.d)[0];
  if(!nearby)return false;
  // A refuge can still be used beside a terminal by standing closer to it.
  if(e.world.map.checkpoints.some(cp=>Math.hypot(p.x+p.w/2-cp.x,p.y+p.h-790)<nearby.d))return false;
  // Shared consoles must not swallow the original nearby collectible interaction.
  if(e.world.map.secrets.some(s=>!e.state.items.includes(s.item)&&Math.abs(p.x+p.w/2-s.x)<56&&Math.abs(p.y+p.h-s.y)<68&&Math.hypot(p.x+p.w/2-s.x,p.y+p.h-s.y)<nearby.d))return false;
  const q=networkChallenge(networkQuestion(nearby.t.questionId));
  if(q.id===TUTORIAL_QUESTION&&!e.state.events.includes('yara-reunion')&&!e.state.abilities.hook){e.ui.toast('Fale com Yara antes de acessar o terminal ao lado dela.');return true;}
  this.previousFocus=document.activeElement;this.session={q,terminal:nearby.t,stage:'story',hintOpen:false};
  e.paused=true;e.keys.clear();e.pressed.clear();p.vx=0;
  e.dialogNpc=null;e.dialogEvent=null;e.dialogService=null;
  e.recordTerminal(nearby.t);saveGame(e.state);
  document.querySelector('#dialog-screen').classList.add('network-screen');
  this.showStory();return true;
 }
 completed(){return this.e.state.network.completedTerminalIds.includes(this.session.q.id)}
 title(q){const d=NETWORK_DIFFICULTIES[q.difficulty];return '['+d.rank+'] '+d.label+' · '+q.terminalTitle;}
 showStory(){const {q,terminal}=this.session,done=this.completed();this.removeYaraHelp();this.session.stage=done?'archive':'story';document.querySelector('#dialog-screen').classList.remove('network-denied');
  this.e.ui.showDialogActions(this.title(q),'REGISTRO DA REDE\n\n'+terminalText(terminal)+(terminal.text===q.storyLog?'':'\n\n'+q.storyLog)+(done?'\n\nCONCLUÍDO · Recompensa já instalada.':''),done?[]:[{label:'INICIAR AUTENTICAÇÃO',action:()=>this.showQuestion()}]);
  this.decorate(done?'FECHAR · E / ESC':'AUTENTICAR · E / ENTER');
 }
 choices(q){return q.options.map((option,i)=>({label:(i+1)+'. '+option,action:()=>this.answer(i)}));}
 showQuestion(){if(!this.session||this.completed())return;this.session.stage='question';delete this.session.lastAnswer;const q=this.session.q;document.querySelector('#dialog-screen').classList.remove('network-denied');document.querySelector('#dialog-text').removeAttribute('role');
  this.e.ui.showDialogActions(this.title(q),'AUTENTICAÇÃO DE REDE · '+q.topic+'\n\n'+q.question,this.choices(q));
  this.markAnswers();this.mountYaraHelp();
  this.decorate('FECHAR · E / ESC');
 }
 answer(index){if(!['question','failure'].includes(this.session?.stage))return;
  this.session.stage='validating';this.session.lastAnswer=index;const q=this.session.q,result=answerNetworkQuestion(this.e.state,q.id,index);
  this.session.stage=result.correct?'success':'failure';
  const heading=result.correct?'AUTENTICAÇÃO BEM-SUCEDIDA':'ACESSO RECUSADO';
  this.e.ui.showDialogActions(this.title(q),(result.correct?'':q.question+'\n\n')+heading+'\n\n'+q.explanation+(result.correct?'\n\n'+(result.rewardGranted?'Módulo instalado: '+q.reward.label:'Recompensa já instalada.')+(result.implantLabel?'\nImplante adquirido: '+result.implantLabel+'. Q seleciona · F ativa.':''):'\n\n'+(q.id===TUTORIAL_QUESTION?'Yara: Leia a explicação e tente novamente. Ninguém vai ficar para trás por errar uma questão.':'Revise o conceito e tente novamente. Você não perdeu vida.')), [{label:result.correct?'CONTINUAR':'TENTAR NOVAMENTE',action:()=>result.correct?this.finish():this.showQuestion()},...(result.correct?[]:this.choices(q))]);
  if(result.correct)this.removeYaraHelp();else{this.markAnswers();this.mountYaraHelp();}
  document.querySelector('#dialog-screen').classList.toggle('network-denied',!result.correct);
  document.querySelector('#dialog-text').setAttribute('role','status');
  if(result.correct){this.e.ui.toast(result.implantLabel?'Implante adquirido: '+result.implantLabel:q.id===TUTORIAL_QUESTION?'Implante desbloqueado: Gancho magnético':q.reward.label);this.e.ui.update(this.e.state);saveGame(this.e.state);}
  this.decorate(result.correct?'CONTINUAR · E / ENTER':'TENTAR NOVAMENTE · E / ENTER');
 }
 markAnswers(){const skip=this.session.stage==='failure'?1:0;[...document.querySelectorAll('#dialog-actions button')].slice(skip).forEach((button,i)=>{button.dataset.networkAnswer=String(i);button.dataset.lastAnswer=String(this.session.lastAnswer===i);});}
 mountYaraHelp(){
  const dialog=document.querySelector('#dialog-screen .dialog'),q=this.session.q;let root=dialog.querySelector('#yara-help');
  if(root&&root.dataset.questionId!==q.id){root.remove();root=null;}
  if(!root){
   root=document.createElement('section');root.id='yara-help';root.dataset.questionId=q.id;
   root.innerHTML='<button id="yara-help-toggle" type="button" aria-expanded="false" aria-controls="yara-hint-panel">PEDIR DICA À YARA</button><aside id="yara-hint-panel" class="hidden yara-comm" role="region" aria-labelledby="yara-hint-heading"><header><span class="portrait-frame yara-portrait"><img alt="Yara" width="96" height="96"></span><div><span class="yara-signal" aria-hidden="true"><i></i><i></i><i></i></span><strong id="yara-hint-heading">YARA — CONEXÃO ESTABELECIDA</strong></div></header><p id="yara-hint-text" aria-live="polite"></p><button id="yara-hint-close" type="button" aria-describedby="yara-hint-text">FECHAR DICA · ESC</button></aside>';
   dialog.insertBefore(root,document.querySelector('#dialog-close'));
   setDialoguePortrait(root.querySelector('.yara-portrait'),'Yara');
   root.querySelector('#yara-hint-text').textContent=q.hint;
   const toggle=root.querySelector('#yara-help-toggle'),close=root.querySelector('#yara-hint-close');
   toggle.onclick=()=>this.setHintOpen(!this.session?.hintOpen);close.onclick=()=>this.setHintOpen(false);
   for(const button of [toggle,close])button.onkeydown=event=>{if(event.key===' '){event.preventDefault();event.stopPropagation();button.click();}};
  }
  this.setHintOpen(this.session.hintOpen===true,false);
 }
 setHintOpen(open,focus=true){
  if(!this.session||!['question','failure'].includes(this.session.stage))return;
  const root=document.querySelector('#yara-help');if(!root)return;
  const dialog=document.querySelector('#dialog-screen .dialog');
  if(open&&!this.session.hintOpen&&focus)this.session.hintScrollTop=dialog.scrollTop;
  this.session.hintOpen=open;
  root.querySelector('#yara-help-toggle').setAttribute('aria-expanded',String(open));root.querySelector('#yara-hint-panel').classList.toggle('hidden',!open);
  dialog.classList.toggle('yara-help-open',open);
  if(focus){root.querySelector(open?'#yara-hint-close':'#yara-help-toggle').focus({preventScroll:true});if(open)root.querySelector('#yara-hint-panel').scrollIntoView({block:'nearest'});else dialog.scrollTop=this.session.hintScrollTop||0;}
 }
 removeYaraHelp(){document.querySelector('#yara-help')?.remove();document.querySelector('#dialog-screen .dialog').classList.remove('yara-help-open');if(this.session)this.session.hintOpen=false;}
 finish(){if(!this.session)return;const tutorial=this.session.q.id===TUTORIAL_QUESTION&&this.session.stage==='success';this.dismiss();
  if(tutorial){this.e.dialogEvent='yara-network-training';this.e.ui.showConversation(YARA_DIALOGUES.networkSuccess.lines);this.e.paused=true;}else this.e.closeDialog();
 }
 advance(){if(!this.session)return false;
  const stage=this.session.stage;if(stage==='story'||stage==='failure')this.showQuestion();else if(stage==='success')this.finish();else this.e.closeDialog();return true;
 }
 decorate(closeLabel){
  const screen=document.querySelector('#dialog-screen');screen.classList.add('network-screen');
  screen.dataset.difficulty=this.session.q.difficulty;
  document.querySelector('#dialog-text').style.whiteSpace='pre-line';document.querySelector('#dialog-close').textContent=controlText(closeLabel);
  document.querySelector('#dialog-screen .dialog').scrollTop=0;
  const buttons=[...screen.querySelectorAll('button')].filter(b=>!b.disabled&&!b.closest('.hidden'));buttons[0]?.focus({preventScroll:true});
 }
 dismiss(){this.removeYaraHelp();this.session=null;const screen=document.querySelector('#dialog-screen');screen.classList.remove('network-screen','network-denied');delete screen.dataset.difficulty;document.querySelector('#dialog-text').style.whiteSpace='';document.querySelector('#dialog-text').removeAttribute('role');this.e.keys.clear();this.e.pressed.clear();this.previousFocus?.focus?.({preventScroll:true});this.previousFocus=null;}
 keydown(event){
  if(!this.session)return;const key=event.key.toLowerCase();
  if(key==='tab'){const buttons=[...document.querySelectorAll('#dialog-screen button')].filter(b=>!b.disabled&&!b.closest('.hidden'));const index=buttons.indexOf(document.activeElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();return;}
  if(key==='escape'){event.preventDefault();if(this.session.hintOpen)this.setHintOpen(false);else this.e.closeDialog();return;}
  if(event.repeat){event.preventDefault();return;}
  if(/^[1-4]$/.test(key)&&['question','failure'].includes(this.session.stage)){event.preventDefault();this.answer(Number(key)-1);return;}
  if(matchesAction('interact',event)||key==='enter'){if(key==='enter'&&event.target.closest?.('#dialog-screen button'))return;event.preventDefault();this.advance();return;}
  if([' ','arrowleft','arrowright','arrowup','arrowdown','j','k','shift'].includes(key))event.preventDefault();
 }
}
