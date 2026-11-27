import os, tempfile, unittest, sys, pathlib, json
from devos.core import Runtime, digest

class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.rt=Runtime(pathlib.Path(self.tmp.name))
    def tearDown(self): self.tmp.cleanup()
    def new(self, **kwargs): return self.rt.create('Attaie demo','Build a landing page', **kwargs)
    def test_fixture_lifecycle(self):
        p=self.new(); self.assertEqual(self.rt.run(p),'waiting'); self.assertEqual(self.rt.next_task(p)['role'],'scope-approval')
        self.rt.approve(p); self.assertEqual(self.rt.run(p),'waiting'); self.assertEqual(self.rt.next_task(p)['role'],'design-approval')
        self.rt.approve(p); self.assertEqual(self.rt.run(p),'complete'); self.assertEqual(self.rt.get(p)['verdict'],'SIMULATION_ONLY')
        self.assertTrue((self.rt.workspace(p)/'index.html').exists())
        self.assertTrue(all(t['state']=='done' for t in self.rt.tasks(p)))
    def test_isolation_and_persistence(self):
        a=self.new(); b=self.new(); self.rt.run(a); self.assertNotEqual(self.rt.workspace(a),self.rt.workspace(b)); self.assertEqual(Runtime(self.rt.root).get(a)['state'],'waiting'); self.assertEqual(self.rt.get(b)['state'],'queued')
    def test_no_approval_out_of_order(self):
        p=self.new(); self.assertRaises(ValueError,self.rt.approve,p)
    def test_reject_invalid_mode(self): self.assertRaises(ValueError,self.new,adapter='evil')
    def test_fullstack_profile(self):
        p=self.new(profile='fullstack'); self.assertIn('backend',[t['role'] for t in self.rt.tasks(p)]); self.assertIn('database',[t['role'] for t in self.rt.tasks(p)])
    def test_candidate_changes(self):
        p=self.new(); w=self.rt.workspace(p); d=digest(w); (w/'x').write_text('changed'); self.assertNotEqual(d,digest(w))
    def test_missing_cli_blocks(self):
        p=self.new(adapter='codex'); from unittest.mock import patch
        with patch('devos.core.shutil.which',return_value=None): self.assertEqual(self.rt.run(p),'blocked')
        self.assertEqual(self.rt.next_task(p)['state'],'blocked'); self.rt.retry(p); self.assertEqual(self.rt.get(p)['state'],'queued')
    def test_repair_invalidates_candidate(self):
        p=self.new(); self.rt.run(p); self.rt.approve(p); self.rt.run(p); self.rt.approve(p)
        # advance only through verification, then alter frozen candidate
        while self.rt.next_task(p)['role']!='security':
            t=self.rt.claim(p); self.rt.finish(p,t,self.rt.execute(self.rt.get(p),t))
        old=self.rt.get(p)['candidate']; (self.rt.workspace(p)/'index.html').write_text('changed')
        self.assertEqual(self.rt.run(p),'blocked'); self.rt.repair(p); self.assertIsNone(self.rt.get(p)['candidate']); self.assertEqual(self.rt.next_task(p)['role'],'integration'); self.assertEqual(self.rt.run(p),'complete'); self.assertNotEqual(self.rt.get(p)['candidate'],old)
    def test_concurrent_claim(self):
        import concurrent.futures
        p=self.new()
        with concurrent.futures.ThreadPoolExecutor(2) as pool: results=list(pool.map(lambda _:self.rt.claim(p),range(2)))
        self.assertEqual(sum(t is not None for t in results),1)
        self.rt.recover(p); self.assertEqual(self.rt.get(p)['state'],'blocked'); self.rt.retry(p); self.assertEqual(self.rt.run(p),'waiting')
    def test_fake_codex_contract(self):
        from unittest.mock import patch
        fake=pathlib.Path(self.tmp.name)/'fake-codex.py'; fake.write_text('#!'+sys.executable+'\n'+'''import sys,json,pathlib
args=sys.argv[1:]; prompt=sys.stdin.read(); role=prompt.split('You are the ')[1].split(' specialist')[0]; assert args[:3]==['--ask-for-approval','never','exec']; assert '--json' in args; assert args[args.index('--sandbox')+1]==('read-only' if role in ('qa','security','release-docs') else 'workspace-write')
assert pathlib.Path(args[args.index('--output-schema')+1]).exists()
if role=='frontend': pathlib.Path('index.html').write_text('<h1>fake CLI test</h1>')
if role not in ('qa','security','release-docs'):
 p=pathlib.Path('.workflow/roles')/(role+'.md'); p.parent.mkdir(exist_ok=True); p.write_text('Fake role handoff')
pathlib.Path(args[args.index('--output-last-message')+1]).write_text(json.dumps({'verdict':'PASS','summary':'fake CLI contract only','evidence':['fixture evidence']}))
print(json.dumps({'type':'turn.completed','usage':{'input_tokens':100,'cached_input_tokens':20,'output_tokens':10}}))
'''); fake.chmod(0o755)
        cli_path=fake
        if os.name=='nt':
            cmd=pathlib.Path(self.tmp.name)/'fake-codex.cmd'
            cmd.write_text(f'@echo off\r\n"{sys.executable}" "{fake}" %*\r\n',encoding='utf-8')
            cli_path=cmd
        p=self.new(adapter='codex',verify=[sys.executable,'-c','from pathlib import Path; assert Path("index.html").exists()'])
        with patch('devos.core.shutil.which',return_value=str(cli_path)):
            self.assertEqual(self.rt.run(p),'waiting');self.rt.approve(p);self.assertEqual(self.rt.run(p),'waiting');self.rt.approve(p);self.assertEqual(self.rt.run(p),'complete')
        self.assertEqual(self.rt.get(p)['verdict'],'REVIEWED_HANDOFF'); self.assertGreater(self.rt.usage(p)['reported_turns'],0)
    def test_verifier_failure(self):
        p=self.new(adapter='codex',verify=[sys.executable,'-c','raise SystemExit(7)']); t={'role':'verify','seq':8,'attempt':1}; result=self.rt.execute(self.rt.get(p),t); self.assertEqual(result['verdict'],'FAIL');self.assertIn('7',result['summary'])
    def test_source_copy(self):
        with tempfile.TemporaryDirectory() as other:
            src=pathlib.Path(other); (src/'app.js').write_text('hello'); (src/'.env').write_text('secret'); (src/'AGENTS.md').write_text('existing instructions')
            symlink_created=False
            try:
                (src/'linked').symlink_to(src/'app.js'); symlink_created=True
            except OSError:
                pass
            p=self.new(source=src); w=self.rt.workspace(p); self.assertEqual((w/'app.js').read_text(),'hello'); self.assertFalse((w/'.env').exists())
            if symlink_created: self.assertFalse((w/'linked').exists())
            self.assertIn('existing instructions',(w/'AGENTS.md').read_text()); self.assertEqual((src/'AGENTS.md').read_text(),'existing instructions')
