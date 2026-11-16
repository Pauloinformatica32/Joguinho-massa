"""Use Node when available, otherwise the local VS Code Electron Node runtime."""
import json, os, shutil, subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
runtime=shutil.which('node') or str(Path(os.environ['LOCALAPPDATA'])/'Programs/Microsoft VS Code/Code.exe')
env={**os.environ,'ELECTRON_RUN_AS_NODE':'1'}
cases=['input-settings','mobile-input','player-animation','dash','combat','player-death','factory','tower','network-terminals','cybernetics','implant-equipment','yara-hints','level-design','matrona','warden','vespera']
results=[]
for case in cases:
 r=subprocess.run([runtime,'tests/'+case+'.mjs'],cwd=root,env=env,capture_output=True,encoding='utf-8',errors='replace',timeout=60)
 print(case+': '+r.stdout.strip(),flush=True)
 results.append({'suite':case,'exitCode':r.returncode,'stdout':r.stdout.strip(),'stderr':r.stderr.strip()})
 if r.returncode:print(r.stderr,flush=True)
(root/'tests/mobile-unit-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
if any(r['exitCode'] for r in results):raise SystemExit(1)
