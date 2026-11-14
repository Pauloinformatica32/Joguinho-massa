import {writeFileSync,mkdirSync} from 'node:fs';
const stage=process.argv[2]||'updated';
mkdirSync(new URL('./world-'+stage+'/',import.meta.url),{recursive:true});
const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();
const create=await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(create.webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let seq=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:8777/index.html?world='+Date.now()});
 await new Promise(r=>setTimeout(r,1200));
 await ev(`(async()=>{const {Engine,newState}=await import('/js/engine.js');const {UI}=await import('/js/ui.js');const s=newState();s.devTowerTest=true;s.abilities.hook=s.abilities.doubleJump=s.abilities.dash=s.abilities.emp=true;s.bosses.forEach(b=>{b.dead=true;b.health=0});document.querySelector('#title-screen').classList.add('hidden');window.worldPreview=new Engine(document.querySelector('#game'),s,new UI());await worldPreview.assets.loadCommon();})()`.replace('await worldPreview.assets.loadCommon();',''));
 const views=[['streets',400,733],['rooftops',1050,180],['matrona',1920,733],['machinery',3550,340],['warden',4800,733],['floor1',6600,430],['floor2',10000,180],['floor3',13650,733],['vespera',14600,733],['gate',2330,733]];
 if(stage==='updated')views.push(['antenna',640,-404],['crane',3800,-364],['archive',7200,-369]);
 for(const [name,x,y]of views){
  const bossIndex={matrona:0,warden:1,vespera:2}[name];
  await ev(`(async()=>{const e=worldPreview,p=e.state.player;e.state.bosses.forEach(b=>{b.dead=true;b.active=false});${bossIndex===undefined?'':`Object.assign(e.state.bosses[${bossIndex}],{dead:false,active:true,health:180,phase:1,facing:-1,wardenState:'idle',matronaState:'idle'});`}p.x=${x};p.y=${y};e.camera.arena=null;await e.assets.loadRegion(${x}<2400?'slums':${x}<5200?'industrial':${x}>=13000?'virus_core':'corporate');e.tower.syncCamera(true);e.camera.update(p,e.canvas.width,e.canvas.height,15600,900,1);e.render(false);})()`);
  const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('./world-'+stage+'/'+name+'.png',import.meta.url),Buffer.from(shot.data,'base64'));
 }
 if(stage==='updated'){
  console.log(await ev(`import('/tests/world-browser-cases.js').then(m=>m.run(worldPreview))`));
  await ev(`(()=>{const e=worldPreview,p=e.state.player;p.x=2310;p.y=790-p.h;e.tower.syncCamera(true);e.regionTransitions.interact();e.regionTransitions.update(.45);})()`);
  for(const name of ['transition-opening','transition-title']){const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('./world-'+stage+'/'+name+'.png',import.meta.url),Buffer.from(shot.data,'base64'));await ev('worldPreview.regionTransitions.update(.85)');}
 }
 if(errors.length)throw Error(JSON.stringify(errors));console.log('PASS '+stage+': browser captures; no JS exceptions');
}finally{ws.close()}

