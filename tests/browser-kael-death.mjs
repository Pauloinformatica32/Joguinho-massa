import {writeFileSync} from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const shot=async name=>{const r=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(`./deathfix-${name}.png`,import.meta.url),Buffer.from(r.data,'base64'))};
const waitFor=async expression=>run(`new Promise((resolve,reject)=>{const start=performance.now();const timer=setInterval(()=>{if(${expression}){clearInterval(timer);resolve(true)}else if(performance.now()-start>5000){clearInterval(timer);reject(Error('Condition timed out: '+${JSON.stringify(expression)}))}},5)})`);
try{
 await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html?towerTest=1'});await sleep(1200);
 await run(`(async()=>{window.e=towerTest.engine;window.p=e.state.player;window.m=await import('/js/tower-enemies.js');window.combat=await import('/js/combat.js');await e.assets.loadRegion('corporate');e.applyAssetCollisionConfigs();p.x=5390;p.y=736;p.invuln=99;e.tower.syncCamera(true);window.seen=[];window.screenAt=0;window.monitor=new MutationObserver(()=>{if(!document.querySelector('#death-screen').classList.contains('hidden')&&!screenAt)screenAt=performance.now()});monitor.observe(document.querySelector('#death-screen'),{attributes:true,attributeFilter:['class']});const draw=e.spriteRenderer.draw.bind(e.spriteRenderer);e.spriteRenderer.draw=(c,id,a,t,dt,o)=>{const ok=draw(c,id,a,t,dt,o);if(id==='protagonist')seen.push({a,ok,frame:o?.frameOverride??e.animations.instances.get(t)?.index,time:performance.now(),x:t.x,y:t.y,health:t.health,damageTimer:t.damageTimer,overlay:!document.querySelector('#death-screen').classList.contains('hidden')});return ok};window.clips=[];window.recorder=new MediaRecorder(e.canvas.captureStream(30),{mimeType:'video/webm'});recorder.ondataavailable=q=>clips.push(q.data);recorder.start();})()`);
 const fallValidation=await run(`(()=>{const cfg=e.assets.getConfig('protagonist'),c=document.createElement('canvas');c.width=145;c.height=114;const ctx=c.getContext('2d');const pixels=(a,i)=>{ctx.clearRect(0,0,145,114);ctx.drawImage(e.assets.get(cfg.animations[a].sheet),i*145,0,145,114,0,0,145,114);return ctx.getImageData(0,0,145,114).data};const reference=pixels('jump',3);return {stable:Array.from({length:8},(_,i)=>pixels('fall',i).every((n,j)=>n===reference[j])).every(Boolean),transparent:reference.some((n,i)=>i%4===3&&n===0)}})()`);
 if(!fallValidation.stable||!fallValidation.transparent)throw Error('Fall pixels not preserved');
 await sleep(100);await run(`seen=[];e.keydown(' ')`);await waitFor(`p.state==='fall'`);await shot('fall-stable');await run(`e.keyup(' ')`);await waitFor(`p.grounded&&p.state==='idle'`);
 const jump=await run(`({states:[...new Set(seen.map(q=>q.a))],damage:seen.some(q=>q.a==='damage'),health:p.health})`);
 if(jump.damage||jump.health!==100||!['jump','fall','landing'].every(s=>jump.states.includes(s)))throw Error('Jump regression '+JSON.stringify(jump));
 await run(`seen=[];p.invuln=0;combat.hurt(p,5,p.x-40,{source:'test_ground_hit'})`);await waitFor(`p.state==='damage'`);await shot('damage-ground');await sleep(450);
 const ground=await run(`({frames:[...new Set(seen.filter(q=>q.a==='damage').map(q=>q.frame))],health:p.health})`);
 await run(`p.invuln=0;e.keydown(' ')`);await waitFor(`p.state==='jump'`);await run(`e.keyup(' ');seen=[];combat.hurt(p,5,p.x-40,{source:'test_air_hit'})`);await waitFor(`p.state==='damage'`);await shot('damage-air');await sleep(700);
 const air=await run(`({frames:[...new Set(seen.filter(q=>q.a==='damage').map(q=>q.frame))],health:p.health})`);
 if(ground.health!==95||air.health!==90||!ground.frames.length||!air.frames.length)throw Error('Damage regression');
 const results={fallValidation,jump,ground,air,deaths:[]};
 for(const [cycle,cause]of ['enemy','hazard','enemy'].entries()){
  await run(`screenAt=0;seen=[];p.health=1;p.invuln=0;e.hazardTick=0;p.attackTimer=p.damageTimer=p.dashTimer=0;p.vx=p.vy=0;e.paused=false;window.cp=JSON.stringify(e.state.checkpoint);${cause==='enemy'?`window.enemy=e.enemies.find(q=>q.assetId==='interceptor_i9');m.resetTowerEnemy(enemy,true);enemy.attackCooldown=0;p.x=enemy.x-30;p.y=736;`:`p.x=6830;p.y=736;`}e.tower.syncCamera(true)`);
  await waitFor(`e.deathStage==='animation'`);
  const initial=await run(`({stage:e.deathStage,timer:e.deathAnimationTimer,duration:e.deathAnimationDuration,hidden:document.querySelector('#death-screen').classList.contains('hidden'),disabled:document.querySelector('#respawn-button').disabled,early:e.respawn(),position:[p.x,p.y],source:p.lastDamage.source})`);
  if(!initial.hidden||!initial.disabled||initial.early!==false||initial.duration!==1)throw Error('Initial death stage '+JSON.stringify(initial));
  await run(`for(const key of ['d','j','k',' ','escape','m','g'])window.dispatchEvent(new KeyboardEvent('keydown',{key}));document.querySelector('#respawn-button').click();document.querySelector('#pause-open').click();e.interact()`);
  await sleep(500);await shot(`${cycle}-${cause}-animation`);
  await waitFor(`e.animations.instances.get(p)?.index===7`);await sleep(170);await shot(`${cycle}-${cause}-last-frame`);
  await waitFor(`e.deathStage==='screen'`);await shot(`${cycle}-${cause}-screen`);
  const report=await run(`(()=>{const death=seen.filter(q=>q.a==='death'),first=death[0],last=death.find(q=>q.frame===7);return {cause:'${cause}',frames:[...new Set(death.map(q=>q.frame))],elapsed:(screenAt-first.time)/1000,lastHold:(screenAt-last.time)/1000,frozen:death.every(q=>q.x===first.x&&q.y===first.y),earlyOverlay:death.some(q=>q.overlay),stage:e.deathStage,source:p.lastDamage.source,checkpointIntact:cp===JSON.stringify(e.state.checkpoint),keys:e.keys.size}})()`);
  if(report.frames.length!==8||report.elapsed<1.26||report.lastHold<.29||!report.frozen||report.earlyOverlay||!report.checkpointIntact||report.keys)throw Error('Death regression '+JSON.stringify(report));
  if(cause==='hazard'&&report.source!=='hazard_laser')throw Error('Not an environmental death');
  const respawn=await run(`(()=>{document.querySelector('#respawn-button').click();return {x:p.x,y:p.y,cp:e.state.checkpoint,alive:!p.dead,stage:e.deathStage,timer:e.deathAnimationTimer,attack:p.attackTimer,dash:p.dashTimer,hidden:document.querySelector('#death-screen').classList.contains('hidden'),paused:e.paused}})()`);
  if(!respawn.alive||respawn.x!==respawn.cp.x||respawn.y!==respawn.cp.y||respawn.stage!==null||respawn.timer||respawn.attack||respawn.dash||!respawn.hidden||respawn.paused)throw Error('Respawn regression '+JSON.stringify(respawn));
  report.respawn=respawn;results.deaths.push(report);await sleep(150);
 }
 const encoded=await run(`new Promise(resolve=>{recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(clips).arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);resolve(btoa(s))};recorder.stop()})`);
 writeFileSync(new URL('./deathfix-gameplay.webm',import.meta.url),Buffer.from(encoded,'base64'));
 writeFileSync(new URL('./deathfix-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id)}
