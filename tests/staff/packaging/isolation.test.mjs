import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../..');
test('no staff imports are added to public application',()=>{
  const inspect=dir=>{for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())inspect(p);else if(/\.(tsx?|css)$/.test(p)){assert.doesNotMatch(fs.readFileSync(p,'utf8'),/(apps\/staff|packages\/staff-ui|staff-api\/v1)/,p);}}};inspect(path.join(root,'src'));
});
test('every dedicated role shell prevents indexing',()=>{
  for(const role of ['callcenter','management','dashboard','ceo','sales-leader','sales','finance','marketing','engineering']) {
    const html=fs.readFileSync(path.join(root,`apps/staff/${role}/index.html`),'utf8');
    assert.match(html,/<meta\s+name="robots"\s+content="noindex, nofollow(?:, noarchive)?"\s*\/?\s*>/,role);
    assert.match(html,/src="\/src\/main\.tsx"/,role);
  }
});
test('staff routing and API are separate and private configuration fails closed',()=>{
  assert.match(fs.readFileSync(path.join(root,'public/staff-api/index.php'),'utf8'),/503/);
  assert.match(fs.readFileSync(path.join(root,'deployment/staff/dashboard.htaccess'),'utf8'),/X-Robots-Tag/);
});

test('deployed CSP permits Firebase HTTPS authentication',()=>{
 const rules=fs.readFileSync(path.join(root,'deployment/staff/dashboard.htaccess'),'utf8');
 assert.match(rules,/connect-src 'self' https:\/\/identitytoolkit\.googleapis\.com/);
 assert.doesNotMatch(rules,/connect-src[^;]*\*/);
});
