// Run the repository's existing Node assertion suites in Chrome when Node is
// absent locally. Their imports and assertions remain unchanged on disk.
export async function runExistingRegressions(){
 const assert=(value,message)=>{if(!value)throw Error(message||'assertion failed');};
 assert.ok=assert;assert.equal=(a,b,message)=>assert(Object.is(a,b),message||`${a} !== ${b}`);
 assert.notEqual=(a,b,message)=>assert(!Object.is(a,b),message||`${a} === ${b}`);
 assert.deepEqual=(a,b,message)=>assert(JSON.stringify(a)===JSON.stringify(b),message||'deep equality');
 const cache=new Map(),root=new URL('../',import.meta.url);
 const preload=async path=>{const url=new URL(path,root),response=await fetch(url);if(!response.ok)throw Error(url+' '+response.status);const bytes=await response.arrayBuffer();cache.set(url.href,bytes);return bytes;};
 const configBytes=await preload('assets/bosses/warden/config.json');
 const config=JSON.parse(new TextDecoder().decode(configBytes));
 await Promise.all(Object.values(config.animations).map(a=>preload(a.sheet)));
 globalThis.__e7Assert=assert;
 globalThis.__e7ReadFile=url=>{const bytes=cache.get(url.href);if(!bytes)throw Error('not preloaded: '+url);return{toString:()=>new TextDecoder().decode(bytes),readUInt32BE:offset=>new DataView(bytes).getUint32(offset,false)};};
 const passed=[];
 try{
  for(const filename of ['warden.mjs','warden-arena.mjs','factory.mjs']){
   const url=new URL(filename,import.meta.url);let source=await(await fetch(url)).text();
   source=source.replace("import assert from 'node:assert/strict';","const assert=globalThis.__e7Assert;")
    .replace("import {readFileSync} from 'node:fs';","const readFileSync=globalThis.__e7ReadFile;")
    .replaceAll('import.meta.url',JSON.stringify(url.href))
    .replace(/from\s*(['"])(\.\.?\/[^'"]+)\1/g,(_,quote,path)=>'from '+JSON.stringify(new URL(path,url).href));
   const blob=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
   try{await import(blob);passed.push('existing '+filename+' passed in Chrome');}finally{URL.revokeObjectURL(blob);}
  }
 }finally{delete globalThis.__e7Assert;delete globalThis.__e7ReadFile;}
 return passed;
}
