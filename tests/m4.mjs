import {readFileSync} from 'node:fs';
import {runM4Tests} from './m4-cases.js';
const cfg=JSON.parse(readFileSync(new URL('../assets/enemies/m4/config.json',import.meta.url),'utf8'));
console.log('PASS: '+runM4Tests(cfg).length+' M4 checks at 30/60/120 FPS.');
