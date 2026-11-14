import {writeFileSync} from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
try{
 await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html?towerTest=1'});await sleep(1200);
 await run(`(async()=>{window.e=towerTest.engine;window.p=e.state.player;window.m=await import('/js/tower-enemies.js');await e.assets.loadRegion('corporate');e.applyAssetCollisionConfigs();p.health=p.maxHealth=10000;p.invuln=999;window.samples=[];const draw=e.spriteRenderer.draw.bind(e.spriteRenderer);e.spriteRenderer.draw=(c,id,a,t,dt,o)=>{const ok=draw(c,id,a,t,dt,o);if(t===window.subject)samples.push({id,a,frame:o.frameOverride,ok,x:t.x,y:t.y,facing:o.facing,active:!!m.towerAttackBox(t)||m.towerBeamActive(t),sourceFlip:o.facing*(e.assets.getConfig(id).animations[a].nativeFacing??e.assets.getConfig(id).nativeFacing)<0});return ok};window.clips=[];window.recorder=new MediaRecorder(e.canvas.captureStream(30),{mimeType:'video/webm'});recorder.ondataavailable=q=>clips.push(q.data);recorder.start()})()`);
 const results=[];
 for(const id of ['interceptor_i9','synaptic_h0','optic_s6'])for(const direction of [-1,1]){
  await run(`towerTest.floor(${id==='synaptic_h0'?2:1});window.subject=e.enemies.find(q=>q.assetId==='${id}');m.resetTowerEnemy(subject,true);subject.facing=${direction};subject.attackCooldown=10;window.start={x:subject.x,y:subject.y};samples=[];p.x=subject.x+${direction}*${id==='optic_s6'?100:450};p.y=${id==='optic_s6'?'subject.y+50':'736'};p.vx=p.vy=0;e.debugCombat=false;e.tower.syncCamera(true)`);
  // Patrol can reverse at narrow H-0 bounds; observe more than a complete 8-frame cycle.
  await sleep(2500);
  // Natural AI attack against an approaching target, without advancing stateTime manually.
  await run(`window.walkSamples=samples.slice();samples=[];subject.attackCooldown=0;p.x=subject.x+${direction}*${id==='interceptor_i9'?30:id==='synaptic_h0'?85:100};p.y=${id==='optic_s6'?'subject.y+70':'736'};p.vx=p.vy=0;e.tower.syncCamera(true)`);
  const impact=await run(`new Promise((resolve,reject)=>{const started=performance.now();const timer=setInterval(()=>{const q=samples.find(q=>q.a==='attack'&&q.active);if(q){clearInterval(timer);resolve(q)}else if(performance.now()-started>4000){clearInterval(timer);reject(Error('No active attack'))}},8)})`);
  const image=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(`./upgraded-${id}-${direction<0?'left':'right'}.png`,import.meta.url),Buffer.from(image.data,'base64'));
  await sleep(750);
  const result=await run(`({id:'${id}',direction:${direction},walkFrames:[...new Set(walkSamples.filter(q=>q.a==='walk').map(q=>q.frame))],attackFrames:[...new Set(samples.filter(q=>q.a==='attack').map(q=>q.frame))],invalid:[...walkSamples,...samples].filter(q=>!q.ok||!Number.isFinite(q.x)||!Number.isFinite(q.y)),fixed:${id==='optic_s6'?'subject.x===start.x&&subject.y===start.y':'true'}})`);
  result.impact=impact;results.push(result);
 }
 const encoded=await run(`new Promise(resolve=>{recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(clips).arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);resolve(btoa(s))};recorder.stop()})`);
 writeFileSync(new URL('./upgraded-tower-enemies.webm',import.meta.url),Buffer.from(encoded,'base64'));
 for(const r of results){if(r.walkFrames.length!==(r.id==='optic_s6'?6:8)||r.attackFrames.length!==(r.id==='optic_s6'?6:8)||r.invalid.length||!r.fixed)throw Error(JSON.stringify(r))}
 console.log(JSON.stringify(results));writeFileSync(new URL('./upgraded-tower-results.json',import.meta.url),JSON.stringify(results,null,2));
}finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id)}
