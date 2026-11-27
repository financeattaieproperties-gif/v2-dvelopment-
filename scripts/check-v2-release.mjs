/** Local static candidate smoke only. APIs fail closed; no server/customer data. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const candidate=path.resolve(process.argv[2]||'');
if(!candidate.startsWith(path.resolve('releases')+path.sep)||!fs.existsSync(path.join(candidate,'dist/index.html')))throw new Error('Prepared release directory required.');
const dist=path.join(candidate,'dist');
const evidence=path.join(candidate,'local-smoke');fs.mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const results=[];
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
for(const width of [375,768,1024,1440])for(const route of ['/','/admin/','/callcenter/','/sales/','/sales-leader/','/management/','/finance/','/marketing/','/engineering/','/ceo/']){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 const page=await context.newPage(); const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/*',async intercepted=>{
  const url=new URL(intercepted.request().url());
  if(url.origin!=='http://127.0.0.1:47891')return intercepted.abort();
  if(url.pathname.includes('/api/')||url.pathname.includes('/staff-api/'))return intercepted.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{message:'Local smoke: backend unavailable.'}})});
  let file=path.resolve(dist,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(dist+path.sep)&&file!==dist)return intercepted.abort();
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file))return intercepted.fulfill({status:404,body:'Missing local asset'});
  return intercepted.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 await page.goto('http://127.0.0.1:47891'+route,{waitUntil:'networkidle'});
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,bodyText:document.body.innerText.length,title:document.title}));
 results.push({width,route,...state,errors});
 if(width===375||width===1440)await page.screenshot({path:path.join(evidence,`${route.replaceAll('/','')||'website'}-${width}.png`)});
 await context.close();
}
await browser.close();
fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({candidate,scope:'Local startup and responsive login/static smoke with unavailable APIs; no authenticated or hosted verification.',results},null,2));
const failures=results.filter(item=>item.overflow||item.errors.length||!item.bodyText);
console.log(JSON.stringify({cases:results.length,failures}));
if(failures.length)process.exitCode=1;
