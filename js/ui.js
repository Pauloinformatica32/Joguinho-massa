import{REGIONS,MAP_ROOMS,regionAt}from'./map.js';
import{ABILITY_INFO}from'./abilities.js';
import{objective,defeated,teoObjective}from'./campaign.js';
import{LOGS}from'./dialogue.js';
import{networkTotals}from'./upgrades.js';
import{IMPLANTS,implantStatus,activeImplantId,implantIcon}from'./cybernetics.js';
export class UI{
 constructor(){this.toastEl=document.querySelector('#toast');this.toastTimer=0;this.panelTab='map'}
 toast(message){this.toastEl.textContent=message;this.toastEl.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.toastEl.classList.remove('show'),3000)}
 update(state){
  const p=state.player;
  this.implantHUD(state);
  document.querySelector('#health-fill').style.width=`${p.health/p.maxHealth*100}%`;
  document.querySelector('#health-text').textContent=`${Math.ceil(p.health)} / ${p.maxHealth}`;
  document.querySelector('#energy-fill').style.width=`${p.energy/p.maxEnergy*100}%`;
  document.querySelector('#energy-text').textContent=`${Math.floor(p.energy)} / ${p.maxEnergy}`;
  document.querySelector('#credits-label').textContent=state.credits??40;
  const r=regionAt(p.x);document.querySelector('#area-label').textContent=`${r.name.toUpperCase()} · ${r.subtitle}`;
  document.querySelector('#objective').textContent=[objective(state),teoObjective(state),'E para interagir'].filter(Boolean).join(' · ');
  const boss=state.bosses.find(b=>b.active&&!b.dead);
  document.querySelector('#boss-hud').classList.toggle('hidden',!boss);
  if(boss){document.querySelector('#boss-name').textContent=boss.name+(boss.attackType==='windup'?' · DEFESA ATIVA':' · VULNERÁVEL');document.querySelector('#boss-fill').style.width=`${boss.health/boss.maxHealth*100}%`}
 }
 implantHUD(state){const hud=document.querySelector('#implant-hud');if(!hud)return;const selected=state.network?.selectedImplant,active=activeImplantId(state.player),status=implantStatus(state.player,selected),item=IMPLANTS[selected];
  const blocked=active&&active!==selected;
  const content=item?`<div class="implant-equipped" data-status="${blocked&&status.state==='ready'?'busy':status.state}">${implantIcon(selected)}<span><strong>${item.short} <kbd>F</kbd></strong><small>${blocked&&status.state==='ready'?'AGUARDE · outro efeito ativo':status.text}</small>${status.state==='active'?'<small>Recarga: '+status.cooldown.toFixed(1)+' s</small>':''}</span></div>${blocked?'<small class="implant-other-active">ATIVO: '+IMPLANTS[active].short+' · '+state.player.cybernetics.active[active].toFixed(1)+' s</small>':''}<small>1–3 equipar · Q alternar</small>`:'<div class="implant-equipped" data-status="locked">'+implantIcon('firewall')+'<span><strong>Nenhum implante</strong><small>BLOQUEADO · Terminais difíceis</small></span></div>';
  if(hud.innerHTML!==content)hud.innerHTML=content;
 }
 panel(state,tab=this.panelTab){
  this.panelTab=tab;const title=document.querySelector('#panel-title'),content=document.querySelector('#panel-content');
  document.querySelector('#pause-screen').classList.toggle('inventory-mode',tab==='implants'||tab==='controls');
  document.querySelector('#pause-screen .panel').classList.toggle('implant-inventory',tab==='implants'||tab==='controls');
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  if(tab==='map'){
   title.textContent='MAPA DE NOVA AURORA';
   content.innerHTML='<div class="map-route">'+MAP_ROOMS.map(room=>{
    const seen=state.explored.includes(room.id),current=state.currentRoom===room.id;
    const gate=room.id===2?(defeated(state,'boss-0')?'INDUSTRIAL LIBERADO':'MATRONA'):room.id===5?(defeated(state,'boss-2')?'TORRE LIBERADA':'WARDEN'):room.id===8?'VÉSPERA':'';
    return `<div class="map-node ${seen?'seen':''} ${current?'current':''}"><small>${room.id+1} · ${REGIONS[room.region].name}</small><strong>${seen?room.name:'ÁREA NÃO EXPLORADA'}</strong><small class="gate-note">${gate}</small></div>`;
   }).join('')+'</div><p>Três atos conectados. As passagens abertas permitem retornar. E ativa abrigos, diálogos e terminais; os pontos amarelos aceitam o gancho (K).</p>';
  }else if(tab==='implants'){
   title.textContent='IMPLANTES';const equipped=state.network?.selectedImplant,active=activeImplantId(state.player);
   content.innerHTML='<p class="implant-menu-help">Equipe um implante por vez. Equipar não ativa. <b>1 / 2 / 3</b> equipa durante o jogo; <b>Q</b> alterna e <b>F</b> ativa. Trocar preserva efeitos e recargas.</p>'+(active?'<p class="implant-active-note">Efeito em andamento: '+IMPLANTS[active].name+' · '+state.player.cybernetics.active[active].toFixed(1)+' s. Aguarde terminar antes de ativar outro.</p>':'')+'<div class="implant-grid">'+Object.entries(IMPLANTS).map(([id,item],index)=>{
    const owned=state.network?.unlockedImplants?.includes(id),chosen=id===equipped,status=implantStatus(state.player,id),regions=['Setor 9','Complexo Industrial','Torre Aurora'];
    return `<article class="implant-card ${owned?'unlocked':'locked'} ${chosen?'equipped':''}" data-implant="${id}"><header>${implantIcon(id)}<h3>${item.name}</h3></header><span class="implant-unlock">${owned?'LIBERADO':'BLOQUEADO'}${chosen?' · EQUIPADO':''}</span><p>${item.description}</p><dl><div><dt>Duração máxima</dt><dd>${item.duration} s</dd></div><div><dt>Recarga</dt><dd>${item.cooldown} s</dd></div></dl><p class="implant-card-state" data-status="${owned?status.state:'locked'}">${owned?status.text:'Terminal DIFÍCIL · '+regions[index]}${owned&&status.state==='active'?'<br>Recarga restante: '+status.cooldown.toFixed(1)+' s':''}</p><button type="button" data-equip-implant="${id}" aria-pressed="${chosen}" ${owned?'':'disabled'}>${chosen?'✓ EQUIPADO':owned?'EQUIPAR · '+(index+1):'BLOQUEADO'}</button></article>`;
   }).join('')+'</div>';
   content.querySelectorAll('[data-equip-implant]').forEach(button=>{button.onclick=()=>{const position=content.scrollTop;if(this.onEquipImplant?.(button.dataset.equipImplant)){this.panel(state,'implants');content.scrollTop=position;content.querySelector('[data-equip-implant="'+button.dataset.equipImplant+'"]').focus({preventScroll:true});}};button.onkeydown=event=>{if(event.key===' '){event.preventDefault();event.stopPropagation();button.click();}};});
  }else if(tab==='controls'){
   title.textContent='CONTROLES';content.innerHTML='<div class="controls-guide"><p><b>A / D ou ← / →</b> · Mover<br><b>Espaço</b> · Pular / salto duplo<br><b>J / clique</b> · Atacar<br><b>Shift</b> · Impulso<br><b>K</b> · Gancho / EMP / sobrecarga<br><b>E</b> · Interagir<br><b>M / Esc</b> · Mapa / pausa</p><p><b>1</b> · Equipar Firewall neural<br><b>2</b> · Equipar Overclock de combate<br><b>3</b> · Equipar Interferência de sinal<br><b>Q</b> · Alternar implante liberado<br><b>F</b> · Ativar o equipado</p><p>Somente um efeito de implante especial pode ficar ativo. Trocar não ativa nem reinicia recargas. Nos desafios de rede, <b>1–4 respondem às alternativas</b>; não trocam equipamento.</p><p><b>G</b> · Laboratório de recursos<br><b>F3</b> · Depuração de combate</p></div>';
  }else if(tab==='abilities'){
   title.textContent='IMPLANTES';content.innerHTML=Object.entries(ABILITY_INFO).map(([id,a])=>`<div class="ability-row"><strong>${a.name} · ${state.abilities[id]?'ATIVO':'BLOQUEADO'}</strong><br>${a.text}</div>`).join('');
   const n=networkTotals(state);content.innerHTML+=`<div class="ability-row"><strong>MÓDULOS DE REDE · ${state.network?.completedTerminalIds.length||0}/12</strong><br>Vida: +${n.healthBonus} PV · Dano: +${Math.round((n.damageMultiplier-1)*100)}%<br>Velocidade de corrida: +${Math.round((n.moveSpeedMultiplier-1)*100)}% · Redução de dano: ${Math.round(n.damageReduction*100)}%</div>`;
   content.innerHTML+='<p>Use a aba IMPLANTES para inspecionar e equipar os implantes especiais. K mantém gancho, EMP e sobrecarga.</p>';
  }else{
   title.textContent='INVESTIGAÇÃO';
   content.innerHTML=`<p>${state.bosses.filter(b=>b.dead).length}/3 bosses · ${state.credits} créditos · ${Math.floor((state.playTime||0)/60)} min de jornada</p>`+
    state.quests.map(q=>`<div class="ability-row"><strong>${q.name}</strong><br>${q.complete?'CONCLUÍDO':q.progress+'/'+q.goal}</div>`).join('')+
    ['log-1','log-2','log-3'].filter(id=>state.events.includes(id)).map(id=>'<div class="ability-row">'+LOGS[id]+'</div>').join('')+
    '<p>'+objective(state)+'</p>';
  }
 }
 clearDialogActions(){const actions=document.querySelector('#dialog-actions');actions.replaceChildren();actions.classList.add('hidden')}
 showDialog(speaker,text){this.clearDialogActions();this.dialogueLines=null;this.dialogueIndex=0;document.querySelector('#speaker').textContent=speaker;document.querySelector('#dialog-text').textContent=text;document.querySelector('#dialog-close').textContent='FECHAR · E / ENTER';document.querySelector('#dialog-screen').classList.remove('hidden')}
 showConversation(lines){this.clearDialogActions();this.dialogueLines=lines;this.dialogueIndex=0;this.renderDialogueLine()}
 showDialogActions(speaker,text,choices){
  this.showDialog(speaker,text);const actions=document.querySelector('#dialog-actions');
  for(const choice of choices){const button=document.createElement('button');button.type='button';button.textContent=choice.label;button.disabled=Boolean(choice.disabled);button.onclick=choice.action;actions.append(button)}
  actions.classList.remove('hidden');
 }
 renderDialogueLine(){
  const line=this.dialogueLines[this.dialogueIndex];
  document.querySelector('#speaker').textContent=line.speaker;
  document.querySelector('#dialog-text').textContent=line.text;
  document.querySelector('#dialog-close').textContent=(this.dialogueIndex<this.dialogueLines.length-1?'PRÓXIMA':'CONCLUIR')+' · E / ENTER';
  document.querySelector('#dialog-screen').classList.remove('hidden');
 }
 advanceDialogue(){if(!this.dialogueLines||this.dialogueIndex>=this.dialogueLines.length-1)return false;this.dialogueIndex++;this.renderDialogueLine();return true}
 showEnding(state){
  document.querySelector('#dialog-screen').classList.add('hidden');
  const screen=document.querySelector('#ending-screen');screen.classList.remove('hidden');
  document.querySelector('#ending-summary').textContent=`Três ameaças neutralizadas · ${state.quests.find(q=>q.id==='records')?.progress||0}/3 registros recuperados`;
 }
}
