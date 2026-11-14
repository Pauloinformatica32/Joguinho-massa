import{createPlayer,updatePlayer}from'../js/player.js';
import{activateHook,hookInRange,nearestHook}from'../js/hook.js';
const overlap=(p,b)=>p.x+p.w>b.x&&p.x<b.x+b.w&&p.y+p.h>b.y&&p.y<b.y+b.h;
export function traversalNodes(map){
 const nodes=map.platforms.filter(p=>p.h<70||p.kind==='cover');
 for(const floor of map.platforms.filter(p=>p.kind==='ground')){
  const cuts=map.platforms.filter(p=>p!==floor&&p.h>=70&&p.y<790&&p.y+p.h>=790&&p.x>=floor.x&&p.x<floor.x+floor.w).map(p=>[p.x,p.x+p.w]);
  cuts.push(...map.hazards.filter(h=>h.y+h.h>=772&&h.x>=floor.x&&h.x<floor.x+floor.w).map(h=>[h.x,h.x+h.w]));
  cuts.sort((a,b)=>a[0]-b[0]);let x=floor.x;
  for(const [a,b]of cuts){if(a-x>=40)nodes.push({id:`ground:${x}`,x,y:790,w:a-x,h:0,ground:true});x=Math.max(x,b)}
  if(floor.x+floor.w-x>=40)nodes.push({id:`ground:${x}`,x,y:790,w:floor.x+floor.w-x,h:0,ground:true});
 }
 return nodes;
}
export function findTransition(map,source,target,{hook=true,doubleJump=true,dash=false,fps=60,anchorId=null,startAt=null,landingX=null}={}){
 const cx=landingX??target.x+target.w/2,lo=Math.max(source.x+1,target.x-440),hi=Math.min(source.x+source.w-31,target.x+target.w+440);
 if(lo>hi||target.y<source.y-570||target.y>source.y+1150)return null;
 const starts=[Math.max(lo,Math.min(hi,cx-15)),lo,hi];for(let x=lo;x<=hi;x+=70)starts.push(x);
 for(const start of startAt===null?[...new Set(starts)]:[startAt]){
  const initial={...createPlayer(),x:start,y:source.y-54,grounded:true};
  if(map.platforms.some(s=>s.h>=70&&s.kind!=='ground'&&overlap(initial,s))||map.hazards.some(h=>overlap(initial,h)))continue;
  const hooks=hook?map.hookPoints.filter(h=>Math.hypot(h.x-start,h.y-(source.y-32))<390):[];
  const modes=anchorId?hooks.filter(h=>h.id===anchorId).map(h=>({type:'hook',id:h.id})):[{type:'jump'},...(doubleJump?[{type:'double'}]:[]),...(dash?[{type:'dash'}]:[]),...hooks.map(h=>({type:'hook',id:h.id}))];
  for(const mode of modes){
   const p={...initial},anchor=hooks.find(h=>h.id===mode.id);let used=false;const inputs=[];
   if(anchor){if(!hookInRange(p,{...anchor,cooldown:0}))continue;activateHook(p,{...anchor,cooldown:0});used=true}
   for(let tick=0;tick<fps*3;tick++){
    const right=p.x+p.w/2<cx-9,left=p.x+p.w/2>cx+9;
    const input={right,left,jump:!used&&(tick===0||mode.type==='double'&&tick===Math.round(fps*.25)),dash:mode.type==='dash'&&tick===Math.round(fps*.2),platforms:map.platforms};
    inputs.push({right,left,jump:input.jump,dash:input.dash});updatePlayer(p,input,1/fps,{hook,doubleJump,dash});
    if(map.hazards.some(h=>overlap(p,h)))break;
    if(tick>1&&p.grounded&&Math.abs(p.y+p.h-target.y)<1&&p.x+p.w>target.x+4&&p.x<target.x+target.w-4)return {source:source.id,target:target.id,start,mode,inputs,seconds:(tick+1)/fps,landing:{x:p.x,y:p.y}};
    if(p.fall)break;
   }
  }
 }
 if(landingX===null&&target.ground){
  const aims=[target.x+45,target.x+target.w-45,source.x-45,source.x+source.w+45].filter(x=>x>=target.x+15&&x<=target.x+target.w-15);
  for(const aim of aims){const result=findTransition(map,source,target,{hook,doubleJump,dash,fps,anchorId,startAt,landingX:aim});if(result)return result}
 }
 return null;
}
export function buildTraversalGraph(map,{fps=60,roots=[120,2470,5310,8990,13210]}={}){
 const nodes=traversalNodes(map),edges=[],reached=new Set();
 // Entrances are separate roots; closed EMP gates are tested separately by progression tests.
 for(const x of roots){const root=nodes.find(n=>n.ground&&x>=n.x&&x+30<=n.x+n.w);if(root)reached.add(root.id)}
 const bands=x=>x<2400?0:x<5200?1:x<8400?2:x<12600?3:4;
 for(let pass=0;pass<12;pass++){
  let added=0;
  for(const target of nodes){if(reached.has(target.id))continue;
   for(const source of nodes.filter(n=>reached.has(n.id)&&bands(n.x)===bands(target.x))){
    const path=findTransition(map,source,target,{fps,doubleJump:target.x>=2400,hook:true,dash:target.x>=2400});
    if(path){edges.push(path);reached.add(target.id);added++;break}
   }
  }
  if(!added)break;
 }
 return {nodes,edges,reached:[...reached],missing:nodes.filter(n=>!reached.has(n.id))};
}
