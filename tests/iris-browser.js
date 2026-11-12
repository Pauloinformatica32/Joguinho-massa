import {Engine,newState} from '../js/engine.js';
import {UI} from '../js/ui.js';
import {GROUND,assetRegionAt} from '../js/map.js';

const checks=[];
const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
const report=document.createElement('pre');document.body.prepend(report);
const saveKey='nova-aurora-save-v1',originalSave=localStorage.getItem(saveKey);
try {
  const e=new Engine(document.querySelector('#game'),newState(),new UI());
  await Promise.all([e.assets.loadRegion('industrial'),e.assets.loadRegion('slums')]);
  const n=e.world.map.npcs.find(n=>n.id==='scientist'),cfg=e.assets.getConfig('iris');
  const img=e.assets.get(cfg.animations.idle.sheet),p=e.state.player;
  check('single scientist at original Industrial Complex position',e.world.map.npcs.filter(n=>n.id==='scientist').length===1&&n.x===3400&&n.y===GROUND&&assetRegionAt(n.x)==='industrial');
  check('correct name and asset',n.name==='Dra. Íris Vale'&&n.assetId==='iris');
  check('PNG dimensions and valid single frame',img.naturalWidth===43&&img.naturalHeight===124&&!cfg.animations.idle.invalid&&cfg.animations.idle.count===1);
  check('no failed assets',e.assets.status().failed===0&&e.assets.validate().length===0);
  const probe=document.createElement('canvas');probe.width=43;probe.height=124;
  const ctx=probe.getContext('2d');ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,43,124).data;let clear=0,minY=124,maxY=-1;
  for(let y=0;y<124;y++)for(let x=0;x<43;x++){const a=pixels[(y*43+x)*4+3];if(!a)clear++;else{minY=Math.min(minY,y);maxY=Math.max(maxY,y);checkAlpha(a)}}
  function checkAlpha(a){if(a!==255)throw Error('unexpected translucent pixel')}
  check('transparent background',clear===2206);
  check('feet meet floor with human scale',cfg.scale===0.48&&maxY+1===cfg.origin.y&&Math.round((maxY-minY+1)*cfg.scale)===60);
  check('Yara and Oren keep their sprites and scale',['yara','oren'].every(id=>e.assets.getConfig(id).scale===1&&e.spriteRenderer.available(id,'idle')));
  document.querySelector('#title-screen')?.classList.add('hidden');
  e.camera.x=3000;e.camera.y=340;p.x=3350;p.y=GROUND-p.h;e.render(false);
  e.interact();
  check('interaction opens named dialogue',e.paused&&e.dialogNpc===n&&document.querySelector('#speaker').textContent===n.name&&!document.querySelector('#dialog-screen').classList.contains('hidden'));
  check('faces Kael on left',n.spriteTarget.facing===-1&&cfg.nativeFacing===1);
  e.closeDialog();p.x=3440;e.interact();
  check('faces Kael on right',n.spriteTarget.facing===1);
  e.closeDialog();e.render(false);
  check('visible and stationary after conversation',n.x===3400&&n.y===GROUND&&n.spriteTarget.y===GROUND&&e.spriteRenderer.available('iris','idle')&&!e.paused);
  check('pixel smoothing disabled',e.ctx.imageSmoothingEnabled===false);
  for(const id of ['yara','oren-factory']){
    const other=e.world.map.npcs.find(n=>n.id===id);p.x=other.x-40;p.y=GROUND-p.h;e.interact();
    check(id+' conversation still works',e.paused&&e.dialogNpc===other);e.closeDialog();
  }
  p.x=3350;e.camera.x=3000;e.camera.y=340;e.render(false);
  report.textContent='PASS '+checks.length+' checks\n'+checks.join('\n');
} catch(error) {report.textContent='FAIL '+error.stack;console.error(error)}
finally {if(originalSave===null)localStorage.removeItem(saveKey);else localStorage.setItem(saveKey,originalSave)}
