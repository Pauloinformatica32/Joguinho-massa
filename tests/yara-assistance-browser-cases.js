let checks=0;const visited={question:new Set(),failure:new Set()};
const check=(value,label)=>{checks++;if(!value)throw Error(label)};
const snapshot=e=>JSON.stringify({state:e.state,save:localStorage.getItem('nova-aurora-save-v1')});
export function probe(e,stage){
 const s=e.network.session;if(s.hintOpen)e.network.setHintOpen(false);const q=s.q,before=snapshot(e),last=s.lastAnswer,text=document.querySelector('#dialog-text').textContent,buttons=[...document.querySelectorAll('[data-network-answer]')];
 check(s.stage===stage&&buttons.length===4,'four choices remain '+stage+' '+q.id);check(document.querySelector('#yara-help-toggle').textContent==='PEDIR DICA À YARA','help label '+q.id);
 document.querySelector('#yara-help-toggle').click();check(s.hintOpen&&!document.querySelector('#yara-hint-panel').classList.contains('hidden'),'help opens');
 check(document.querySelector('#yara-hint-heading').textContent==='YARA — CONEXÃO ESTABELECIDA','Yara connected');check(document.querySelector('#yara-hint-text').textContent===q.hint&&document.querySelector('#yara-help').dataset.questionId===q.id,'question-specific hint '+q.id);
 check(e.network.session===s&&s.stage===stage&&s.lastAnswer===last&&document.querySelector('#dialog-text').textContent===text,'hint preserves question/feedback/selection');
 check(buttons.every((b,i)=>b===document.querySelectorAll('[data-network-answer]')[i]&&!b.disabled),'hint never replaces/disables choices');
 for(const key of ['d','j','k','f','q'])window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));e.update(.033);check(e.paused&&snapshot(e)===before,'no movement, attacks, saves, penalties or buffs');
 document.querySelector('#yara-hint-close').click();check(!s.hintOpen&&e.paused&&!document.querySelector('#dialog-screen').classList.contains('hidden')&&s.stage===stage&&s.lastAnswer===last,'closing help keeps terminal state');
 buttons[3].focus();document.querySelector('#dialog-screen').dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));check(document.activeElement.id==='yara-help-toggle','keyboard tab reaches help');
 document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));check(s.hintOpen,'Space reopens same hint');
 document.querySelector('#dialog-screen').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check(!s.hintOpen&&e.paused&&e.network.session===s&&s.stage===stage,'Escape closes hint only');check(snapshot(e)===before&&buttons.every(b=>b.isConnected&&!b.disabled),'repeat requests have no effects');visited[stage].add(q.id);
 return{checks};
}
export async function preview(e){e.network.setHintOpen(true);const image=document.querySelector('#yara-hint-panel img');await image.decode();check(image.naturalWidth===627&&image.naturalHeight===627&&image.getAttribute('src')==='assets/ui/portraits/yara.png','dedicated Yara portrait loaded');return{checks,questionId:e.network.session.q.id};}
export function fit(e){const panel=document.querySelector('#yara-hint-panel'),r=panel.getBoundingClientRect(),dialog=document.querySelector('#dialog-screen .dialog').getBoundingClientRect(),buttons=[...document.querySelectorAll('[data-network-answer]')];
 check(dialog.left>=0&&dialog.top>=0&&dialog.right<=innerWidth+1&&dialog.bottom<=innerHeight+1,'help modal fits '+innerWidth+'x'+innerHeight);
 check(buttons.length===4&&buttons.every(b=>{const box=b.getBoundingClientRect();return !b.disabled&&(box.right<=r.left||box.left>=r.right||box.bottom<=r.top||box.top>=r.bottom)}),'hint panel does not cover choices');
 check(parseFloat(getComputedStyle(document.querySelector('#yara-hint-text')).fontSize)>=12&&panel.scrollWidth<=panel.clientWidth+1,'hint readable without horizontal clipping');
 check(document.querySelector('#yara-hint-text').textContent===e.network.session.q.hint,'responsive hint matches question');if(innerWidth<=800)check(document.querySelector('#dialog-close').getBoundingClientRect().top>=buttons[3].getBoundingClientRect().bottom,'terminal close stays below choices on small screens');return{checks,width:innerWidth,height:innerHeight};
}
export function report(){check(visited.question.size===12,'help tested before answers on all 12');check(visited.failure.size===12,'help tested after mistakes on all 12');return{checks,beforeAnswer:visited.question.size,afterWrong:visited.failure.size};}
