import {ACCESS_GATES} from '../js/region-transitions.js';
import {TOWER_ELEVATORS} from '../js/tower-layout.js';
import {normalizeSave} from '../js/save.js';
import {newState} from '../js/engine.js';
export async function run(e){
 let checks=0;const check=(v,message)=>{checks++;if(!v)throw Error(message)};
 const p=e.state.player;
 const finish=()=>{for(let i=0;i<130;i++)e.regionTransitions.update(1/60)};
 for(let repeat=0;repeat<3;repeat++)for(const gate of ACCESS_GATES)for(const side of [0,1]){
  p.x=gate.stops[side]-p.w/2;p.y=790-p.h;e.tower.syncCamera(true);
  check(e.regionTransitions.interact(),'gate interaction');check(!!e.regionTransitions.active,'transition started');
  e.regionTransitions.interact();finish();check(!e.regionTransitions.active,'controls restored');check(p.x===gate.arrivals[side],'safe destination');
  check(!e.world.map.platforms.some(s=>!s.disabled&&s.h>=70&&p.x+p.w>s.x&&p.x<s.x+s.w&&p.y+p.h>s.y&&p.y<s.y+s.h),'no wall overlap');
 }
 const gate=ACCESS_GATES[1];e.state.abilities.emp=false;p.x=5110;p.y=790-p.h;e.regionTransitions.interact();check(!e.regionTransitions.active,'EMP gate rejects unauthorized entry');
 p.x=5280;e.regionTransitions.interact();check(!!e.regionTransitions.active,'old tower save without EMP can return to Iris');finish();check(p.x===5090,'unauthorized legacy return safe');
 e.state.abilities.emp=true;
 for(const lift of TOWER_ELEVATORS)for(const side of [0,1]){p.x=lift.stops[side].x;p.y=790-p.h;e.tower.syncCamera(true);e.tower.interact();check(!!e.tower.transition,'elevator starts');for(let i=0;i<100;i++)e.tower.update(1/60);check(p.x===lift.stops[1-side].arrivalX,'elevator correct destination');check(!e.tower.transition,'elevator controls restored');check(e.state.abilities.emp,'EMP reusable');}
 const old=newState();old.player.x=600;old.player.y=733;old.events=['npc-yara'];old.abilities.hook=true;const migrated=normalizeSave(old);check(migrated.events.includes('npc-yara')&&migrated.abilities.hook,'old progression retained');
 const elevated=newState();elevated.player.x=620;elevated.player.y=-404;check(normalizeSave(elevated).player.y===-404,'upper-world save valid');
 const count=e.enemies.length;check(new Set(e.enemies.map(a=>a.id)).size===count,'no duplicate enemies');
 p.x=500;p.y=790-p.h;p.health=100;e.paused=false;const before=p.x;e.keydown('d');for(let i=0;i<8;i++)e.update(1/60);e.keyup('d');check(p.x>before,'real controls work after repeated transitions');
 p.x=5150;p.y=790-p.h;e.state.abilities.emp=false;const origin=p.x;p.x+=60;e.regionTransitions.constrain(origin);check(p.x+p.w<=5190,'walking cannot bypass locked gate');e.state.abilities.emp=true;
 return {checks,enemies:count,transitions:13,elevators:4,assets:e.assets.status()};
}
