import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5500/';
async function connect(url){
 const ws=new WebSocket(url);await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true})});
 let serial=0;const pending=new Map(),events=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id){events.push(m);return}const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)});
 return {ws,events,call(method,params={}){return new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout: '+method))},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}};
}
const version=await(await fetch('http://127.0.0.1:9222/json/version')).json();
const browser=await connect(version.webSocketDebuggerUrl);let context,page;
try{
 context=(await browser.call('Target.createBrowserContext')).browserContextId;
 const {targetId}=await browser.call('Target.createTarget',{url:'about:blank',browserContextId:context});
 const tabs=await(await fetch('http://127.0.0.1:9222/json/list')).json();page=await connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 const {call,events}=page;await call('Runtime.enable');await call('Network.enable');
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 await call('Page.navigate',{url:base+'index.html'});await pause(1300);
 if(process.argv.includes('--diagnose')){
  await evaluate(`document.querySelector('#new-game').click();document.querySelector('#continue-game').click()`);
  console.log(JSON.stringify({handlers:await evaluate(`({newGame:typeof document.querySelector('#new-game').onclick,continueGame:typeof document.querySelector('#continue-game').onclick,titleVisible:!document.querySelector('#title-screen').classList.contains('hidden')})`),errors:events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails)},null,2));
 }else{
  let checks=0;const check=(n,ok)=>{checks++;assert.ok(ok,n)};
  const instrument=()=>evaluate(`(async()=>{const {Engine}=await import('/js/engine.js');const original=Engine.prototype.update;Engine.prototype.update=function(dt){window.__startupEngine=this;return original.call(this,dt)};return true})()`);
  await instrument();await evaluate(`document.querySelector('#new-game').click()`);await pause(500);
  check('new journey starts',await evaluate(`document.querySelector('#title-screen').classList.contains('hidden')&&!!window.__startupEngine`));
  const start=await evaluate(`({x:__startupEngine.state.player.x,y:__startupEngine.state.player.y})`);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'d',code:'KeyD'});await pause(350);await call('Input.dispatchKeyEvent',{type:'keyUp',key:'d',code:'KeyD'});
  check('keyboard movement',await evaluate(`__startupEngine.state.player.x>${start.x}+20`));
  const ground=await evaluate(`__startupEngine.state.player.y`);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space'});await pause(170);await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space'});
  check('keyboard jump',await evaluate(`__startupEngine.state.player.y<${ground}-20`));
  check('new journey does not overwrite saves',await evaluate(`localStorage.getItem('nova-aurora-save-v1')===null`));
  await evaluate(`(async()=>{const {newState}=await import('/js/engine.js'),{saveGame}=await import('/js/save.js');const s=newState('Startup Test');s.player.x=410;s.player.y=733;s.credits=137;s.events.push('startup-test-marker');saveGame(s);window.__saveBefore=localStorage.getItem('nova-aurora-save-v1')})()`);
  const saved=await evaluate(`localStorage.getItem('nova-aurora-save-v1')`);
  await call('Page.reload',{ignoreCache:true});await pause(1100);await instrument();
  check('continue enabled for valid save',await evaluate(`!document.querySelector('#continue-game').disabled`));
  await evaluate(`document.querySelector('#continue-game').click()`);await pause(400);
  check('continue restores state',await evaluate(`__startupEngine.state.player.name==='Startup Test'&&__startupEngine.state.credits===137&&__startupEngine.state.events.includes('startup-test-marker')&&Math.abs(__startupEngine.state.player.x-410)<1`));
  check('reload keeps saved progress',await evaluate(`localStorage.getItem('nova-aurora-save-v1')===${JSON.stringify(saved)}`));
  await call('Page.reload',{ignoreCache:true});await pause(1000);await instrument();await evaluate(`document.querySelector('#continue-game').click()`);await pause(300);
  check('continue works after another reload',await evaluate(`__startupEngine.state.player.name==='Startup Test'`));
  const errors=events.filter(e=>e.method==='Runtime.exceptionThrown');
  check('no fatal browser exceptions',errors.length===0);
  const bad=events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&!e.params.response.url.endsWith('/favicon.ico'));
  check('no failed resources',bad.length===0);
  console.log(JSON.stringify({checks,base,storage:'isolated disposable browser context; existing saves untouched'}));
  if(process.argv.includes('--regressions')){
   for(const name of ['m4','e7','v3','iris','teo']){
    await call('Page.navigate',{url:base+'tests/'+name+'.html'});
    let report='';
    for(let attempt=0;attempt<80;attempt++){await pause(250);report=await evaluate(`document.querySelector('pre')?.textContent||''`);if(/^(PASS|FAIL)/.test(report))break}
    assert.ok(report.startsWith('PASS'),name+': '+report);console.log(name+': '+report.split('\n')[0]);
   }
   await call('Page.navigate',{url:base+'index.html'});await pause(1000);
   const tower=await evaluate(`import('/tests/tower-cases.js').then(m=>m.runTowerTests())`);
   console.log('tower: '+JSON.stringify(tower));
  }
 }
}finally{page?.ws.close();if(context)await browser.call('Target.disposeBrowserContext',{browserContextId:context});browser.ws.close()}
