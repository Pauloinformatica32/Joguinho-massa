export const SETTINGS_KEY='nova-aurora-settings-v1';
export const ACTIONS=Object.freeze({
 moveLeft:{name:'Mover para a esquerda',keys:['KeyA','ArrowLeft']},moveRight:{name:'Mover para a direita',keys:['KeyD','ArrowRight']},
 moveDown:{name:'Mover para baixo (reservado)',keys:['KeyS','ArrowDown']},jump:{name:'Pular / salto duplo',keys:['Space']},
 attack:{name:'Atacar',keys:['KeyJ','Mouse0']},dash:{name:'Impulso / dash',keys:['Shift']},special:{name:'Gancho / EMP / habilidade',keys:['KeyK']},
 interact:{name:'Interagir',keys:['KeyE']},equip1:{name:'Equipar implante 1',keys:['Digit1']},equip2:{name:'Equipar implante 2',keys:['Digit2']},equip3:{name:'Equipar implante 3',keys:['Digit3']},
 cycleImplant:{name:'Alternar implante',keys:['KeyQ']},activateImplant:{name:'Ativar implante',keys:['KeyF']},map:{name:'Abrir mapa',keys:['KeyM']},pause:{name:'Pausar / menu',keys:['Escape']}
});
export function codeOf(value){
 if(typeof value==='object')return value.code||codeOf(value.key);
 const key=String(value||'');if(/^f\d+$/i.test(key))return key.toUpperCase();
 if(/^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F\d+|Arrow[A-Z].*|Shift.*|Space|Escape|Enter|Backspace|Tab|Mouse0|BracketLeft|BracketRight|Semicolon|Quote|Backquote|Comma|Period|Slash|Backslash|IntlBackslash|IntlRo|Equal|Minus|Home|End|PageUp|PageDown|Insert|Delete|CapsLock)$/.test(key))return key;
 if(/^[a-z]$/i.test(key))return 'Key'+key.toUpperCase();if(/^\d$/.test(key))return 'Digit'+key;
 return ({' ':'Space',shift:'Shift',escape:'Escape',enter:'Enter',arrowleft:'ArrowLeft',arrowright:'ArrowRight',arrowdown:'ArrowDown',arrowup:'ArrowUp',mouse:'Mouse0'})[key.toLowerCase()]||key;
}
export const canonical=code=>codeOf(code).replace(/^Shift(Left|Right)$/,'Shift');
export function keyName(code){code=canonical(code);return ({Space:'Espaço',Shift:'Shift',Escape:'Esc',Enter:'Enter',ArrowLeft:'←',ArrowRight:'→',ArrowDown:'↓',ArrowUp:'↑',Mouse0:'Clique',Backspace:'Backspace',BracketLeft:'[',BracketRight:']',Semicolon:'Ç / ;',Quote:'Acento / aspas',Backquote:'Crase',Comma:',',Period:'.',Slash:'/',Backslash:'Barra',IntlBackslash:'Barra ABNT',IntlRo:'ABNT',Equal:'=',Minus:'-'})[code]||code.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'Num ')}
export const validBinding=code=>/^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift|Enter|Backspace|BracketLeft|BracketRight|Semicolon|Quote|Backquote|Comma|Period|Slash|Backslash|IntlBackslash|IntlRo|Equal|Minus|Home|End|PageUp|PageDown|Insert|Delete|CapsLock|Mouse0|Escape)$/.test(code)&&code!=='KeyG';
const defaults=()=>Object.fromEntries(Object.entries(ACTIONS).map(([id,a])=>[id,[...a.keys]]));
export function validateSettings(value){
 if(value?.version!==1||!value.bindings)return defaults();const result={},used=new Set();
 for(const id of Object.keys(ACTIONS)){
  const keys=value.bindings[id];if(!Array.isArray(keys)||!keys.length||keys.length>5)return defaults();
  result[id]=[...new Set(keys.map(canonical))];
  if(id==='pause'&&!result[id].includes('Escape'))result[id].push('Escape');
  if(!result[id].some(k=>k!=='Mouse0'))return defaults();
  for(const key of result[id]){if(!validBinding(key)||key==='Escape'&&id!=='pause'||key==='Mouse0'&&id!=='attack'||used.has(key))return defaults();used.add(key)}
 }
 return result;
}
export class ControlsSettings{
 constructor(storage){this.storage=storage;this.listeners=new Set();try{this.bindings=validateSettings(JSON.parse(storage?.getItem(SETTINGS_KEY)||'null'))}catch{this.bindings=defaults()}}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 save(){this.saveError=false;try{this.storage?.setItem(SETTINGS_KEY,JSON.stringify({version:1,bindings:this.bindings}))}catch{this.saveError=true}for(const fn of this.listeners)fn()}
 conflict(action,code){code=canonical(code);return Object.keys(ACTIONS).find(id=>id!==action&&this.bindings[id].includes(code))||null}
 proposal(action,code){
  code=canonical(code);if(!ACTIONS[action]||!validBinding(code)||code==='Escape'&&action!=='pause'||code==='Mouse0'&&action!=='attack')return null;
  const bindings=structuredClone(this.bindings),owner=this.conflict(action,code),old=bindings[action][0];
  bindings[action]=[code,...bindings[action].slice(1).filter(k=>k!==code)];if(action==='pause'&&!bindings.pause.includes('Escape'))bindings.pause.push('Escape');
  if(owner){
   bindings[owner]=bindings[owner].filter(k=>k!==code);
   if(!bindings[owner].some(k=>k!=='Mouse0')){
    const used=new Set(Object.values(bindings).flat());
    const replacement=[old,...ACTIONS[owner].keys,...'UIOPZXCVBNHTYRLW'.split('').map(k=>'Key'+k)].find(k=>k!=='Escape'&&k!=='Mouse0'&&validBinding(k)&&!used.has(k));
    if(!replacement)return null;bindings[owner].unshift(replacement);
   }
  }
  return {action,code,owner,bindings};
 }
 apply(proposal){if(!proposal)return false;this.bindings=validateSettings({version:1,bindings:proposal.bindings});this.save();return true}
 reset(){this.bindings=defaults();this.save()}
}
// localStorage may be unavailable (privacy settings); gameplay still receives defaults.
let storage;if(typeof window!=='undefined')try{storage=globalThis.localStorage}catch{}
export const controls=new ControlsSettings(storage);
export const keyLabel=action=>controls.bindings[action].map(keyName).join(' / ');
export const primaryKey=action=>keyName(controls.bindings[action][0]);
export const matchesAction=(action,event)=>controls.bindings[action]?.includes(canonical(codeOf(event)));
export class ActionInput{
 constructor(keys=new Set(),pressed=new Set(),settings=controls){this.keys=keys;this.pressed=pressed;this.settings=settings}
 isDown(action){return [...this.keys].some(k=>this.settings.bindings[action]?.includes(canonical(k)))}
 consume(action){let hit=false;for(const key of this.pressed)if(this.settings.bindings[action]?.includes(canonical(key))){this.pressed.delete(key);hit=true}return hit}
 press(event){if(typeof event==='object'&&event.repeat)return false;const raw=codeOf(event),was=[...this.keys].some(k=>canonical(k)===canonical(raw));this.keys.add(raw);if(!was)this.pressed.add(raw);return !was}
 release(event){const raw=codeOf(event);this.keys.delete(raw);if(typeof event==='string')for(const key of this.keys)if(canonical(key)===canonical(raw))this.keys.delete(key)}
 clear(){this.keys.clear();this.pressed.clear()}
}
export function controlText(text){return String(text).replace(/\bUse K\b/g,()=>`Use ${primaryKey('special')}`).replace(/\(K\)/g,()=>`(${primaryKey('special')})`).replace(/\bK mantém/g,()=>`${primaryKey('special')} mantém`).replace(/\bQ seleciona/g,()=>`${primaryKey('cycleImplant')} seleciona`).replace(/\bF ativa/g,()=>`${primaryKey('activateImplant')} ativa`).replace(/\bE (?=para interagir|ativa abrigos|\/|·)/g,()=>`${primaryKey('interact')} `)}
