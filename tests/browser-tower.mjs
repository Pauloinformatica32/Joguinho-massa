import {writeFileSync} from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
try{
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html'});
 await new Promise(r=>setTimeout(r,1200));
 const r=await call('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:"import('/tests/tower-cases.js').then(m=>m.runTowerTests())"});
 if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));console.log(JSON.stringify(r.result.value));
 await call('Runtime.evaluate',{expression:`document.querySelectorAll('#title-screen,#ending-screen,#dialog-screen,#death-screen,#boss-warning').forEach(n=>n.classList.add('hidden'));const preview=globalThis.__towerPreview;preview.state.player.x=9890;preview.state.player.y=390;preview.tower.syncCamera(true);preview.render(false);`});
 const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('./tower-lab-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
}finally{ws.close()}
