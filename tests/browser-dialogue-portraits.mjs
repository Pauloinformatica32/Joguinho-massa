import {writeFileSync} from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const shot=async name=>{const r=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(`./portraits-${name}.png`,import.meta.url),Buffer.from(r.data,'base64'))};
const errors=[];ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Runtime.exceptionThrown'||m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params)});
const size=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
const inspect=async expected=>{
 const result=await run(`(async()=>{const f=document.querySelector('#dialog-portrait'),i=f.querySelector('img');await i.decode();const d=document.querySelector('#dialog-screen .dialog'),p=f.getBoundingClientRect(),text=document.querySelector('#dialog-text').getBoundingClientRect(),close=document.querySelector('#dialog-close').getBoundingClientRect(),box=d.getBoundingClientRect();return {id:f.dataset.speaker,src:i.getAttribute('src'),loaded:i.naturalWidth===627&&i.naturalHeight===627,portraitSize:[p.width,p.height],fit:box.left>=0&&box.right<=innerWidth+1&&box.top>=0&&box.bottom<=innerHeight+1,overflow:d.scrollWidth>d.clientWidth+1,overlap:p.right>text.left,buttonFits:close.right<=box.right&&close.left>=box.left,style:getComputedStyle(i).imageRendering}})()`);
 if(result.id!==expected||!result.loaded||!result.fit||result.overflow||result.overlap||!result.buttonFits||result.style!=='pixelated')throw Error(JSON.stringify(result));return result;
};
try{
 await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await size(1280,900);
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html?towerTest=1'});await sleep(1200);
 await run(`window.e=towerTest.engine;window.p=e.state.player;window.openNPC=id=>{e.closeDialog();const n=e.world.map.npcs.find(n=>n.id===id);p.x=n.x-15;p.y=n.y-p.h;p.vx=p.vy=0;e.tower.syncCamera(true);e.paused=false;e.interact()}`);
 const results=[];
 await run(`openNPC('yara')`);results.push(await inspect('yara'));await shot('yara-desktop');
 await run(`document.querySelector('#dialog-close').click()`);results.push(await inspect('kael'));await shot('kael-desktop');
 await run(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))`);results.push(await inspect('yara'));
 for(const [npc,id]of [['oren-slum','oren'],['scientist','iris'],['teo-factory','teo']]){
  await run(`openNPC('${npc}')`);results.push(await inspect(id));await shot(id+'-desktop');
 }
 await run(`e.closeDialog();if(document.querySelector('#dialog-portrait img').hasAttribute('src')||e.ui.dialogueLines!==null||e.paused)throw Error('Closing did not reset')`);
 await run(`openNPC('yara')`);results.push(await inspect('yara'));
 for(const [w,h]of [[390,640],[320,568],[640,360]]){
  await size(w,h);results.push(await inspect('yara'));await shot('yara-'+w+'x'+h);
  await run(`e.advanceDialog()`);results.push(await inspect('kael'));await shot('kael-'+w+'x'+h);
  await run(`e.ui.showConversation([{speaker:'Téo · Operário Sobrevivente',text:'Teste de apresentação com texto longo. '.repeat(25)}]);e.paused=true`);results.push(await inspect('teo'));
  await run(`openNPC('yara')`);
 }
 await run(`e.ui.showDialog('Sistema desconhecido','Registro preservado.');if(!document.querySelector('#dialog-portrait').classList.contains('hidden')||document.querySelector('#dialog-portrait img').hasAttribute('src'))throw Error('Unrelated portrait leaked')`);
 // Simulate an image failure without issuing a deliberately broken network request.
 await run(`e.ui.showDialog('Yara','Dica');document.querySelector('#dialog-portrait img').dispatchEvent(new Event('error'));if(!document.querySelector('#dialog-portrait').classList.contains('portrait-missing'))throw Error('Missing image fallback');e.ui.showDialog('Kael','Resposta');`);results.push(await inspect('kael'));
 // Existing network tests enter a real tutorial/terminal session and preserve four answers.
 await size(1280,900);await run(`e.closeDialog();e.state.events.push('yara-reunion');const t=e.world.map.terminals.find(t=>t.questionId);p.x=t.x-p.w/2;p.y=t.y-p.h;e.paused=false;e.network.interact();e.network.showQuestion();window.beforeHint=JSON.stringify(e.state);document.querySelector('#yara-help-toggle').click()`);
 const hint=await run(`(async()=>{const i=document.querySelector('#yara-help img');await i.decode();return {src:i.getAttribute('src'),loaded:i.naturalWidth===627,text:document.querySelector('#yara-hint-text').textContent===e.network.session.q.hint,choices:document.querySelectorAll('[data-network-answer]').length,unchanged:beforeHint===JSON.stringify(e.state)}})()`);
 if(hint.src!=='assets/ui/portraits/yara.png'||!hint.loaded||!hint.text||hint.choices!==4||!hint.unchanged)throw Error(JSON.stringify(hint));
 await shot('yara-hint-desktop');await size(390,640);await shot('yara-hint-mobile');
 if(errors.length)throw Error('Console errors '+JSON.stringify(errors));
 writeFileSync(new URL('./portraits-results.json',import.meta.url),JSON.stringify({results,hint,consoleErrors:errors.length},null,2));console.log(JSON.stringify({views:results.length,hint,consoleErrors:errors.length}));
}finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id)}
