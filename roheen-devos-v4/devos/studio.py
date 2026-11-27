from __future__ import annotations
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
import json,secrets,threading, pathlib, html
from urllib.parse import urlsplit,parse_qs

HTML=(pathlib.Path(__file__).parent/'studio.html').read_text(encoding='utf-8')

def make_server(rt,port=8765):
    token=secrets.token_urlsafe(32); active=set(); lock=threading.Lock()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args): pass
        def send_data(self,code,body,ctype='application/json; charset=utf-8'):
            raw=body.encode() if isinstance(body,str) else body
            self.send_response(code);self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Frame-Options','DENY');self.send_header('Referrer-Policy','no-referrer');self.send_header('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");self.end_headers();self.wfile.write(raw)
        def reply(self,data,code=200): self.send_data(code,json.dumps(data,ensure_ascii=False))
        def host_ok(self): return self.headers.get('Host')==f'127.0.0.1:{self.server.server_port}'
        def authorized(self): return self.host_ok() and secrets.compare_digest(self.headers.get('X-DevOS-Token',''),token)
        def do_GET(self):
            if not self.host_ok():return self.reply({'error':'Invalid Host'},403)
            u=urlsplit(self.path)
            if u.path=='/':return self.send_data(200,HTML.replace('__DEVOS_TOKEN__',token),'text/html; charset=utf-8')
            if not self.authorized():return self.reply({'error':'Unauthorized'},403)
            try:
                if u.path=='/api/projects':return self.reply({'projects':rt.list(),'capabilities':rt.capabilities()})
                if u.path=='/api/project':
                    p=parse_qs(u.query).get('id',[''])[0];return self.reply({'project':rt.get(p),'tasks':rt.tasks(p),'events':rt.events(p),'usage':rt.usage(p),'workspace':str(rt.workspace(p)),'evidence':str(rt.evidence(p))})
                return self.reply({'error':'Not found'},404)
            except ValueError as e:return self.reply({'error':str(e)},400)
        def do_POST(self):
            if not self.authorized() or self.headers.get('Origin')!=f'http://127.0.0.1:{self.server.server_port}':return self.reply({'error':'Unauthorized origin or token'},403)
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=100000:raise ValueError('Invalid request size')
                b=json.loads(self.rfile.read(length)); path=urlsplit(self.path).path
                if path=='/api/create':
                    if b.get('adapter')=='codex' and b.get('consent') is not True:raise ValueError('Real execution requires explicit acknowledgement')
                    pid=rt.create(b.get('name'),b.get('brief'),b.get('mode','professional'),b.get('profile','landing'),b.get('adapter','fixture'),b.get('verify',[])); return self.reply({'id':pid},201)
                p=b.get('id'); rt.get(p)
                if path=='/api/run':
                    with lock:
                        if p in active: return self.reply({'error':'Worker already active'},409)
                        if rt.get(p)['state']!='queued':return self.reply({'error':'Project is not queued'},409)
                        active.add(p)
                    def worker():
                        try:rt.run(p)
                        finally:
                            with lock:active.discard(p)
                    threading.Thread(target=worker,daemon=True).start()
                elif path=='/api/approve':rt.approve(p)
                elif path=='/api/retry':rt.retry(p)
                elif path=='/api/repair':rt.repair(p)
                else:return self.reply({'error':'Not found'},404)
                return self.reply({'ok':True})
            except (ValueError,TypeError,KeyError) as e:return self.reply({'error':str(e)},400)
    return ThreadingHTTPServer(('127.0.0.1',port),Handler)

def serve(rt,port):
    server=make_server(rt,port); print(f'DevOS Studio: http://127.0.0.1:{server.server_port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt: print('\nStudio stopped. Interrupted projects require explicit recovery; check for surviving provider processes.')
    finally:server.server_close()
