"""Serve the project on localhost:8765 before running; standard library only."""
from html.parser import HTMLParser
from pathlib import Path
import json
import subprocess
import tempfile
ROOT=Path(__file__).resolve().parents[1]
class Report(HTMLParser):
 capture=False
 text=''
 def handle_starttag(self,tag,attrs):
  if tag=='pre' and dict(attrs).get('id')=='v3-results':self.capture=True
 def handle_endtag(self,tag):
  if tag=='pre':self.capture=False
 def handle_data(self,data):
  if self.capture:self.text+=data
with tempfile.TemporaryDirectory(prefix='nova-v3-') as profile:
 result=subprocess.run(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--user-data-dir='+profile,'--virtual-time-budget=15000','--window-size=1400,1300','--screenshot='+str(ROOT/'tests/v3-preview.png'),'--dump-dom','http://127.0.0.1:8765/tests/v3.html'],capture_output=True,timeout=55)
 parser=Report();parser.feed(result.stdout.decode('utf-8',errors='replace'))
 passed=parser.text.startswith('PASS ')
 (ROOT/'tests/v3-browser-results.json').write_text(json.dumps({'passed':passed,'report':parser.text},indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 print(parser.text.split('\n')[0] if passed else parser.text or result.stderr.decode('utf-8',errors='replace'))
 if not passed:raise SystemExit(1)
