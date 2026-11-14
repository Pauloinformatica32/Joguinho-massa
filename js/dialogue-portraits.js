const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export const DIALOGUE_PORTRAITS=Object.freeze(Object.fromEntries(['kael','yara','oren','iris','teo'].map(id=>[id,`assets/ui/portraits/${id}.png`])));
const aliases={
 kael:['kael','protagonist','player'],
 yara:['yara','Yara · Hacker'],
 oren:['oren','oren-slum','oren-factory','Oren · Mecânico'],
 iris:['iris','iris_vale','scientist','Dra. Íris Vale','Dra Íris Vale','Dr. Íris Vale','Íris Vale','Dra. Íris'],
 teo:['teo','teo-factory','Téo · Operário Sobrevivente']
};
const speakers=new Map(Object.entries(aliases).flatMap(([id,names])=>names.map(name=>[normalize(name),id])));
export function portraitForSpeaker(speaker,id=null){
 const key=speakers.get(normalize(id))||speakers.get(normalize(speaker));
 return key?{id:key,src:DIALOGUE_PORTRAITS[key]}:null;
}
// Shared by story dialogue and the existing remote Yara panel.
export function setDialoguePortrait(frame,speaker,id=null){
 if(!frame)return false;
 const image=frame.querySelector('img'),portrait=portraitForSpeaker(speaker,id);
 frame.classList.remove('portrait-missing');frame.classList.toggle('hidden',!portrait);
 image.onerror=null;image.onload=null;image.hidden=false;
 if(!portrait){image.removeAttribute('src');image.alt='';delete frame.dataset.speaker;return false}
 frame.dataset.speaker=portrait.id;image.alt=`Retrato de ${speaker||portrait.id}`;
 image.onerror=()=>{image.hidden=true;frame.classList.add('portrait-missing')};
 image.onload=()=>{image.hidden=false;frame.classList.remove('portrait-missing')};
 if(image.getAttribute('src')!==portrait.src)image.src=portrait.src;
 else if(image.complete&&!image.naturalWidth)image.onerror();
 return true;
}
