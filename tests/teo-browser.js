import {Engine,newState} from '../js/engine.js';
import {UI} from '../js/ui.js';
import {buildMap,GROUND,WARDEN_ARENA,assetRegionAt} from '../js/map.js';
import {TEO_DIALOGUES,teoConversation,YARA_DIALOGUES,OREN_DIALOGUES} from '../js/dialogue.js';
import {syncProgress,teoObjective,unlockedAct} from '../js/campaign.js';
import {saveGame,loadGame,normalizeSave} from '../js/save.js';

const checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
const report=document.createElement('pre');report.style.cssText='max-height:190px;overflow:auto';document.body.prepend(report);
const saveKey='nova-aurora-save-v1',originalSave=localStorage.getItem(saveKey);
try {
 const e=new Engine(document.querySelector('#game'),newState(),new UI());
 await Promise.all([e.assets.loadRegion('industrial'),e.assets.loadRegion('slums')]);
 const map=e.world.map,n=map.npcs.find(n=>n.id==='teo-factory'),p=e.state.player;
 const cfg=e.assets.getConfig('teo'),img=e.assets.get(cfg.animations.idle.sheet);
 check('single registered industrial NPC',map.npcs.filter(n=>n.id==='teo-factory').length===1&&n.assetId==='teo'&&assetRegionAt(n.x)==='industrial');
 check('58 x 126 PNG loads with no failed assets',img.naturalWidth===58&&img.naturalHeight===126&&!cfg.animations.idle.invalid&&e.assets.status().failed===0&&e.assets.validate().length===0);
 const probe=document.createElement('canvas');probe.width=58;probe.height=126;
 const ctx=probe.getContext('2d');ctx.drawImage(img,0,0);
 const pixels=ctx.getImageData(0,0,58,126).data;
 check('transparent PNG',pixels.filter((v,i)=>i%4===3&&v===0).length===2954);
 check('human height, bottom center and collision',Math.round(126*cfg.scale)===60&&cfg.origin.x===29&&cfg.origin.y===126&&cfg.collision.width===28&&cfg.collision.height===54);
 const overlaps=s=>n.x+28>s.x&&n.x<s.x+s.w&&n.y>s.y&&n.y-61<s.y+s.h;
 check('valid floor outside hazards, cover and Warden arena',map.platforms.some(s=>s.y===n.y&&n.x>=s.x&&n.x+28<=s.x+s.w)&&!map.hazards.some(overlaps)&&!map.platforms.filter(s=>!s.oneWay&&s.y<GROUND).some(overlaps)&&n.x+28<WARDEN_ARENA.left);
 check('separate from other NPCs',map.npcs.every(other=>other===n||Math.abs(other.x-n.x)>150));
 const terminal=map.terminals.find(t=>t.id==='shortcut-maintenance');
 const bridgeCount=m=>m.platforms.filter(s=>s.x===terminal.shortcut.x&&s.y===terminal.shortcut.y&&s.w===terminal.shortcut.w).length;
 check('existing terminal and bridge reused',map.terminals.filter(t=>t.id==='shortcut-maintenance').length===1&&bridgeCount(map)===0&&terminal.x===3350);
 const finish=()=>{let limit=40;while(e.paused&&limit-->0)e.advanceDialog();check('conversation finishes',limit>0&&!e.paused)};
 const stand=(x,y=GROUND)=>{p.x=x;p.y=y-p.h;e.render(false)};
 const talk=()=>{stand(n.x-40);e.interact()};
 document.querySelector('#title-screen').classList.add('hidden');
 e.camera.x=2800;e.camera.y=340;
 talk();check('first encounter and speaker',e.ui.dialogueLines===TEO_DIALOGUES.reunion.lines&&document.querySelector('#speaker').textContent===n.name);
 check('faces Kael left',n.spriteTarget.facing===-1);
 e.advanceDialog();check('Kael speaker',document.querySelector('#speaker').textContent==='Kael');
 finish();
 check('first meeting and request recorded once',e.state.events.filter(id=>id==='teo-first-meeting').length===1&&e.state.events.filter(id=>id==='teo-maintenance-request').length===1);
 check('optional objective displayed without rewards',teoObjective(e.state).includes('passarela superior')&&e.state.quests.some(q=>q.id==='teo-maintenance'&&!q.complete)&&document.querySelector('#objective').textContent.includes('Opcional')&&e.state.credits===40&&!e.state.abilities.emp);
 stand(n.x+40);e.interact();check('faces Kael right, reminder while pending',n.spriteTarget.facing===1&&e.ui.dialogueLines===TEO_DIALOGUES.reminder.lines);finish();
 check('default orientation and stable position restored',n.spriteTarget.facing===-1&&n.x===3180&&n.y===790);
 // The existing panel stands on the original upper catwalk, reached via the
 // original industrial platforms. Test its normal interaction, not a new hook.
 stand(terminal.x-p.w/2,terminal.y);e.interact();
 check('existing terminal activates the original bridge',e.state.events.includes(terminal.id)&&bridgeCount(map)===1&&document.querySelector('#speaker').textContent===terminal.name);e.closeDialog();
 check('quest reads shortcut event and directs return',e.state.quests.find(q=>q.id==='teo-maintenance').complete&&teoObjective(e.state).includes('Volte a Téo'));
 e.interact();e.closeDialog();check('repeat terminal use never duplicates bridge',bridgeCount(map)===1&&e.state.events.filter(id=>id===terminal.id).length===1);
 talk();check('repair acknowledgment',e.ui.dialogueLines===TEO_DIALOGUES.complete.lines);finish();
 check('acknowledgment once and optional HUD cleared',e.state.events.filter(id=>id==='teo-maintenance-complete').length===1&&teoObjective(e.state)==='');
 const credits=e.state.credits;talk();check('repeat after repair',e.ui.dialogueLines===TEO_DIALOGUES.repeat.lines);finish();
 check('no duplicate completion or reward',e.state.events.filter(id=>id==='teo-maintenance-complete').length===1&&e.state.credits===credits&&!e.state.abilities.emp&&!e.state.items.includes('Credencial de Warden'));
 saveGame(e.state);const restored=loadGame();
 check('save reload keeps events, dialogue and bridge',restored.events.includes(terminal.id)&&restored.events.includes('teo-maintenance-complete')&&teoConversation(restored)===TEO_DIALOGUES.repeat&&bridgeCount(buildMap(restored.events))===1);
 const early=newState();early.events.push('shortcut-maintenance');
 check('repair before meeting recognized',teoConversation(early)===TEO_DIALOGUES.reunionRepaired);
 early.events.push('teo-first-meeting');check('already repaired skips maintenance request',teoConversation(early)===TEO_DIALOGUES.complete);
 early.events.push('teo-maintenance-complete');syncProgress(early);
 check('old saves retain shortcut and derive completed quest',normalizeSave(early).quests.find(q=>q.id==='teo-maintenance').complete&&bridgeCount(buildMap(normalizeSave(early).events))===1);
 // Exercise the real dialogue chain for a save with a previously opened bridge.
 e.state.events=e.state.events.filter(id=>!id.startsWith('teo-'));talk();
 check('in-game repaired first encounter',e.ui.dialogueLines===TEO_DIALOGUES.reunionRepaired.lines);finish();
 check('early repair chain acknowledges without broken-panel request',e.state.events.includes('teo-first-meeting')&&e.state.events.includes('teo-maintenance-complete')&&!e.state.events.includes('teo-maintenance-request'));
 for(const id of ['yara','oren-factory','scientist']){
  const other=map.npcs.find(n=>n.id===id);stand(other.x-40);e.interact();
  check(id+' dialogue unaffected',e.dialogNpc===other&&(id==='yara'?e.ui.dialogueLines===YARA_DIALOGUES.reunion.lines:id==='oren-factory'?e.ui.dialogueLines===OREN_DIALOGUES.reunion.lines:other.name==='Dra. Íris Vale'&&e.spriteRenderer.available('iris','idle')));e.closeDialog();
 }
 const noQuest=newState();noQuest.bosses.find(b=>b.id==='boss-0').dead=true;syncProgress(noQuest);
 check('optional task does not gate Warden or tower',unlockedAct(noQuest)===1&&!noQuest.events.includes('teo-first-meeting'));
 noQuest.bosses.find(b=>b.id==='boss-2').dead=true;syncProgress(noQuest);check('Warden progression works without Téo',unlockedAct(noQuest)===2&&noQuest.items.includes('Credencial de Warden'));
 check('expanded Warden arena preserved',WARDEN_ARENA.left===4490&&WARDEN_ARENA.right===5160&&map.platforms.filter(s=>s.wardenDeck).length===3&&map.hookPoints.filter(h=>h.industrial).length===2);
 check('reference NPC assets and smoothing intact',e.assets.getConfig('iris').scale===0.48&&['yara','oren'].every(id=>e.assets.getConfig(id).scale===1)&&e.ctx.imageSmoothingEnabled===false);
 stand(n.x-40);e.camera.x=2800;e.camera.y=340;e.render(false);
 report.textContent='PASS '+checks.length+' checks\n'+checks.join('\n');
 report.id='teo-results';
}catch(error){report.textContent='FAIL '+error.stack;report.id='teo-results';console.error(error)}
finally{if(originalSave===null)localStorage.removeItem(saveKey);else localStorage.setItem(saveKey,originalSave)}
