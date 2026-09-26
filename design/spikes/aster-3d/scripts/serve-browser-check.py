"""Local-only standalone validation host; no website/Niva changes."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
(ROOT / 'validation').mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] == '/':
            self.path = '/scripts/browser-check.html'
        elif self.path.startswith('/asset/'):
            self.path = '/' + self.path[len('/asset/'):]
        elif self.path.startswith('/browser-check.js'):
            self.path = '/validation/browser-check.js'
        return super().do_GET()

    def do_POST(self):
        if self.path == '/diagnostic':
            data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            name = re.sub(r'[^A-Za-z0-9_-]', '-', data['name'])
            folder = ROOT / 'validation/browser-diagnostics'
            folder.mkdir(exist_ok=True)
            (folder / (name + '.png')).write_bytes(base64.b64decode(data['image'].split(',', 1)[1]))
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
            return
        if self.path != '/report':
            self.send_error(404)
            return
        data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        name = 'browser-report.json' if data.get('combinations') or data.get('status') == 'failed' else 'browser-load.json'
        (ROOT / 'validation' / name).write_text(json.dumps(data, indent=2))
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
(ROOT / 'validation/browser-server.json').write_text(json.dumps({'url': f'http://127.0.0.1:{server.server_port}'}))
server.serve_forever()
