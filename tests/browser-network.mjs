import{writeFileSync,mkdirSync}from'node:fs';
async function connect(url){const ws=new WebSocket(url);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});let seq=0;const pending=new Map(),events=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id){events.push(m);return}const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)});return{ws,events,call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>reject(Error('Timeout '+method)),25000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}}}
const version=await fetch('http://127.0.0.1:9222/json/version').then(r=>r.json()),browser=await connect(version.webSocketDebuggerUrl);let page,context;
try{
 context=(await browser.call('Target.createBrowserContext')).browserContextId;const {targetId}=await browser.call('Target.createTarget',{url:'about:blank',browserContextId:context});const tabs=await fetch('http://127.0.0.1:9222/json/list').then(r=>r.json());page=await connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 await page.call('Runtime.enable');await page.call('Network.enable');await page.call('Network.setCacheDisabled',{cacheDisabled:true});
 const ev=async expression=>{const r=await page.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const run=fn=>ev(`import('/tests/network-browser-cases.js').then(m=>m.${fn}())`);
 const size=async(width,height)=>page.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 const load=async()=>{await page.call('Page.navigate',{url:(process.env.TEST_BASE_URL||'http://127.0.0.1:8765/')+'index.html'});for(let i=0;i<80;i++){await new Promise(r=>setTimeout(r,50));if(await ev("!!document.querySelector('#new-game')?.onclick"))return}throw Error('Game did not start')};
 mkdirSync(new URL('./network-screenshots/',import.meta.url),{recursive:true});const shot=async name=>{const r=await page.call('Page.captureScreenshot',{format:'png'});writeFileSync(new URL('./network-screenshots/'+name+'.png',import.meta.url),Buffer.from(r.data,'base64'))};
 await size(1280,900);await load();await run('start');await shot('dns-question');
 await ev("import('/tests/yara-assistance-browser-cases.js').then(m=>m.preview(__networkEngine))");
 for(const [w,h]of [[1280,900],[390,640],[640,360]]){await size(w,h);console.log(await ev("import('/tests/yara-assistance-browser-cases.js').then(m=>m.fit(__networkEngine))"));await shot('yara-dns-'+w+'x'+h);}
 await size(1280,900);await ev('__networkEngine.network.setHintOpen(false)');await run('wrong');await shot('access-denied');
 for(const [w,h]of [[390,640],[640,360],[1280,900]]){await size(w,h);await ev("__networkEngine.network.showQuestion()");console.log(await run('fit'));await shot('question-'+w+'x'+h);await ev("__networkEngine.network.answer(0)");}
 const completed=await run('complete');console.log(completed);
 const implants=await ev("import('/tests/cybernetics-browser-cases.js').then(m=>m.run(__networkEngine))");console.log(implants);
 const equipment=await ev("import('/tests/implant-inventory-browser-cases.js').then(m=>m.run(__networkEngine))");console.log(equipment);
 const equipmentViews=[];for(const [w,h]of [[1280,900],[390,640],[640,360]]){await size(w,h);const result=await ev("import('/tests/implant-inventory-browser-cases.js').then(m=>m.fit())");equipmentViews.push(result);console.log(result);await shot('inventory-'+w+'x'+h);}
 await ev("import('/tests/implant-inventory-browser-cases.js').then(m=>m.close(__networkEngine))");await size(1280,900);
 for(const id of ['firewall','overclock','interference']){await ev(`import('/tests/cybernetics-browser-cases.js').then(m=>m.preview(__networkEngine,'${id}'))`);await shot(id);}
 const difficulty=[];for(const id of ['t01_yara_dns','t02_setor9_dhcp','t03_setor9_osi','t06_industrial_subnet','t09_tower_nat']){const result=await ev(`import('/tests/cybernetics-browser-cases.js').then(m=>m.difficultyPreview(__networkEngine,'${id}'))`);difficulty.push(result);console.log(result);await shot(id);}
 await ev("import('/tests/yara-assistance-browser-cases.js').then(m=>m.preview(__networkEngine))");
 for(const [w,h]of [[1280,900],[390,640],[640,360]]){await size(w,h);console.log(await ev("import('/tests/yara-assistance-browser-cases.js').then(m=>m.fit(__networkEngine))"));await shot('yara-hard-'+w+'x'+h);}
 await ev('__networkEngine.network.setHintOpen(false)');
 await size(390,640);console.log(await run('fit'));await shot('hard-390x640');await size(640,360);console.log(await run('fit'));await shot('hard-640x360');await size(1280,900);
 const equipmentChecks=await ev("import('/tests/implant-inventory-browser-cases.js').then(m=>m.questionScope(__networkEngine))");console.log(equipmentChecks);
 const assistance=await ev("import('/tests/yara-assistance-browser-cases.js').then(m=>m.report())");console.log(assistance);
 await load();const continued=await run('continueGame');console.log(continued);
 const errors=page.events.filter(e=>e.method==='Runtime.exceptionThrown');if(errors.length)throw Error(JSON.stringify(errors));const report={completed,assistance,implants,equipment:{...equipment,checks:equipmentChecks.checks,viewports:equipmentViews},difficulty,continued,errors:0};writeFileSync(new URL('./network-browser-results.json',import.meta.url),JSON.stringify(report,null,2));console.log('PASS: New Journey/Continue, questions, Yara hints before/after errors on all 12, rewards, implants, controls, save/respawn, EMP, elevators and responsive panels; no JS exceptions.');
}finally{page?.ws.close();if(context)await browser.call('Target.disposeBrowserContext',{browserContextId:context});browser.ws.close()}
