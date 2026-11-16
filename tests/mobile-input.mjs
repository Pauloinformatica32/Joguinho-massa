import assert from 'node:assert/strict';
import{ActionInput,ControlsSettings}from'../js/input.js';
import{createPlayer,updatePlayer}from'../js/player.js';
import bank from'../js/network-question-bank.js';
import{readFileSync}from'node:fs';
assert.deepEqual(bank,JSON.parse(readFileSync(new URL('../Nova_Aurora_Terminais_Redes/data/network_questions.json',import.meta.url),'utf8')),'portable question bank is identical to the approved JSON');

const settings=new ControlsSettings(),input=new ActionInput(new Set(),new Set(),settings);
input.setAction('moveRight','finger-1',true);input.setAction('attack','finger-2',true);
assert.ok(input.isDown('moveRight')&&input.consume('attack'));
input.setAction('attack','finger-2',false);assert.ok(input.isDown('moveRight'));
input.press('KeyD');input.setAction('moveRight','finger-1',false);assert.ok(input.isDown('moveRight'),'touch release preserves keyboard');input.release('KeyD');assert.ok(!input.isDown('moveRight'));
input.setAction('jump','finger-1',true);assert.ok(input.consume('jump'));input.setAction('jump','finger-1',true);assert.ok(!input.consume('jump'),'held pointer cannot repeat discrete action');
input.setAction('jump','finger-2',true);input.setAction('jump','finger-1',false);assert.ok(input.isDown('jump'),'two sources can hold the same action');
input.clear();assert.ok(!input.isDown('jump')&&!input.consume('jump'),'overlay reset clears pending edges');
settings.apply(settings.proposal('jump','KeyZ'));input.setAction('jump','finger',true);assert.ok(input.consume('jump'),'touch semantics survive keyboard rebinding');input.clear();

for(const fps of [30,60,120]){
 const platforms=[{x:0,y:500,w:300,h:18,oneWay:true},{x:0,y:560,w:300,h:18,oneWay:true},{x:0,y:790,w:300,h:100}];
 const p={...createPlayer(),x:30,y:446,grounded:true};
 const step=(keys={})=>updatePlayer(p,{platforms,...keys},1/fps,{doubleJump:true,dash:true});
 step({down:true,jump:true});assert.ok(p.vy>0&&p.jumpBuffer===0&&!p.doubleJumpUsed,'drop consumes jump at '+fps);
 for(let i=0;i<fps/2;i++)step();assert.equal(p.y+p.h,560,'next platform catches the player at '+fps);
 Object.assign(p,{y:736,grounded:true,vy:0});step({down:true,jump:true});assert.ok(p.vy<0,'solid ground still jumps at '+fps);
 Object.assign(p,{y:446,grounded:true,vy:0,dropThroughY:null});step({jump:true});assert.ok(p.vy<0,'normal platform jump retained at '+fps);
}
console.log('PASS semantic multi-source input, rebinding, overlay reset and one-way drop / solid jump at 30/60/120 FPS.');
