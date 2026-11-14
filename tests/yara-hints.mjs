import assert from'node:assert/strict';
import{NETWORK_QUESTIONS,networkChallenge,validateQuestionBank}from'../js/network-terminals.js';
import{YARA_DIALOGUES}from'../js/dialogue.js';
import{newState}from'../js/engine.js';
import{normalizeSave}from'../js/save.js';
let checks=0;const check=(value,label)=>{checks++;assert.ok(value,label)};
const normalize=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
check(NETWORK_QUESTIONS.length===12,'same 12 question IDs');check(new Set(NETWORK_QUESTIONS.map(q=>q.hint)).size===12,'individually authored hints');
const keys=[1,2,2,1,1,2,1,0,3,1,3,2];
for(const [index,q]of NETWORK_QUESTIONS.entries()){
 const applied=networkChallenge(q);check(typeof q.hint==='string'&&q.hint.length>=60&&q.hint.length<=300,'concise hint '+q.id);check(applied.hint===q.hint,'hard scenario uses matching hint '+q.id);check(q.options.length===4&&q.correctIndex===keys[index]&&applied.correctIndex===q.correctIndex,'original answer key retained');
 check(!normalize(q.hint).includes(normalize(q.options[q.correctIndex])),'no original answer quoted '+q.id);check(!normalize(q.hint).includes(normalize(applied.options[applied.correctIndex])),'no applied answer quoted '+q.id);
 check(!/(?:alternativa|opção)\s+[A-D1-4]\b|(?:resposta|alternativa)\s+(?:correta|certa)\s+é/iu.test(q.hint),'no answer index disclosed '+q.id);
 const broken=NETWORK_QUESTIONS.map(t=>t.id===q.id?{...t,hint:''}:t);assert.throws(()=>validateQuestionBank({questions:broken}));checks++;
}
const subnet=NETWORK_QUESTIONS.find(q=>q.id==='t06_industrial_subnet').hint;check(/prefixo|hosts/.test(subnet)&&/potências/.test(subnet),'subnet method present');check(!/255\.|\/24|254|\b24\b|\b8\b/.test(subnet),'subnet result not disclosed');
const ping=NETWORK_QUESTIONS.find(q=>q.id==='t10_tower_ping').hint;check(/filtros|mensagem/.test(ping)&&!/ICMP|Echo Request|Echo Reply/.test(ping),'troubleshooting guides inspection without protocol answer');
check(YARA_DIALOGUES.reunion.lines.some(l=>l.text.includes('PEDIR DICA À YARA')),'intro teaches help');check(YARA_DIALOGUES.reunion.lines.some(l=>l.text.includes('não reduz sua recompensa')),'intro explains no penalty');
const legacy=newState();delete legacy.network;legacy.abilities.hook=true;legacy.events.push('yara-reunion');const loaded=normalizeSave(legacy);check(loaded.abilities.hook&&loaded.events.includes('yara-reunion'),'saves need no hint metadata');check(!('hintViewed' in loaded.network),'hint use not added to save requirements');
console.log(`PASS: ${checks} Yara hint checks; 12 unique concise hints, unchanged answers, no quoted answers/results and compatible legacy saves.`);
