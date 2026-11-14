import{Engine,newState}from'../js/engine.js';
import{UI}from'../js/ui.js';
import{spawnEnemies,renderEnemy,updateEnemies}from'../js/enemies.js';
import{isTowerEnemy,resetTowerEnemy,towerFrame,towerAttackBox,towerBeamActive,clipTowerBeam,opticMuzzle}from'../js/tower-enemies.js';
export async function runTowerEnemiesBrowser(){
 let checks=0;const check=(name,ok)=>{checks++;if(!ok)throw Error(name)};
 const before=localStorage.getItem('nova-aurora-save-v1'),s=newState();s.devTowerTest=true;s.bosses.slice(0,2).forEach(b=>{b.dead=true;b.health=0});
 const e=new Engine(document.querySelector('#game'),s,new UI());await e.assets.loadRegion('corporate');e.applyAssetCollisionConfigs();
 check('assets valid',!e.assets.status().failed&&!e.assets.errors.length);
 const canvas=document.createElement('canvas');canvas.id='tower-enemy-atlas';canvas.width=1160;canvas.height=9*110;const c=canvas.getContext('2d');c.fillStyle='#20303b';c.fillRect(0,0,canvas.width,canvas.height);c.font='12px monospace';
 let row=0;const bounds={};
 for(const id of ['interceptor_i9','optic_s6','synaptic_h0']){
  const cfg=e.assets.getConfig(id),entity=e.enemies.find(x=>x.assetId===id);
  check(id+' collision matches config',entity.w===cfg.collision.width&&entity.h===cfg.collision.height);
  bounds[id]={};
  for(const [name,a]of Object.entries(cfg.animations)){
   const img=e.assets.get(a.sheet);check(id+' '+name+' loaded',e.spriteRenderer.available(id,name)&&img.naturalWidth===a.count*a.frameWidth&&img.naturalHeight===a.frameHeight);
   const probe=document.createElement('canvas');probe.width=img.naturalWidth;probe.height=img.naturalHeight;const pc=probe.getContext('2d');pc.drawImage(img,0,0);const rgba=pc.getImageData(0,0,probe.width,probe.height).data;
   check(id+' '+name+' transparent',rgba.some((v,i)=>i%4===3&&v===0));
   const results=[];
   for(let frame=0;frame<a.count;frame++){
    let minX=a.frameWidth,minY=a.frameHeight,maxX=-1,maxY=-1;
    for(let y=0;y<a.frameHeight;y++)for(let x=0;x<a.frameWidth;x++)if(rgba[(y*probe.width+frame*a.frameWidth+x)*4+3]){minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY)}
    results.push([minX,minY,maxX,maxY]);check(id+' '+name+' nonempty '+frame,maxX>=minX&&maxY>=minY);
    const calls=[],ctx={save(){},restore(){},translate(){this.flipped=true},scale(){},drawImage(...args){calls.push(args)}};
    for(const direction of [-1,1]){
     ctx.flipped=false;e.spriteRenderer.draw(ctx,id,name,{},0,{x:100,y:100,frameOverride:frame,facing:direction});const args=calls.at(-1);
     check(id+' '+name+' source/direction '+frame+' '+direction,args[1]===frame*a.frameWidth&&args[3]===a.frameWidth&&args[4]===a.frameHeight&&args[7]===Math.round(a.frameWidth*cfg.scale)&&args[8]===Math.round(a.frameHeight*cfg.scale)&&ctx.imageSmoothingEnabled===false&&ctx.flipped===(direction===1));
    }
    c.fillStyle='#daeeee';c.fillText(id+' '+name+' '+frame,8+frame*144,row*110+14);c.fillStyle='#596c77';c.fillRect(10+frame*144,row*110+96,118,1);
    e.spriteRenderer.draw(c,id,name,{},0,{x:65+frame*144,y:row*110+(id==='optic_s6'?30:96),frameOverride:frame,facing:frame%2?1:-1});
   }
   bounds[id][name]=results;row++;
  }
 }
 for(const id of ['interceptor_i9','optic_s6','synaptic_h0']){
  const enemy=e.enemies.find(x=>x.assetId===id);resetTowerEnemy(enemy);enemy.towerState='attack';enemy.pendingAttack=id;
  const seen=new Set();for(let i=0;i<100;i++){seen.add(towerFrame(enemy));enemy.stateTime+=1/120}
  check(id+' attack reaches every frame',seen.size===e.assets.getConfig(id).animations.attack.count);
  enemy.dead=true;enemy.respawn=30;updateEnemies([enemy],s.player,1/60,e.world);
  let draws=0;const old=e.spriteRenderer.draw.bind(e.spriteRenderer);e.spriteRenderer.draw=(...args)=>{draws++;return old(...args)};renderEnemy(c,enemy,{x:0,y:0},e.spriteRenderer);check(id+' fades without missing death sprite',draws===1&&!towerAttackBox(enemy)&&!towerBeamActive(enemy));
  enemy.deathTime=.7;draws=0;renderEnemy(c,enemy,{x:0,y:0},e.spriteRenderer);check(id+' disappears after fade',draws===0);e.spriteRenderer.draw=old;
 }
 check('seven slots and no floor three enemies',e.enemies.filter(isTowerEnemy).length===7&&e.enemies.filter(isTowerEnemy).every(x=>x.x<12600));
 const mount=e.enemies.find(x=>x.assetId==='optic_s6'),pivots=[];resetTowerEnemy(mount,true);
 for(const facing of [-1,1]){
  mount.facing=facing;const probe=document.createElement('canvas');probe.width=200;probe.height=100;const pc=probe.getContext('2d');
  renderEnemy(pc,mount,{x:mount.x-70,y:mount.y-20},e.spriteRenderer);
  const data=pc.getImageData(0,21,200,3).data;let left=200,right=-1;for(let i=3;i<data.length;i+=4)if(data[i]){const x=((i-3)/4)%200;left=Math.min(left,x);right=Math.max(right,x)}pivots.push((left+right)/2);
 }
 check('ceiling mount fixed when flipped '+JSON.stringify(pivots),Math.abs(pivots[0]-pivots[1])<=1);
 // Real engine EMP/death routes are already exercised by the Node suite;
 // this capture shows the exact live mount, ray and collider in the tower.
 const camera=e.enemies.find(x=>x.assetId==='optic_s6');resetTowerEnemy(camera,true);s.player.x=6100;s.player.y=736;s.player.health=100;s.player.invuln=99;e.tower.syncCamera(true);
 camera.facing=camera.meleeFacing=-1;camera.towerState='attack';camera.pendingAttack=camera.assetId;camera.stateTime=.35;
 const a=opticMuzzle(camera),dx=s.player.x+15-a.x,dy=s.player.y+27-a.y,d=Math.hypot(dx,dy);camera.beam=clipTowerBeam(a,{x:a.x+dx/d*650,y:a.y+dy/d*650},e.world.map.platforms);
 check('live ceiling laser active',towerBeamActive(camera)&&camera.x===camera.homeX&&camera.y===camera.homeY);
 document.querySelectorAll('#title-screen,#dialog-screen,#ending-screen,#boss-warning').forEach(n=>n.classList.add('hidden'));document.body.prepend(canvas);e.debugCombat=true;e.render(false);
 check('normal save untouched',localStorage.getItem('nova-aurora-save-v1')===before);
 return{checks,bounds,assets:e.assets.status()};
}
