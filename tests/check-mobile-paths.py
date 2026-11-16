"""Case-sensitive static import / stylesheet / markup / asset-path audit."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
files={p.relative_to(root).as_posix() for folder in ['js','css','assets'] for p in (root/folder).rglob('*') if p.is_file()}
files.add('index.html');checks=0;errors=[];placeholders=[]
for name in sorted(files):
 p=root/name
 if p.suffix not in ['.js','.css','.html','.json']:continue
 text=p.read_text(encoding='utf-8-sig')
 refs=[]
 if p.suffix=='.js':refs+=re.findall(r'''(?:from\s*|import\s*\()\s*['"]([^'"]+)''',text)
 if p.suffix=='.css':refs+=re.findall(r'''url\(['"]?([^)'"\s]+)''',text)
 if p.suffix=='.html':refs+=re.findall(r'''(?:src|href)=['"]([^'"]+)''',text)
 for ref in refs:
  if re.match(r'^(?:https?:|data:|#)',ref):continue
  import posixpath
  relative=posixpath.normpath(posixpath.join(p.parent.relative_to(root).as_posix(),ref.split('?')[0]))
  checks+=1
  if relative not in files:errors.append(name+' -> '+relative)
 # Manifest asset URLs resolve from the page root, as they already do in game.
 if p.suffix in ['.js','.json']:
  for ref in re.findall(r'''['"](assets/[^'"\n]+\.(?:png|svg|json|webp|ogg|mp3))['"]''',text):
   checks+=1
   if ref not in files:placeholders.append(name+' -> '+ref)
report={'checks':checks,'errors':errors,'existingOptionalAssetReferences':sorted(set(placeholders)),'passed':not errors}
(root/'tests/mobile-path-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
if errors:raise SystemExit(1)
