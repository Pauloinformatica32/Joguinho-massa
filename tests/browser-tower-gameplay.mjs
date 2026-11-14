import{writeFileSync}from'node:fs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5500/';
async function connect(url){const ws=new WebSocket(url);await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true})});let serial=0;const pending=new Map(),events=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id){events.push(m);return}const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)});return{ws,events,call(method,params={}){return new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>reject(Error('Timeout '+method)),20000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}}}
const v=await(await fetch('http://127.0.0.1:9222/json/version')).json(),browser=await connect(v.webSocketDebuggerUrl);let context,page;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const results=[];
try{
 context=(await browser.call('Target.createBrowserContext')).browserContextId;
 const {targetId}=await browser.call('Target.createTarget',{url:'about:blank',browserContextId:context});
 const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();page=await connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 await page.call('Runtime.enable');await page.call('Page.enable');
 const run=async expression=>{const r=await page.call('Runtime.evaluate',{expression:expression.includes('await ')?'(async()=>{'+expression+'})()':expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const shot=async name=>{const r=await page.call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('./gameplay-'+name+'.png',import.meta.url),Buffer.from(r.data,'base64'))};
 await page.call('Page.navigate',{url:base+'index.html?towerTest=1'});await sleep(1600);
 await run(`window.e=towerTest.engine;window.s=e.state;window.p=s.player;p.health=p.maxHealth=10000;await e.assets.loadRegion('corporate');e.applyAssetCollisionConfigs();window.samples=[];const original=e.spriteRenderer.draw.bind(e.spriteRenderer);e.spriteRenderer.draw=(c,id,a,t,dt,o)=>{const ok=original(c,id,a,t,dt,o);if(['nexus01','interceptor_i9','synaptic_h0'].includes(id))samples.push({id,a,frame:o?.frameOverride,x:t.x,y:t.y,ok,time:performance.now()});return ok};`);
 await run(`window.clips=[];window.recorder=new MediaRecorder(e.canvas.captureStream(30),{mimeType:'video/webm'});recorder.ondataavailable=q=>clips.push(q.data);recorder.start()`);
 // Real RAF updates and world rendering, with no manual enemy frame advancement.
 await run(`p.x=5660;p.y=733;e.tower.syncCamera(true);`);await sleep(800);await shot('i9-attack');
 await run(`p.x=5880;`);await sleep(350);await shot('i9-chase');
 await run(`p.x=6100;`);await sleep(600);await shot('i9-walk');
 results.push(await run(`({i9:samples.filter(q=>q.id==='interceptor_i9').reduce((r,q)=>(r[q.a]??=[],r[q.a].includes(q.frame)||r[q.a].push(q.frame),r),{})})`));
 const video=await run(`return new Promise(resolve=>{recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(clips).arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);resolve(btoa(binary))};recorder.stop()})`);
 writeFileSync(new URL('./gameplay-i9.webm',import.meta.url),Buffer.from(video,'base64'));
 // Walk from the laboratory hazard exit to the mandatory EMP panel encounter.
 await run(`towerTest.floor(2);p.x=10522;p.y=736;p.vx=p.vy=0;e.tower.syncCamera(true);`);await sleep(200);await run(`e.keydown('d');`);await sleep(150);await run(`e.keyup('d')`);await shot('h0-approach');
 await sleep(1200);await shot('h0-fight');
 results.push(await run(`({h0:samples.filter(q=>q.id==='synaptic_h0'&&q.ok).slice(-1),player:{x:p.x,y:p.y},enemies:e.enemies.filter(q=>q.assetId==='synaptic_h0').map(q=>({x:q.x,y:q.y,health:q.health,state:q.towerState,named:q.encounterNamed}))})`));
 // Trigger the normal arena boundary/intro rather than forcing boss activation.
 await run(`towerTest.floor(3);p.x=13930;p.y=736;e.paused=false;`);await sleep(300);await run(`e.advanceDialog();document.querySelector('#dialog-screen').classList.add('hidden');document.querySelector('#boss-warning').classList.add('hidden');window.b=s.bosses.find(q=>q.assetId==='vespera');p.x=b.x-160;e.debugCombat=false;e.paused=false;`);await sleep(200);await shot('nexus-start');
 await sleep(350);await shot('nexus-follow');
 await run(`const m=await import('/js/vespera.js');m.startVesperaAttack(b,'command',p)`);await sleep(1050);await shot('nexus-command');
 await run(`b.health=b.maxHealth*.5`);await sleep(3100);await shot('nexus-phase2');
 await run(`p.x=b.drone.x-20;p.y=736;const m=await import('/js/vespera.js');if(!m.empVespera(b,p))throw Error('EMP failed')`);await sleep(2800);await shot('nexus-emp-recovered');
 results.push(await run(`({nexus:{available:e.spriteRenderer.available('nexus01','idle'),drone:b.drone,phase:b.phase,draws:samples.filter(q=>q.id==='nexus01').length,invalid:samples.filter(q=>q.id==='nexus01'&&(!q.ok||!Number.isFinite(q.x)||!Number.isFinite(q.y))).length},assets:e.assets.status()})`));
 // Also exercise the supplied explicit scenario.
 await run(`towerTest.vespera(2,'command');e.debugCombat=false`);await sleep(1000);await shot('nexus-debug-phase2');
 writeFileSync(new URL('./tower-gameplay-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 if(results[2].nexus.invalid||!results[2].nexus.available)throw Error('Invalid drone render');
 if(results[0].i9.walk.length!==8||results[0].i9.attack.length!==8)throw Error('I9 gameplay frames missing');
 if(!results[1].enemies[0].named||results[1].enemies[0].state!=='attack')throw Error('H0 encounter not activated');
}finally{page?.ws.close();if(context)await browser.call('Target.disposeBrowserContext',{browserContextId:context});browser.ws.close()}
