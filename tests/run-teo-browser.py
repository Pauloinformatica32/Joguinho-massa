"""Run with the project served on http://127.0.0.1:8765 (no dependencies)."""
import json
from pathlib import Path
import subprocess
import tempfile
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
CHROME = Path('C:/Program Files/Google/Chrome/Application/chrome.exe')


class Results(HTMLParser):
    def __init__(self):
        super().__init__()
        self.capture = False
        self.text = ''

    def handle_starttag(self, tag, attrs):
        if tag == 'pre':
            self.capture = True

    def handle_endtag(self, tag):
        if tag == 'pre':
            self.capture = False

    def handle_data(self, data):
        if self.capture:
            self.text += data


reports = {}
for name in ['teo', 'iris']:
    with tempfile.TemporaryDirectory(prefix='nova-aurora-test-') as profile:
        result = subprocess.run([
            str(CHROME), '--headless=new', '--disable-gpu', '--no-first-run',
            '--disable-extensions', '--user-data-dir=' + profile,
            '--virtual-time-budget=12000', '--window-size=1280,1000',
            '--screenshot=' + str(ROOT / 'tests' / (name + '-preview.png')),
            '--dump-dom', 'http://127.0.0.1:8765/tests/' + name + '.html',
        ], capture_output=True, timeout=55)
        parser = Results()
        parser.feed(result.stdout.decode('utf-8', errors='replace'))
        reports[name] = parser.text
        print(name + ': ' + parser.text, flush=True)
        if result.returncode or not parser.text.startswith('PASS '):
            raise SystemExit(result.stderr.decode('utf-8', errors='replace'))
(ROOT / 'tests' / 'teo-browser-results.json').write_text(
    json.dumps(reports, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
