import {writeFileSync} from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function shot(name){const r=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('./'+name+'.png',import.meta.url),Buffer.from(r.data,'base64'));}
try{
 await call('Runtime.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:8765/index.html?arena='+Date.now()});
 await new Promise(r=>setTimeout(r,800));
 const report=await evaluate("(async()=>{const {Engine,newState}=await import('/js/engine.js');const {UI}=await import('/js/ui.js');const {resetWarden}=await import('/js/warden.js');const s=newState();s.bosses[0].dead=true;s.abilities.hook=true;s.player.x=4500;s.player.y=736;const e=new Engine(document.querySelector('#game'),s,new UI());await e.assets.loadRegion('industrial');e.applyAssetCollisionConfigs();window.arenaPreview=e;document.querySelector('#title-screen').classList.add('hidden');document.querySelector('#dialog-screen').classList.add('hidden');const b=s.bosses[1];resetWarden(b);b.active=true;b.timer=100;e.camera.arena=b.arena;e.camera.update(s.player,960,540,7600,900,1);e.paused=false;s.player.invuln=999;return {decks:e.world.map.platforms.filter(p=>p.wardenDeck).map(p=>({id:p.id,x:p.x,y:p.y,w:p.w,h:p.h})),hooks:e.hookPoints.filter(h=>h.industrial)};})()");
 await evaluate("(()=>{const e=arenaPreview,b=e.state.bosses[1];e.state.player.x=4750;b.x=4920;b.phase=2;b.transformed=true;b.timer=100;e.debugCombat=true;e.render();})()");
 await shot('warden-arena-layout');
 const hook=await evaluate("(()=>{const e=arenaPreview,p=e.state.player,b=e.state.bosses[1],h=e.hookPoints.find(h=>h.id==='warden-hook-left');Object.assign(p,{x:h.x-15,y:736,vx:0,vy:0,grounded:true,health:100,invuln:999});e.useImplant();if(!p.hookCable||h.cooldown!==3)throw Error('hook activation');let apex=0;for(let i=0;i<35;i++){e.paused=false;e.update(1/60);apex=Math.max(apex,790-p.y-p.h);}if(apex<250)throw Error('hook height');return {apex,inside:p.x>=b.arena.left&&p.x+p.w<=b.arena.right};})()");
 await shot('warden-arena-hook');
 await evaluate("(()=>{const e=arenaPreview,p=e.state.player,b=e.state.bosses[1];Object.assign(p,{x:4820,y:606,vx:0,vy:0,grounded:true});b.timer=100;e.render();})()");
 await shot('warden-arena-platform');
 if(errors.length)throw Error(JSON.stringify(errors));
 writeFileSync(new URL('./warden-arena-browser-results.json',import.meta.url),JSON.stringify({report,hook,errors},null,2));
 console.log('PASS browser arena: loaded assets, rendered layout/deck/hook, actual Engine hook ascent and boundaries, no JS exceptions.',hook);
}finally{ws.close();}
