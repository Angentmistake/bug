from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from pathlib import Path
import json, mimetypes, os, sys

BASE = Path(__file__).parent
DEFAULT_PORT = 5004

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

def calculate(subtotal):
    # BUSINESS RULES — correct version
    if subtotal >= 10000:
        discount = subtotal * 0.10
    else:
        discount = 0
    taxable=subtotal - discount
    tax = taxable * 0.18
    return {"subtotal": subtotal, "discount": discount, "tax": tax, "total": taxable + tax}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/calculate":
            try:
                subtotal = float(parse_qs(u.query).get("subtotal", ["0"])[0])
            except ValueError:
                self.send_error(400, "Invalid subtotal")
                return
            self.send_json(calculate(subtotal))
            return

        requested = u.path.lstrip("/")
        p = BASE / ("index.html" if requested == "" else requested)
        if p.exists() and p.is_file() and BASE in p.resolve().parents:
            data = p.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(str(p))[0] or "text/plain")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_error(404)

    def send_json(self, obj):
        data = json.dumps(obj).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

if __name__ == "__main__":
    try:
        port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", DEFAULT_PORT))
    except ValueError:
        print("Invalid port. Use a number such as 5004.")
        raise SystemExit(1)
    print(f"Bug Hunt Python server running at http://127.0.0.1:{port}")
    ReusableHTTPServer(("127.0.0.1", port), Handler).serve_forever()
