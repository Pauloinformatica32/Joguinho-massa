"""Headless M4 verification; serve the project on localhost:8765 first."""
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


class Results(HTMLParser):
    capture = False
    text = ''

    def handle_starttag(self, tag, attrs):
        if tag == 'pre' and dict(attrs).get('id') == 'm4-results':
            self.capture = True

    def handle_endtag(self, tag):
        if tag == 'pre':
            self.capture = False

    def handle_data(self, data):
        if self.capture:
            self.text += data


with tempfile.TemporaryDirectory(prefix='nova-aurora-m4-') as profile:
    process = subprocess.run([
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
        '--user-data-dir=' + profile, '--virtual-time-budget=10000',
        '--window-size=1280,1500',
        '--screenshot=' + str(ROOT / 'tests' / 'm4-preview.png'),
        '--dump-dom', 'http://127.0.0.1:8765/tests/m4.html',
    ], capture_output=True, timeout=55)
    parser = Results()
    parser.feed(process.stdout.decode('utf-8', errors='replace'))
    output = parser.text
    (ROOT / 'tests' / 'm4-browser-results.json').write_text(
        json.dumps({'passed': output.startswith('PASS '), 'report': output},
                   indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(output.split('\n')[0] if output else process.stderr.decode('utf-8', errors='replace'))
    if process.returncode or not output.startswith('PASS '):
        print(output)
        raise SystemExit(1)
