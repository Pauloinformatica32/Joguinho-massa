import{Engine,newState}from'./engine.js';import{UI}from'./ui.js';import{loadGame,saveGame,hasSave}from'./save.js';
import{ACTIONS,controls,keyLabel,primaryKey,canonical,codeOf,matchesAction}from'./input.js';
import{settingsMenu}from'./settings-ui.js';
const $=s=>document.querySelector(s);let engine=null,state=null,ui=null,last=performance.now(),menuOrigin='game',previousFocus=null;
const title=$('#title-screen'),pause=$('#pause-screen'),dialog=$('#dialog-screen');
const clearInput=()=>{engine?.keys.clear();engine?.pressed.clear()};
// Optional display support must never block menu or game initialization.
let fullscreen={active:false,supported:false,message:'Tela cheia não disponível neste navegador. O modo janela continua funcionando.',subscribe(){return()=>{}},toggle(){return false}};
function configureDisplay(){settingsMenu.configure({clearInput,canCapture:()=>!engine?.network.session,fullscreen});settingsMenu.updateVideo()}
configureDisplay();
function refreshInstructions(){
 const footer=$('.controls');footer.replaceChildren();
 for(const [action,label]of [['moveLeft','esquerda'],['moveRight','direita'],['moveDown','baixo'],['jump','pular'],['attack','atacar'],['dash','impulso'],['special','gancho / EMP'],['interact','interagir'],['equip1','implante 1'],['equip2','implante 2'],['equip3','implante 3'],['cycleImplant','alternar'],['activateImplant','ativar'],['map','mapa'],['pause','pausa']]){
  const span=document.createElement('span'),b=document.createElement('b');b.textContent=keyLabel(action);span.append(b,' '+label);footer.append(span);
 }
 const button=document.createElement('button');button.id='asset-lab-button';button.type='button';button.textContent='G · laboratório de assets';button.onclick=openAssetLab;footer.append(button);
}
function begin(next){settingsMenu.close();state=next;ui=new UI();engine=new Engine($('#game'),state,ui);title.classList.add('hidden');pause.classList.add('hidden');pause.classList.remove('title-settings');dialog.classList.add('hidden');$('#save-button').classList.remove('hidden');$('#resume-button').textContent='VOLTAR AO JOGO';ui.toast(`Sinal ativo · ${state.player.name}`);engine.render();if(state.events.includes('ending')){engine.paused=true;ui.showEnding(state)}}
function openAssetLab(){if(engine?.state.player.dead||engine?.network.session||!pause.classList.contains('hidden')||!dialog.classList.contains('hidden'))return;if(!engine)begin(newState($('#pilot-name').value.trim()||'Kael'));clearInput();engine.toggleAssetLab()}
function closeMenu(){settingsMenu.close();pause.classList.add('hidden');if(engine&&menuOrigin!=='title')engine.paused=false;clearInput();previousFocus?.focus?.({preventScroll:true});previousFocus=null}
function togglePause(force){
 if(!engine||engine.state.player.dead||engine.network.session||!dialog.classList.contains('hidden')||!$('#ending-screen').classList.contains('hidden'))return;
 const open=force??pause.classList.contains('hidden');if(!open){closeMenu();return}
 previousFocus=document.activeElement;menuOrigin='game';engine.paused=true;clearInput();pause.classList.remove('hidden','title-settings');$('#save-button').classList.remove('hidden');$('#resume-button').textContent='VOLTAR AO JOGO';ui.panel(state,'map');$('#resume-button').focus({preventScroll:true});
}
function openSettings(fromTitle=false){
 if(engine?.network.session||engine?.state.player.dead)return;previousFocus=document.activeElement;menuOrigin=fromTitle?'title':'game';if(engine)engine.paused=true;clearInput();ui??=new UI();pause.classList.remove('hidden');pause.classList.toggle('title-settings',fromTitle);$('#save-button').classList.toggle('hidden',fromTitle);$('#resume-button').textContent=fromTitle?'VOLTAR AO INÍCIO':'VOLTAR AO JOGO';ui.panel(state,'controls');pause.querySelector('[data-tab="controls"]').focus({preventScroll:true});
}
$('#new-game').onclick=()=>begin(newState($('#pilot-name').value.trim()||'Kael'));
$('#continue-game').disabled=!hasSave();$('#continue-game').onclick=()=>{const saved=loadGame();if(saved)begin(saved);else ui?.toast('Não existe uma gravação válida.')};
$('#title-settings').onclick=()=>openSettings(true);$('#pause-open').onclick=()=>togglePause();$('#stage-pause').onclick=()=>togglePause();$('#resume-button').onclick=closeMenu;
$('#save-button').onclick=()=>{if(state&&saveGame(state))ui.toast('Progresso guardado no abrigo local.')};$('#respawn-button').onclick=()=>engine?.respawn();
$('#asset-lab-close').onclick=()=>engine?.toggleAssetLab(false);
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{clearInput();settingsMenu.close();ui.panel(state,b.dataset.tab)});
document.querySelectorAll('[data-fullscreen]').forEach(b=>b.onclick=()=>fullscreen.toggle());
import('./display-mode.js').then(({FullscreenController})=>{
 fullscreen=new FullscreenController($('.stage'),clearInput);
 configureDisplay();
}).catch(error=>{console.warn('Tela cheia indisponível; o jogo continua em modo janela.',error)});
controls.subscribe(()=>{clearInput();refreshInstructions();if(ui&&state)ui.update(state)});refreshInstructions();
$('#ending-continue').onclick=()=>{$('#ending-screen').classList.add('hidden');engine.paused=false;clearInput();engine.render()};
$('#dialog-close').onclick=()=>{if(engine)engine.advanceDialog();else dialog.classList.add('hidden')};
window.addEventListener('keydown',event=>{
 if(settingsMenu.handleCapture(event))return;
 if(event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
 if(event.ctrlKey||event.altKey||event.metaKey)return;
 const code=canonical(codeOf(event));
 if(code==='Escape'&&fullscreen.active){clearInput();return} // Browser owns Escape while leaving fullscreen.
 if(engine?.state.player.dead)return;
 if(engine?.network.session){engine.network.keydown(event);return}
 if(!pause.classList.contains('hidden')){
  if(!event.repeat&&(code==='Escape'||matchesAction('pause',event))){event.preventDefault();if(settingsMenu.pending||settingsMenu.confirmReset){settingsMenu.pending=null;settingsMenu.confirmReset=false;settingsMenu.redraw();settingsMenu.status('Alteração cancelada.')}else closeMenu()}
  return; // Tab/Enter/Space retain native button navigation; no gameplay input.
 }
 if(!engine){if(event.key==='Enter'&&!event.target?.closest?.('button'))$('#new-game').click();if(code==='KeyG')openAssetLab();return}
 if(!$('#ending-screen').classList.contains('hidden'))return;
 if(engine.assetLab.open){if(!event.repeat&&(code==='KeyG'||code==='Escape'))engine.toggleAssetLab(false);return}
 if(!dialog.classList.contains('hidden')){
  if(event.key==='Enter'&&event.target?.closest?.('#dialog-screen button'))return;
  if(!event.repeat&&(matchesAction('interact',event)||event.key==='Enter')){event.preventDefault();clearInput();engine.advanceDialog()}return;
 }
 if(code==='F3'){event.preventDefault();if(!event.repeat){if(event.shiftKey){engine.debugLevel=!engine.debugLevel;engine.render(false)}else engine.toggleCombatDebug()}return}
 if(code==='KeyG'){if(!event.repeat)openAssetLab();return}
 if(matchesAction('pause',event)){if(!event.repeat){event.preventDefault();togglePause()}return}
 if(matchesAction('map',event)){if(!event.repeat){event.preventDefault();togglePause(true);ui.panel(state,'map')}return}
 if(engine.paused)return;
 if(Object.keys(ACTIONS).some(action=>matchesAction(action,event)))event.preventDefault();
 engine.keydown(event);
 if(engine.input.consume('interact')){engine.interact();if(!dialog.classList.contains('hidden'))engine.paused=true}
});
window.addEventListener('keyup',event=>engine?.keyup(event));window.addEventListener('blur',clearInput);window.addEventListener('focus',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput()});
$('#game').addEventListener('pointerdown',event=>{if(event.button===0&&engine&&!engine.paused&&!engine.state.player.dead&&pause.classList.contains('hidden')&&dialog.classList.contains('hidden'))engine.input.press('Mouse0')});
for(const type of ['pointerup','pointercancel'])window.addEventListener(type,()=>engine?.input.release('Mouse0'));
function frame(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(engine&&!engine.paused)engine.update(dt);else if(engine?.state.player.state==='death')engine.renderPausedDeath(dt);if(engine?.assetLab.open)engine.renderAssetLab(dt);requestAnimationFrame(frame)}requestAnimationFrame(frame);

