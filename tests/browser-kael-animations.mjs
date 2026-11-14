import {writeFileSync} from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const shot=async name=>{const r=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL(`./kael-${name}.png`,import.meta.url),Buffer.from(r.data,'base64'))};
try{
 await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html?towerTest=1'});await sleep(1200);
 await run(`(async()=>{window.e=towerTest.engine;window.p=e.state.player;await e.assets.loadRegion('corporate');e.applyAssetCollisionConfigs();window.seen=[];const draw=e.spriteRenderer.draw.bind(e.spriteRenderer);e.spriteRenderer.draw=(c,id,a,t,dt,o)=>{const ok=draw(c,id,a,t,dt,o);if(id==='protagonist')seen.push({a,ok,frame:o?.frameOverride??e.animations.instances.get(t)?.index});return ok};p.x=5450;p.y=736;p.health=100;p.invuln=99;e.state.abilities.dash=true;e.tower.syncCamera(true);})()`);
 await sleep(300);await run(`e.keydown(' ')`);await sleep(150);await shot('jump');await run(`e.keyup(' ')`);
 await sleep(190);await shot('fall');await sleep(800);
 await run(`e.keydown('shift')`);await sleep(85);await shot('dash');await run(`e.keyup('shift')`);await sleep(300);
 await run(`(async()=>{p.invuln=0;const {hurt}=await import('/js/combat.js');hurt(p,10,p.x-40)})()`);await sleep(90);await shot('damage');await sleep(800);
 await run(`(async()=>{p.invuln=0;const {hurt}=await import('/js/combat.js');hurt(p,1000,p.x-40)})()`);await sleep(880);await run(`document.querySelector('#death-screen').classList.add('hidden')`);await shot('death');
 const result=await run(`({assets:e.assets.status(),animations:Object.fromEntries(['jump','fall','dodge','damage','death'].map(a=>[a,{available:e.spriteRenderer.available('protagonist',a),frames:[...new Set(seen.filter(q=>q.a===a).map(q=>q.frame))]}])),failed:seen.filter(q=>!q.ok),state:p.state})`);
 for(const [name,a]of Object.entries(result.animations))if(!a.available||!a.frames.length)throw Error(name+' did not play');
 if(result.failed.length||result.assets.errors.length)throw Error('Missing sprites: '+JSON.stringify(result));
 console.log(JSON.stringify(result));writeFileSync(new URL('./kael-animation-results.json',import.meta.url),JSON.stringify(result,null,2));
}finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id)}
