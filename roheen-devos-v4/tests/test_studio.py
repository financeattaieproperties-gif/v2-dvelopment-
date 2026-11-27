import json, re, tempfile, threading, unittest, urllib.request, urllib.error, pathlib, time
from devos.core import Runtime
from devos.studio import make_server
class StudioTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.rt=Runtime(pathlib.Path(self.tmp.name));self.server=make_server(self.rt,0);self.url=f'http://127.0.0.1:{self.server.server_port}';self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start(); self.opener=urllib.request.build_opener(urllib.request.ProxyHandler({})); self.page=self.opener.open(self.url).read().decode();self.token=re.search(r"const token='([^']+)'",self.page).group(1)
    def tearDown(self): self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
    def call(self,path,body=None,token=True,origin=True):
        headers={'Content-Type':'application/json'}
        if token:headers['X-DevOS-Token']=self.token
        if origin:headers['Origin']=self.url
        req=urllib.request.Request(self.url+path,data=json.dumps(body).encode() if body is not None else None,headers=headers)
        try:
            with self.opener.open(req) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as e:return e.code,json.load(e)
    def test_security_and_lifecycle(self):
        self.assertIn('Roheen DevOS',self.page);self.assertEqual(self.call('/api/projects',token=False)[0],403);self.assertEqual(self.call('/api/create',{'name':'a','brief':'b'},origin=False)[0],403); self.assertEqual(self.call('/api/create',{'name':'a','brief':'b','adapter':'codex'})[0],400)
        status,body=self.call('/api/create',{'name':'Attaie','brief':'Test prototype'});self.assertEqual(status,201);p=body['id']; self.assertEqual(self.call('/api/run',{'id':p})[0],200)
        for _ in range(100):
            if self.rt.get(p)['state']=='waiting':break
            time.sleep(.01)
        self.assertEqual(self.rt.get(p)['state'],'waiting');self.assertEqual(self.call('/api/approve',{'id':p})[0],200);self.assertEqual(self.call('/api/project?id='+p)[1]['project']['state'],'queued')
