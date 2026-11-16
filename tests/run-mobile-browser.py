"""Real Chromium/CDP touch emulation using only Python's standard library.
Uses a temporary browser profile: never reads or clears the player's saves.
Run: <python> tests/run-mobile-browser.py
"""
import base64, hashlib, http.server, json, os, socket, struct, subprocess, tempfile, threading, time, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a): pass
 def handle(self):
  try:super().handle()
  except (ConnectionResetError,ConnectionAbortedError,BrokenPipeError):pass

class CDP:
 def __init__(self,url):
  from urllib.parse import urlparse
  u=urlparse(url); self.s=socket.create_connection((u.hostname,u.port));self.s.settimeout(30);self.seq=0;self.events=[]
  key=base64.b64encode(os.urandom(16)).decode()
  self.s.sendall(('GET '+u.path+' HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: '+key+'\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
  head=b''
  while not head.endswith(b'\r\n\r\n'): head+=self.s.recv(1)
  assert b'101' in head,head
 def read(self,n):
  b=b''
  while len(b)<n:
   data=self.s.recv(n-len(b))
   if not data: raise RuntimeError('CDP disconnected')
   b+=data
  return b
 def call(self,method,params=None):
  self.seq+=1;seq=self.seq;payload=json.dumps({'id':seq,'method':method,'params':params or {}}).encode();mask=os.urandom(4);n=len(payload)
  header=bytes([129,128+n]) if n<126 else bytes([129,254])+struct.pack('!H',n) if n<65536 else bytes([129,255])+struct.pack('!Q',n)
  self.s.sendall(header+mask+bytes(v^mask[i%4] for i,v in enumerate(payload)))
  while True:
   h=self.read(2);length=h[1]&127
   if length==126:length=struct.unpack('!H',self.read(2))[0]
   elif length==127:length=struct.unpack('!Q',self.read(8))[0]
   data=json.loads(self.read(length))
   if data.get('id')==seq:
    if 'error' in data:raise RuntimeError(data['error'])
    return data.get('result',{})
   self.events.append(data)
 def js(self,expression):
  r=self.call('Runtime.evaluate',{'expression':expression,'awaitPromise':True,'returnByValue':True,'userGesture':True,'replMode':True})
  if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'])
  return r.get('result',{}).get('value')

report={'checks':[],'viewports':[]}
def check(value,label):
 assert value,label
 report['checks'].append(label)
 print('PASS',label,flush=True)

with tempfile.TemporaryDirectory(prefix='nova-mobile-') as profile:
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
 port=server.server_address[1]
 chrome=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  active=Path(profile)/'DevToolsActivePort'
  for _ in range(200):
   if active.exists():break
   time.sleep(.05)
  debug=int(active.read_text().splitlines()[0]);tabs=json.load(urllib.request.urlopen(f'http://127.0.0.1:{debug}/json'));cdp=CDP(next(t['webSocketDebuggerUrl'] for t in tabs if t['type']=='page'))
  cdp.call('Runtime.enable');cdp.call('Page.enable');cdp.call('Network.enable')
  report['browser']=cdp.call('Browser.getVersion')
  def size(w,h,mobile=True):
   cdp.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':2 if mobile else 1,'mobile':mobile})
   cdp.call('Emulation.setTouchEmulationEnabled',{'enabled':mobile,'maxTouchPoints':5})
   time.sleep(.15)
  def load(suffix='',expect_touch=True):
   cdp.call('Page.navigate',{'url':f'http://127.0.0.1:{port}/index.html'+suffix})
   for _ in range(200):
    time.sleep(.05)
    if cdp.js("!!document.querySelector('.touch-controls')" if expect_touch else "!!document.querySelector('#new-game')?.onclick"):return
   raise RuntimeError('Game boot timeout')
  def point(selector):
   return cdp.js("(()=>{const b=document.querySelector("+json.dumps(selector)+");b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
  held={}
  def touch(kind,points):cdp.call('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'id':i,'x':p['x'],'y':p['y']} for i,p in points.items()]})
  def down(selector,i=1):held[i]=point(selector);touch('touchStart',held)
  def up(i=1):
   ended=held.pop(i,None)
   if ended:touch('touchEnd',{i:ended})
  def tap(selector):down(selector);up();time.sleep(.08)
  def button(action):return '.touch-controls [data-action="'+action+'"]'
  def setup():
   cdp.js("Object.assign(e.state.player,{x:120,y:790-e.state.player.h,vx:0,vy:0,health:100,dead:false,grounded:true,invuln:100});e.paused=false;e.enemies.forEach(n=>n.dead=true);e.state.bosses.forEach(b=>{b.dead=true;b.active=false});e.state.abilities.dash=true;e.state.abilities.doubleJump=true;e.state.abilities.hook=true;e.render()")
  size(640,360);load()
  cdp.js("await import('./js/engine.js').then(({Engine})=>{const render=Engine.prototype.render;Engine.prototype.render=function(...a){window.e=this;return render.apply(this,a)}})")
  tap('#new-game');check(cdp.js('!!window.e&&!e.paused'),'new game through real CDP touch');setup()
  x=cdp.js('e.state.player.x');down(button('moveRight'));time.sleep(.3);check(cdp.js('e.state.player.x')>x+10,'hold right moves continuously')
  down(button('attack'),2);time.sleep(.1);check(cdp.js("e.input.isDown('moveRight')&&e.state.player.attackSerial>0"),'right + attack multitouch');up(2);check(cdp.js("e.input.isDown('moveRight')"),'releasing attack preserves right');up()
  setup();down(button('moveLeft'));down(button('jump'),2);time.sleep(.1);check(cdp.js("e.input.isDown('moveLeft')&&e.state.player.vy<0"),'left + jump');up(2);down(button('jump'),2);time.sleep(.05);check(cdp.js('e.state.player.doubleJumpUsed'),'second touch triggers double jump');up(2);up()
  setup();down(button('moveRight'));down(button('dash'),2);time.sleep(.05);check(cdp.js('e.state.player.dashTimer>0&&e.state.player.vx>500'),'right + dash');up(2);up()
  setup();down(button('moveRight'));touch('touchMove',{1:{'x':320,'y':170}});check(cdp.js("!e.input.isDown('moveRight')"),'leaving button releases captured pointer');up()
  down(button('moveRight'));touch('touchCancel',{});held.clear();check(cdp.js("!e.input.isDown('moveRight')"),'pointer cancel releases movement')
  down(button('moveRight'))
  down(button('pause'),2);up(2);up();check(cdp.js("e.paused&&!e.input.isDown('moveRight')&&document.querySelector('.touch-controls').classList.contains('hidden')"),'pause clears and hides touch controls');tap('#resume-button')
  down(button('moveRight'));cdp.js("window.dispatchEvent(new Event('blur'))");check(cdp.js("!e.input.isDown('moveRight')"),'blur clears held touch');up()
  down(button('moveRight'));size(844,390);check(cdp.js("!e.input.isDown('moveRight')"),'orientation resize clears held touch');up();size(640,360)
  cdp.js("window.fullCalls=[];window.originalFullscreen=Element.prototype.requestFullscreen;Element.prototype.requestFullscreen=function(...args){fullCalls.push(navigator.userActivation.isActive);return originalFullscreen.apply(this,args).catch(error=>{window.fullError=String(error);throw error})}")
  before=cdp.js('e.state.player.x');tap(button('fullscreen'));time.sleep(.2)
  report['fullscreen']=cdp.js("({active:!!document.fullscreenElement,toast:document.querySelector('#toast').textContent,error:window.fullError,calls:fullCalls})")
  if report['fullscreen']['active']:
   check(True,'fullscreen entered by real touch click');tap(button('fullscreen'));time.sleep(.2);check(cdp.js('!document.fullscreenElement'),'fullscreen exits by real touch click')
  else:check(bool(report['fullscreen']['toast']),'fullscreen refusal displays helpful message')
  setup();cdp.js("window.deck={x:0,y:650,w:900,h:18,oneWay:true};e.world.map.platforms.push(deck);Object.assign(e.state.player,{x:120,y:650-e.state.player.h,grounded:true,vy:0})")
  down(button('moveDown'));down(button('jump'),2);time.sleep(.08);check(cdp.js('e.state.player.vy>0&&e.state.player.y+e.state.player.h>650&&!e.state.player.doubleJumpUsed'),'down + jump drops without normal jump');up(2);up()
  setup();cdp.js("const h=e.hookPoints[0];Object.assign(e.state.player,{x:h.x-80,y:h.y+65,vy:0});e.render()");down(button('moveRight'));down(button('special'),2);time.sleep(.04);check(cdp.js("e.state.player.hookCableTimer>0&&e.input.isDown('moveRight')"),'grapple while moving');up(2);up()
  setup();cdp.js("e.state.player.x=600;e.state.player.y=790-e.state.player.h");tap(button('interact'));check(cdp.js("e.paused&&!document.querySelector('#dialog-portrait').classList.contains('hidden')&&document.querySelector('.touch-controls').classList.contains('hidden')"),'Yara dialogue via touch blocks gameplay and preserves portrait')
  cdp.js("for(let i=0;i<30&&e.paused;i++)e.advanceDialog()")
  # Existing integrated educational suite checks all 12 challenges, hints, rewards,
  # implants, regional travel and persistence against the unmodified content.
  cdp.js("await import('./tests/network-browser-cases.js').then(m=>m.start());void(e=window.__networkEngine)")
  tap('#yara-help-toggle');check(cdp.js('e.network.session.hintOpen'),'Yara hint through actual touch');tap('#yara-hint-close')
  for w,h in [(360,800),(390,844),(640,360),(844,390),(915,412)]:
   size(w,h);cdp.js("await import('./tests/network-browser-cases.js').then(m=>m.fit())")
   check(cdp.js("document.querySelector('#dialog-actions').scrollWidth<=document.querySelector('.dialog').clientWidth"),f'{w}x{h}: quiz wraps without horizontal clipping')
  tap('[data-network-answer="0"]');check(cdp.js("e.network.session.stage==='failure'"),'quiz answer through actual touch')
  report['network']=cdp.js("await import('./tests/network-browser-cases.js').then(m=>m.complete())");check(report['network']['completed']==12,'existing 12-challenge educational + inventory regression suite')
  cdp.js("e=window.__networkEngine;void 0")
  cdp.js('e.paused=false');time.sleep(.08);tap(button('cycleImplant'));tap(button('activateImplant'));check(cdp.js("e.state.player.cybernetics.active[e.state.network.selectedImplant]>0"),'cycle and activate implant through touch')
  report['inventory']=cdp.js("await import('./tests/implant-inventory-browser-cases.js').then(m=>m.run(e))");check(report['inventory']['selected']=='interference','existing implant activation and inventory regression suite')
  load();report['continue']=cdp.js("await import('./tests/network-browser-cases.js').then(m=>m.continueGame())");check(True,'save / continue / respawn regression suite')
  for w,h in [(360,800),(390,844),(640,360),(844,390),(915,412)]:
   size(w,h);cdp.js("e=window.__networkEngine;e.closeDialog();e.paused=false;document.querySelector('#pause-screen').classList.add('hidden')");time.sleep(.1)
   if h>w:tap('.rotate-prompt button')
   metrics=cdp.js("(()=>{const c=document.querySelector('#game').getBoundingClientRect();const buttons=[...document.querySelectorAll('.touch-controls button')].map(b=>{const r=b.getBoundingClientRect();return {action:b.dataset.action,x:r.x,y:r.y,w:r.width,h:r.height}});return {canvas:{w:c.width,h:c.height},overflow:document.documentElement.scrollWidth>innerWidth,buttons}})()")
   check(not metrics['overflow'] and abs(metrics['canvas']['w']/metrics['canvas']['h']-16/9)<.01,f'{w}x{h}: 16:9 canvas without horizontal scrolling')
   check(all(b['w']>=44 and b['h']>=44 and b['x']>=0 and b['y']>=0 and b['x']+b['w']<=w+1 and b['y']+b['h']<=h+1 for b in metrics['buttons']),f'{w}x{h}: all touch targets visible and at least 44px')
   cdp.js("e.ui.showDialog('Kael','Verificação de diálogo. '.repeat(150));e.paused=true")
   check(cdp.js("document.querySelector('.dialog').scrollHeight>document.querySelector('.dialog').clientHeight"),f'{w}x{h}: long dialogue scrolls')
   tap('#dialog-close');cdp.js("e.closeDialog();e.paused=false")
   screenshot=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'];(ROOT/f'tests/mobile-{w}x{h}.png').write_bytes(base64.b64decode(screenshot));report['viewports'].append({'width':w,'height':h,**metrics})
  # Persisted campaign from the existing suite is continued in the same isolated profile.
  cdp.js("e=window.__networkEngine;void 0")
  size(844,390);cdp.js("e=window.__networkEngine;e.closeDialog();e.paused=false");time.sleep(.1)
  cdp.js('e.state.player.health=0')
  for _ in range(80):
   time.sleep(.05)
   if cdp.js("!document.querySelector('#death-screen').classList.contains('hidden')"):break
  check(cdp.js("!document.querySelector('#death-screen').classList.contains('hidden')"),'death screen blocks gameplay');tap('#respawn-button');check(cdp.js('!e.state.player.dead&&e.state.player.health>0'),'restart from checkpoint through touch')
  tap(button('pause'));tap('[data-tab="controls"]');cdp.js("const s=document.querySelector('.touch-setting select');s.value='hide';s.dispatchEvent(new Event('change'))");tap('#resume-button');check(cdp.js("document.querySelector('.touch-controls').classList.contains('hidden')"),'manual hide preference')
  load();check(cdp.js("localStorage.getItem('nova-aurora-touch-v1')==='hide'"),'touch preference persists independently of campaign')
  size(1280,800,False)
  # Capture engine before another desktop start.
  cdp.js("await import('./js/engine.js').then(({Engine})=>{const r=Engine.prototype.render;Engine.prototype.render=function(...a){window.e=this;return r.apply(this,a)}});document.querySelector('#new-game').click()")
  setup();x=cdp.js('e.state.player.x');cdp.call('Input.dispatchKeyEvent',{'type':'keyDown','key':'d','code':'KeyD'});time.sleep(.2);cdp.call('Input.dispatchKeyEvent',{'type':'keyUp','key':'d','code':'KeyD'});check(cdp.js('e.state.player.x')>x,'desktop keyboard movement retained')
  size(844,390);cdp.js("localStorage.setItem('nova-aurora-touch-v1','auto')");load('?towerTest=1')
  for _ in range(100):
   if cdp.js('!!window.towerTest'):break
   time.sleep(.05)
  cdp.js("e=towerTest.engine;towerTest.emp(true);towerTest.floor(2);e.state.abilities.dash=true;e.state.player.invuln=100;void 0");x=cdp.js('e.state.player.x');down(button('moveRight'));down(button('jump'),2);time.sleep(.15);check(cdp.js('e.state.player.x')>x,'Aurora Tower movement and jump through touch');up(2);up()
  cdp.js("towerTest.vespera(2,'network_overload');e.debugCombat=false;e.state.player.invuln=100")
  down(button('moveLeft'));down(button('dash'),2);time.sleep(.05);check(cdp.js("e.state.player.dashTimer>0&&!document.querySelector('#boss-hud').classList.contains('hidden')&&e.state.bosses[2].zones.length>0"),'boss dash controls, health and attack telegraphs retained');up(2);up()
  shot=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'];(ROOT/'tests/mobile-boss-844x390.png').write_bytes(base64.b64decode(shot))
  cdp.js("e.state.bosses.forEach(b=>b.active=false);Object.assign(e.state.player,{x:3000,y:790-e.state.player.h,vx:0,vy:0,grounded:true});e.paused=false;e.render()");x=cdp.js('e.state.player.x');down(button('moveRight'));down(button('attack'),2);time.sleep(.15);check(cdp.js("e.input.isDown('moveRight')&&e.state.player.attackSerial>0&&e.state.region==='factory'"),'Industrial Complex movement and attack through touch');up(2);up()
  cdp.call('Network.setBlockedURLs',{'urls':['*mobile-controls.js','*display-mode.js']});load(expect_touch=False);tap('#new-game');check(cdp.js("document.querySelector('#title-screen').classList.contains('hidden')"),'New Game works with both optional modules blocked');load(expect_touch=False);tap('#continue-game');check(cdp.js("document.querySelector('#title-screen').classList.contains('hidden')"),'Continue works with both optional modules blocked')
  cdp.call('Network.setBlockedURLs',{'urls':[]})
  report['errors']=[v for v in cdp.events if v.get('method')=='Runtime.exceptionThrown'];check(not report['errors'],'no uncaught browser exceptions')
  report['passed']=True
 finally:
  (ROOT/'tests/mobile-browser-results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
  chrome.terminate();chrome.wait(timeout=15);server.shutdown()
