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
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html?towerTest=1'});await sleep(1000);
 const result=await run(`import('/tests/level-browser.js').then(m=>m.runLevelBrowser(towerTest.engine,${process.env.LEVEL_REALTIME==='1'}))`);
 for(const shot of result.shots)writeFileSync(new URL('./level-'+shot.id+'.png',import.meta.url),Buffer.from(shot.image.split(',')[1],'base64'));
 delete result.shots;writeFileSync(new URL('./level-browser-results.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id)}
