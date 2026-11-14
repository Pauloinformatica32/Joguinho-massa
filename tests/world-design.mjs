import assert from 'node:assert/strict';
import {buildMap} from '../js/map.js';
import {createPlayer,updatePlayer} from '../js/player.js';
import {activateHook,hookInRange} from '../js/hook.js';
import {Camera} from '../js/camera.js';
import {WORLD_TOP} from '../js/world-design.js';
import {newState} from '../js/engine.js';
import {normalizeSave} from '../js/save.js';
const map=buildMap();
const fps=Number(process.argv[2]||60);
let count=0;
// Every new deck must be reachable from existing ground/geometry through real
// jump, double-jump or grapple impulses. Reachability expands to a fixed point.
const decks=map.platforms.filter(s=>s.h<=30&&!s.id?.includes('warden'));
const reached=new Set(map.platforms.filter(s=>s.kind==='ground'));
const abilities={hook:true,doubleJump:true,dash:true};
for(let pass=0;pass<12;pass++){
 let added=0;
 for(const target of decks){if(reached.has(target))continue;
  const sources=[...reached].filter(s=>Math.abs((s.x+s.w/2)-(target.x+target.w/2))<s.w/2+500&&target.y>=s.y-530&&target.y<=s.y+300);
  let success=false;
  for(const src of sources){if(success)break;
   const cx=target.x+target.w/2,starts=[Math.max(src.x+2,Math.min(src.x+src.w-32,cx-15)),Math.max(src.x+2,Math.min(src.x+src.w-32,cx< src.x?src.x+5:src.x+src.w-35))];
   for(const start of starts){if(success)break;
    const modes=[null,...map.hookPoints.filter(h=>Math.hypot(h.x-start,h.y-(src.y-32))<400)];
    for(const hook of modes){const p=createPlayer();p.x=start;p.y=src.y-p.h;p.grounded=true;if(hook){if(!hookInRange(p,hook))continue;activateHook(p,hook)}
     for(let tick=0;tick<fps*2.5;tick++){updatePlayer(p,{right:p.x+p.w/2<cx-12,left:p.x+p.w/2>cx+12,jump:!hook&&(tick===0||tick===Math.round(fps*.267)),platforms:map.platforms},1/fps,{...abilities,doubleJump:target.x>=2400});if(p.grounded&&Math.abs(p.y+p.h-target.y)<1&&p.x+p.w>target.x&&p.x<target.x+target.w){success=true;break}}
     if(success)break;
    }
   }
  }
  if(success){reached.add(target);added++;}
 }
 if(!added)break;
}
const missing=decks.filter(s=>s.architecture&&!reached.has(s));assert.deepEqual(missing.map(s=>s.id),[],'new route accessibility');count=decks.filter(s=>s.architecture).length;
for(const reward of map.secrets.slice(-7)){assert.ok(map.platforms.some(s=>reward.x>=s.x-20&&reward.x<=s.x+s.w+20&&Math.abs(reward.y-s.y)<2),'reward supported '+reward.item)}
for(const t of map.terminals.filter(t=>t.questionId))assert.ok([...reached].some(s=>t.x>=s.x&&t.x<=s.x+s.w&&Math.abs(s.y-t.y)<100),'network console accessible via real physics '+t.questionId);
const camera=new Camera();camera.update({x:600,y:-400,w:30,h:54},960,540,15600,900,1);assert.ok(camera.y>=WORLD_TOP&&camera.y<0);
const walker=createPlayer();walker.x=1340;walker.y=790-walker.h;for(let i=0;i<fps*2;i++)updatePlayer(walker,{right:true,platforms:map.platforms},1/fps,{});assert.ok(walker.x+walker.w<=1390,'quarantine requires upper route');
for(const x of [1400,10625,12025]){const s=newState();s.bosses.slice(0,2).forEach(b=>b.dead=true);s.player.x=x;s.player.y=733;s.abilities.emp=true;const next=normalizeSave(s);assert.ok(next.player.y>=WORLD_TOP);assert.ok(!map.platforms.some(w=>w.h>=70&&next.player.x+next.player.w>w.x&&next.player.x<w.x+w.w&&next.player.y+next.player.h>w.y&&next.player.y<w.y+w.h),'safe migrated wall '+x);assert.equal(normalizeSave(next).player.x,next.player.x);}
console.log(`PASS at ${fps} FPS: ${count} added platforms reachable using actual physics; rewards supported; upper camera bounds.`);