// Explicit localhost-only developer session. Never writes campaign saves.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('towerTest')==='1'){
 const {TOWER_FLOORS,TOWER_ELEVATORS}=await import('./tower-layout.js');
 const {resetVespera,startVesperaAttack,restoreDefeatedVespera}=await import('./vespera.js');
 const test=newState();test.devTowerTest=true;test.bosses.slice(0,2).forEach(b=>{b.dead=true;b.health=0});
 begin(test);
 window.towerTest={
  engine,
  floor(number=1){const f=TOWER_FLOORS[number-1];if(!f)return;engine.tower.transition=null;state.player.x=f.checkpoint;state.player.y=733;state.player.vx=state.player.vy=0;state.checkpoint={x:f.checkpoint,y:733,region:2,floor:f.id,name:f.name};engine.tower.syncCamera(true);engine.render()},
  emp(owned=true){state.abilities.emp=owned},
  elevator(number=1,reverse=false){const lift=TOWER_ELEVATORS[number-1];if(!lift)return;state.player.x=lift.stops[reverse?1:0].x;state.player.y=733;engine.tower.syncCamera(true);engine.interact()},
  vespera(phase=1,attack=null){this.floor(3);state.events=state.events.filter(id=>!['ending','tower-central-shutdown','victory-boss-3','act-3'].includes(id));const b=state.bosses.find(b=>b.id==='boss-3');b.dead=false;b.active=true;b.health=phase===2?b.maxHealth/2:b.maxHealth;b.x=b.arena.spawnX;resetVespera(b);if(phase===2){b.phase=2;b.phaseTransitioned=true}state.player.x=b.x-85;state.player.y=736;engine.paused=false;document.querySelector('#ending-screen').classList.add('hidden');document.querySelector('#dialog-screen').classList.add('hidden');if(attack)startVesperaAttack(b,attack,state.player);engine.tower.syncCamera(true);engine.debugCombat=true;engine.render(false)},
  final(){this.floor(3);const b=state.bosses.find(b=>b.id==='boss-3');restoreDefeatedVespera(b);state.player.x=15410;engine.tower.syncCamera(true);engine.interact()}
 };window.towerTest.floor(1);
}
