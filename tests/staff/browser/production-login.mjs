import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.STAFF_PACKAGE,'webroot');
const csp=fs.readFileSync(path.join(root,'callcenter/.htaccess'),'utf8').match(/Content-Security-Policy "([^"]+)"/)[1];
const tokens=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'attaie-staff-v2-test/tokens.json'),'utf8'));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const server=http.createServer(async(req,res)=>{
 try {
  if(req.url.startsWith('/staff-api/')) {
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const upstream=await fetch('http://127.0.0.1:8891'+req.url,{method:req.method,headers:{...req.headers,host:'127.0.0.1:8891',origin:'http://127.0.0.1:5175'},...(req.method!=='GET'?{body:Buffer.concat(chunks)}:{})});
   res.writeHead(upstream.status,{'Content-Type':'application/json','Set-Cookie':upstream.headers.getSetCookie()});res.end(await upstream.text());return;
  }
  const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!target.startsWith(root+path.sep))throw new Error('Outside fixture root');
  const file=fs.existsSync(target)&&fs.statSync(target).isFile()?target:path.join(root,'callcenter/index.html');
  const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.ttf':'font/ttf'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Security-Policy':csp});res.end(fs.readFileSync(file));
 } catch {res.writeHead(500);res.end('Local fixture failed');}
});
await new Promise(resolve=>server.listen(5176,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();const errors=[];let googleCalls=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://identitytoolkit.googleapis.com/**',async route=>{googleCalls++;await route.abort();});
 await page.goto('http://127.0.0.1:5176/callcenter/');
 assert.equal(await page.locator('[data-testid="staff-google-signin-btn"]').count(),0);
 await page.getByLabel('Email or username',{exact:true}).first().fill('agent@example.test');
 await page.getByLabel('Password',{exact:true}).fill('Fictional-fixture-only');
 await page.getByRole('button',{name:'Forgot password?',exact:true}).click();
 await page.getByTestId('login-forgot-panel').waitFor();
 await page.screenshot({path:'test-results/staff/mysql-login.png',fullPage:true});
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();
 assert.equal(googleCalls,0);assert.deepEqual(errors,[]);
 console.log('Production build login passed with strict CSP and MySQL session auth. Zero Google/Firebase requests were made.');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
