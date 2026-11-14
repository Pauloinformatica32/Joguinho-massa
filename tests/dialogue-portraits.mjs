import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {portraitForSpeaker,DIALOGUE_PORTRAITS} from '../js/dialogue-portraits.js';
for(const [name,id] of [['Kael','kael'],['protagonist','kael'],['Yara · Hacker','yara'],['oren-slum','oren'],['oren-factory','oren'],['Oren · Mecânico','oren'],['Dra. Íris Vale','iris'],['DRA. IRIS VALE','iris'],['scientist','iris'],['Téo · Operário Sobrevivente','teo'],['teo-factory','teo']])assert.equal(portraitForSpeaker(name)?.id,id);
assert.equal(portraitForSpeaker('Falante','iris')?.id,'iris');
for(const name of ['Véspera','Warden','Matrona','TERMINAL','Registro de Kael','Sistema Yara','',null])assert.equal(portraitForSpeaker(name),null);
for(const path of Object.values(DIALOGUE_PORTRAITS)){
 const png=readFileSync(path);assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),627);assert.equal(png.readUInt32BE(20),627);
}
console.log('PASS: portrait IDs, display-name aliases, unknown speakers and five PNGs.');
