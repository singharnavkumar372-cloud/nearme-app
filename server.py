"""
NearMe Backend Server
Serves static files + API for user tracking + admin
Run: python server.py
Then open: http://localhost:3000
Admin: http://localhost:3000/admin.html (password: admin123)
"""

import json
import os
import sys
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DATA_DIR  = os.path.join(os.path.dirname(__file__), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
ADMIN_PASS = 'admin123'

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump([], f)

def read_users():
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def write_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users[:1000], f, ensure_ascii=False, indent=2)

class NearMeHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        msg = str(args[0]) if args else ''
        if '/api/' in msg:
            print(f"[API] {args}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path

        if path == '/api/track':
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
            except:
                self.send_json({'error': 'Invalid JSON'}, 400)
                return

            # Add server-side IP address
            forwarded = self.headers.get('X-Forwarded-For', '')
            data['ip'] = forwarded.split(',')[0].strip() if forwarded else self.client_address[0]
            data['serverTime'] = int(time.time() * 1000)

            users = read_users()
            idx = next((i for i, u in enumerate(users) if u.get('id') == data.get('id')), -1)
            if idx >= 0:
                users[idx] = {**users[idx], **data}
            else:
                users.insert(0, data)
            write_users(users)
            print(f"  📍 Tracked: {data.get('city','?')} | {data.get('device','?')} | {data.get('ip','?')}")
            self.send_json({'ok': True, 'total': len(users)})
            return

        self.send_json({'error': 'Not found'}, 404)

    def do_GET(self):
        path = urlparse(self.path).path

        if path == '/api/users':
            users = read_users()
            self.send_json(users)
            return

        if path == '/api/stats':
            users = read_users()
            now = int(time.time() * 1000)
            five_min = 5 * 60 * 1000
            one_day  = 86400 * 1000
            stats = {
                'total':    len(users),
                'online':   sum(1 for u in users if u.get('online') and (now - u.get('timeLast', 0)) < five_min),
                'today':    sum(1 for u in users if (now - u.get('timeLast', 0)) < one_day),
                'mobile':   sum(1 for u in users if u.get('device') == 'Mobile'),
                'returning':sum(1 for u in users if u.get('visitCount', 1) > 1),
                'timezones':len(set(u.get('tz', '') for u in users if u.get('tz'))),
            }
            self.send_json(stats)
            return

        if path == '/api/users/clear':
            write_users([])
            print("  🗑️  All users cleared by admin")
            self.send_json({'ok': True})
            return

        # Serve static files
        return super().do_GET()

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path == '/api/users':
            write_users([])
            print("  🗑️  All users cleared by admin")
            self.send_json({'ok': True})
            return
        self.send_json({'error': 'Not found'}, 404)

    def guess_type(self, path):
        # Fix MIME types
        if path.endswith('.js'):   return 'application/javascript'
        if path.endswith('.css'):  return 'text/css'
        if path.endswith('.json'): return 'application/json'
        if path.endswith('.webmanifest'): return 'application/manifest+json'
        return super().guess_type(path)

if __name__ == '__main__':
    ensure_data_dir()
    PORT = 3000
    print("=" * 46)
    print("  NearMe Backend Server v4.0 - Running!")
    print("=" * 46)
    print(f"  App:   http://localhost:{PORT}")
    print(f"  Admin: http://localhost:{PORT}/admin.html")
    print(f"  Pass:  admin123")
    print("-" * 46)
    print(f"  API:   POST /api/track  (user GPS)")
    print(f"         GET  /api/users  (all users)")
    print(f"         GET  /api/stats  (summary)")
    print(f"         DEL  /api/users  (clear all)")
    print("=" * 46)
    print("  Press Ctrl+C to stop")
    print()
    server = HTTPServer(('', PORT), NearMeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.server_close()
