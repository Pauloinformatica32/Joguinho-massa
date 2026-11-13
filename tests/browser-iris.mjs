import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
assert.deepEqual(readFileSync('assets/characters/npcs/iris/idle.png'),readFileSync('iris_vale_jogo/assets/characters/npcs/iris/idle.png'));
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
try{
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html'});
 await new Promise(r=>setTimeout(r,1000));
 const result=await call('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
  const {Engine,newState}=await import('/js/engine.js'),{UI}=await import('/js/ui.js');
  document.querySelector('#title-screen').classList.add('hidden');
  const e=new Engine(document.querySelector('#game'),newState(),new UI());
  await e.assets.loadRegion('industrial');await e.assets.loadRegion('slums');
  let checks=0;const check=(name,ok)=>{checks++;if(!ok)throw Error(name)};
  const ns=e.world.map.npcs.filter(n=>n.id==='scientist'),n=ns[0],p=e.state.player,cfg=e.assets.getConfig('iris'),img=e.assets.get(cfg.animations.idle.sheet);
  check('one scientist, position and EMP preserved',ns.length===1&&n.x===3400&&n.y===790&&n.ability==='emp');
  check('identity',n.name==='Dra. Íris Vale'&&cfg.name===n.name&&n.assetId==='iris');
  check('PNG loaded and valid',img.naturalWidth===40&&img.naturalHeight===64&&!cfg.animations.idle.invalid&&e.assets.status().failed===0&&e.assets.errors.length===0);
  const canvas=document.createElement('canvas');canvas.width=40;canvas.height=64;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,40,64).data;let min=64,max=-1,transparent=0;
  for(let i=3;i<pixels.length;i+=4){if(pixels[i]){const y=Math.floor((i-3)/4/40);min=Math.min(min,y);max=Math.max(max,y)}else transparent++}
  check('transparency and ground origin',transparent===1548&&max+1===cfg.origin.y&&cfg.scale===1);
  check('human scale',max-min+1===58&&e.assets.getConfig('yara').scale===1&&e.assets.getConfig('oren').scale===1);
  p.x=3350;p.y=736;e.camera.x=3000;e.camera.y=360;e.render(false);
  e.interact();check('dialogue opens and faces left',e.paused&&document.querySelector('#speaker').textContent===n.name&&!document.querySelector('#dialog-screen').classList.contains('hidden')&&n.spriteTarget.facing===-1);
  p.x=3440;e.render(false);check('fixed during conversation',n.spriteTarget.facing===-1);
  e.closeDialog();e.interact();check('faces right on next interaction',n.spriteTarget.facing===1);
  e.closeDialog();e.render(false);check('visible and unmoved after dialogue',n.x===3400&&n.y===790&&e.spriteRenderer.available('iris','idle')&&n.spriteTarget.y===790&&!e.paused);
  const scales=[],probe={save(){},restore(){},translate(){},scale(x,y){scales.push([x,y])},drawImage(...args){this.draw=args}};
  e.spriteRenderer.draw(probe,'iris','idle',{x:100,y:100,facing:1});
  check('native facing and crisp ground placement',scales[0][0]===-1&&probe.imageSmoothingEnabled===false&&probe.draw[6]===39&&probe.draw[7]===40&&probe.draw[8]===64);
  check('other NPCs retain assets',e.world.map.npcs.find(n=>n.id==='corporate-ai').assetId==='npc_survivor'&&e.spriteRenderer.available('yara','idle')&&e.spriteRenderer.available('oren','idle'));
  p.x=3350;e.render(false);return {checks,dimensions:[40,64],opaqueHeight:max-min+1,transparent};
 })()`});
 if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
 const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('./iris-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 console.log('PASS: Iris integration '+JSON.stringify(result.result.value));
}finally{ws.close()}
