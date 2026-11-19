/** Fresh, manual V2 delivery. Never reads local credentials or existing build outputs. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProduction = process.argv.includes('--production');
const targetOrigin = isProduction ? 'https://attaieproperties.com' : 'https://website.attaieproperties.com';
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const posArgs = process.argv.slice(2).filter(a => !a.startsWith('--'));
const output = path.resolve(posArgs[0] || path.join(root, 'releases', `manual-${isProduction ? 'production' : 'staging'}-dashboard-completion-${stamp}`));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = directory => fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const freshInternal = ['001-core.sql','010-callcenter.sql','020-inventory.sql','030-sales-crm.sql','040-hr-finance.sql','050-marketing-production.sql','060-engineering.sql','090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql','103-customer-property-leads.sql','110-ceo-manager-branch-model.sql'];
function sourceAudit() {
  const catalog = JSON.parse(read('deployment/v2/project-showcase.json'));
  if (catalog.projects.length || catalog.units.length) throw new Error('New packages require empty project/unit catalogs.');
  for (const file of freshInternal) if (!fs.existsSync(path.join(root,'staff-service/database',file))) throw new Error(`Missing SQL: ${file}`);
  for (const file of ['115-mysql-staff-auth.sql','04-seed-all-staff-users.sql']) if (!fs.existsSync(path.join(root,'staff-service/database',file))) throw new Error(`Missing SQL: ${file}`);
  for (const file of ['App.php','Completion.php','CompletionRules.php','Domain.php','LeadPropertyClaims.php']) if (!fs.existsSync(path.join(root,'staff-service/src',file))) throw new Error(`Missing service source: ${file}`);
  if (/CREATE TABLE\s+(?:core_|inv_|hr_|fin_|cc_|sub_)/i.test(read('public/api/schema.sql'))) throw new Error('Website schema contains another database module.');
  console.log('Source packaging audit passed: empty catalog, complete PHP source, separate SQL inputs.');
}
sourceAudit();
if (process.argv.includes('--audit-source')) process.exit(0);
if (path.dirname(output) !== path.join(root,'releases') || !/^manual-(?:staging|production)-dashboard-completion-/.test(path.basename(output)) || fs.existsSync(output)) throw new Error('Use a NEW manual-(staging|production)-dashboard-completion-* folder directly under releases/.');
const dist = path.join(output,'dist');
const write = (relative,content) => {const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);};
const copy = (source,relative) => {const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,source),target);};
const run = (command,args) => {const result=spawnSync(command,args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});if(result.stdout)process.stdout.write(result.stdout);if(result.status!==0)throw new Error(result.stderr||`Command failed: ${command}`);};

// Type checks precede all output. A failure leaves no misleading upload folder.
for (const config of ['tsconfig.json','admin-panel/tsconfig.json','apps/staff/tsconfig.json']) run(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','-p',config]);
fs.mkdirSync(dist,{recursive:true});
process.env.VITE_API_URL='/api';
process.env.VITE_SITE_URL=targetOrigin;
const common={configFile:false,envDir:false,publicDir:false,logLevel:'warn',build:{emptyOutDir:false}};
// Do not load repository vite.config.ts: it explicitly loads private .env.local.
await build({...common,root,plugins:[react(),tailwindcss()],resolve:{alias:{'@':path.join(root,'src')}},define:{'process.env.GOOGLE_MAPS_PLATFORM_KEY':JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY||'')},build:{...common.build,outDir:dist}});
const websiteHtml=path.join(dist,'index.html');
if (isProduction) {
  fs.writeFileSync(websiteHtml,fs.readFileSync(websiteHtml,'utf8').replaceAll('https://www.attaieproperties.com',targetOrigin));
} else {
  fs.writeFileSync(websiteHtml,fs.readFileSync(websiteHtml,'utf8').replace(/(<meta name="robots" content=")[^"]+/, '$1noindex, nofollow, noarchive').replaceAll('https://www.attaieproperties.com',targetOrigin));
}
await build({...common,root:path.join(root,'admin-panel'),plugins:[react()],base:'/admin/',build:{...common.build,outDir:path.join(dist,'admin')}});
const adminHtml=path.join(dist,'admin/index.html');
fs.writeFileSync(adminHtml,fs.readFileSync(adminHtml,'utf8').replace('<head>','<head>\n<meta name="robots" content="noindex, nofollow, noarchive">'));
copy('deployment/staff/dashboard.htaccess','dist/admin/.htaccess');
for (const role of ['dashboard','management','callcenter','sales']) {
  const directory=path.join(dist,role);
  const htmlEntry=role==='sales'?'dashboard':role;
  await build({...common,root:path.join(root,'apps/staff'),plugins:[react()],base:`/${role}/`,define:{__STAFF_ROLE__:JSON.stringify(role),__STAFF_PREVIEW_ALLOWED__:'false'},build:{...common.build,outDir:directory,rollupOptions:{input:path.join(root,`apps/staff/${htmlEntry}/index.html`)}}});
  fs.renameSync(path.join(directory,htmlEntry,'index.html'),path.join(directory,'index.html'));
  fs.rmdirSync(path.join(directory,htmlEntry));
  copy('deployment/staff/dashboard.htaccess',`dist/${role}/.htaccess`);
  const html=fs.readFileSync(path.join(directory,'index.html'),'utf8');
  if(!html.includes('noindex')||!html.includes(`/${role}/assets/`))throw new Error(`Incorrect ${role} base or missing noindex.`);
}
const dashboardDir=path.join(dist,'dashboard');
const dashboardHtml=fs.readFileSync(path.join(dashboardDir,'index.html'),'utf8');
for (const panel of [
  {id:'ceo',title:'CEO Executive Workspace · Attaie Properties'},
  {id:'sales-leader',title:'Sales Team Leader Workspace · Attaie Properties'},
  {id:'finance',title:'Finance Manager Workspace · Attaie Properties'},
  {id:'marketing',title:'Marketing & Media Workspace · Attaie Properties'},
  {id:'engineering',title:'Engineering & 3D Workspace · Attaie Properties'}
]) {
  const panelDir=path.join(dist,panel.id);
  fs.mkdirSync(panelDir,{recursive:true});
  fs.cpSync(path.join(dashboardDir,'assets'),path.join(panelDir,'assets'),{recursive:true});
  for (const assetFile of fs.readdirSync(path.join(panelDir,'assets'))) {
    if (assetFile.endsWith('.js')||assetFile.endsWith('.css')) {
      const assetPath=path.join(panelDir,'assets',assetFile);
      const raw=fs.readFileSync(assetPath,'utf8');
      if (raw.includes('/dashboard/')) fs.writeFileSync(assetPath,raw.replaceAll('/dashboard/',`/${panel.id}/`),'utf8');
    }
  }
  fs.writeFileSync(path.join(panelDir,'index.html'),dashboardHtml.replaceAll('/dashboard/',`/${panel.id}/`).replace(/<title>.*?<\/title>/,`<title>${panel.title}</title>`),'utf8');
  copy('deployment/staff/dashboard.htaccess',`dist/${panel.id}/.htaccess`);
}
// Explicit shared assets only. Never copy all assets/aistudio (contains old notes).
fs.cpSync(path.join(root,'public/fonts'),path.join(dist,'fonts'),{recursive:true,filter:file=>fs.statSync(file).isDirectory()||/\.(?:ttf|woff2?)$/i.test(file)});
copy('public/logo.png','dist/logo.png');
const referencedAssets=new Set();
for (const file of walk(path.join(root,'src')).filter(file=>/\.(?:tsx?|css)$/.test(file))) {
  for (const match of fs.readFileSync(file,'utf8').matchAll(/['"](\/assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|svg))['"]/g)) referencedAssets.add(match[1]);
}
for (const asset of referencedAssets) copy(`public${asset}`,`dist${asset}`);

// Only distributable PHP, no migrations, installs, local configs or stored data.
for (const tree of ['api','visual-config','staff-api']) {
  for (const file of walk(path.join(root,'public',tree))) {
    const relative=path.relative(path.join(root,'public'),file).replaceAll('\\','/');
    const name=path.basename(file);
    if (!/\.php$/.test(name) && name!=='.htaccess') continue;
    if (/(?:^|\/)(?:data|uploads|sessions|migrations)\//.test(relative) || /^(?:db(?:\.example)?|paths(?:\.example)?|.*\.local|migrate.*|install)\.php$/.test(name)) continue;
    copy(`public/${relative}`,`dist/${relative}`);
  }
}
for (const name of ['seo.php','sitemap.php','.user.ini']) copy(`public/${name}`,`dist/${name}`);
let rules=read('public/.htaccess').replace(/RewriteRule \^sitemap\\\.xml\$ .*\n/,'');
if(!rules.includes('^ceo')) {
  rules=rules.replace('# Admin CRM SPA fallback', '# V2 staff API and dashboard routing\nRewriteRule ^staff-api/v1(?:/.*)?$ /staff-api/index.php [L]\nRewriteRule ^dashboard(?:/.*)?$ /dashboard/index.html [L]\nRewriteRule ^management(?:/.*)?$ /management/index.html [L]\nRewriteRule ^callcenter(?:/.*)?$ /callcenter/index.html [L]\nRewriteRule ^ceo(?:/.*)?$ /ceo/index.html [L]\nRewriteRule ^sales-leader(?:/.*)?$ /sales-leader/index.html [L]\nRewriteRule ^sales(?:/.*)?$ /sales/index.html [L]\nRewriteRule ^finance(?:/.*)?$ /finance/index.html [L]\nRewriteRule ^marketing(?:/.*)?$ /marketing/index.html [L]\nRewriteRule ^engineering(?:/.*)?$ /engineering/index.html [L]\n\n# Admin CRM SPA fallback');
}
if(!rules.includes('^dashboard')||!rules.includes('^staff-api/v1'))throw new Error('Routing insertion failed.');
write('dist/.htaccess',(isProduction?'# Production document root.\n':'# V2 testing document root ONLY.\n')+'RewriteEngine On\nRewriteRule ^(?:ai-chat(?:/|$)|chat-service\\.php$) - [F,L]\n'+rules+(isProduction?'':'\n<IfModule mod_headers.c>\nHeader always set X-Robots-Tag "noindex, nofollow, noarchive"\n</IfModule>')+'\n<Files "initiate-call.php">\nRequire all denied\n</Files>\n');
write('dist/robots.txt',isProduction?'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dashboard/\nDisallow: /management/\nDisallow: /callcenter/\nDisallow: /ceo/\nDisallow: /sales-leader/\nDisallow: /sales/\nDisallow: /finance/\nDisallow: /marketing/\nDisallow: /engineering/\nDisallow: /api/\nDisallow: /staff-api/\n':'User-agent: *\nDisallow: /\n');
write('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n');
write('dist/uploads/.htaccess','Options -Indexes\n<FilesMatch "\\.(?:php[0-9]?|phtml|phar|cgi|pl|py|sh|shtml)$">\nRequire all denied\n</FilesMatch>\n');
for(const folder of ['private_applications','chat_store'])write(`dist/uploads/${folder}/.htaccess`,'Require all denied\n');
write('dist/visual-config/data/.htaccess','Require all denied\n');
write('dist/visual-config/.htaccess','Options -Indexes\n<FilesMatch "\\.(?:json|tmp)$">\nRequire all denied\n</FilesMatch>\n');
write('dist/api/db.php',"<?php\n// Path only. Real website/submission configuration lives outside every web root.\nrequire '/home/CPANEL_USER/attaie-v2-private/website-db.php';\n");
copy('public/staff-api/paths.example.php','dist/staff-api/paths.php');
for(const file of walk(path.join(root,'staff-service/src')))copy(path.relative(root,file),`private/app/${path.relative(path.join(root,'staff-service'),file)}`);
write('private/config.example.php',read('staff-service/config/config.example.php').replaceAll('/home/CPANEL_USER/private-staff/sessions','/home/CPANEL_USER/attaie-v2-private/sessions').replaceAll('https://website.attaieproperties.com',targetOrigin));
copy('public/staff-api/paths.example.php','private/paths.example.php');
let websiteConfig=read('public/api/db.example.php').replace("define('ADMIN_USER', 'admin');","define('ADMIN_USER', '');").replace("define('ADMIN_PASS', 'choose_a_strong_password');","define('ADMIN_PASS', '');");
websiteConfig=websiteConfig.replace('<?php',"<?php\ndefine('ATTAIE_MANUAL_SCHEMA', true);\n// Separate THIRD submission database. Never use website or internal CRM credentials.\ndefine('SUBMISSION_DB_HOST','localhost');\ndefine('SUBMISSION_DB_USER','YOUR_SUBMISSION_USER');\ndefine('SUBMISSION_DB_PASS','');\ndefine('SUBMISSION_DB_NAME','YOUR_SUBMISSION_DATABASE');");
write('private/website-db.example.php',websiteConfig);
write('private/sessions/.gitkeep','');
const header=name=>`-- ${name}. ${isProduction ? 'PRODUCTION' : 'V2 TESTING ONLY'}. Verify DATABASE() in phpMyAdmin before import.\n-- Fresh install requires a NEW EMPTY database. Never import fresh SQL over existing data.\n`;
write('database/fresh/01-website.sql',header('WEBSITE database')+read('public/api/schema.sql')+"\n"+read('staff-service/database/102-website-submission-map.sql')+`\nUPDATE seo_settings SET canonical_base_url='${targetOrigin}',robots_index=${isProduction?1:0} WHERE id=1;\n`);
write('database/fresh/02-internal-crm.sql',header('SEPARATE INTERNAL OFFICE CRM database')+freshInternal.map(name=>`\n-- SOURCE ${name}\n`+read(`staff-service/database/${name}`)).join('\n'));
write('database/fresh/03-submissions.sql',header('SEPARATE THIRD SUBMISSION database')+read('staff-service/database/055-submissions-db.sql'));
for(const name of ['090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql','115-mysql-staff-auth.sql'])copy(`staff-service/database/${name}`,`database/upgrade/internal-crm/${name}`);
copy('staff-service/database/102-website-submission-map.sql','database/upgrade/website/102-website-submission-map.sql');
copy('staff-service/database/101-submission-assets.sql','database/upgrade/submissions/101-submission-assets.sql');
write('database/upgrade/README.md','Existing V2 only: back up all three databases and private files. Do not import fresh SQL. Confirm your installed module versions and columns first. Apply 090 only if missing, then 095, 100, and 115-mysql-staff-auth.sql to INTERNAL CRM only. Each ALTER runs once; do not blindly retry a partial import. After 115-mysql-staff-auth.sql, import database/04-seed-all-staff-users.sql (or use staff-service/bin/set-staff-password.php) to assign bcrypt password hashes to staff accounts. Apply 102 to the WEBSITE database and 101 to the separate SUBMISSION database.\n');
copy('staff-service/database/04-seed-all-staff-users.sql','database/04-seed-all-staff-users.sql');
write('database/05-website-admin.template.sql',"-- WEBSITE database only. Generate a strong password hash privately; never put password text here.\n-- After replacing both placeholders, remove the leading comment from the statement.\n-- INSERT INTO admin_users(username,password_hash) VALUES ('YOUR_ADMIN_USERNAME','YOUR_PASSWORD_HASH');\n");
copy('docs/staff/dashboard-completion-delivery.md','START-HERE.md');
write('BUILD-STATUS.json',JSON.stringify({builtAt:new Date().toISOString(),target:targetOrigin,mysqlStaffAuth:true,serverUploaded:false,databaseImported:false,serverVerified:false},null,2));

// Fail the release before archive creation when private/setup material is public.
for(const file of walk(dist)) {
  const relative=path.relative(dist,file).replaceAll('\\','/');
  if(/(?:\.sql$|\.env|\.local\.php$|config\.php$|firebase\.json$|service.account|(?:^|\/)(?:private|database|node_modules)\/)/i.test(relative))throw new Error(`Private material in public output: ${relative}`);
  if(/\.(?:js|html|php|css|json|ini)$/.test(file)&&/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(fs.readFileSync(file,'utf8')))throw new Error(`Private key found: ${relative}`);
  if(/^(?:dashboard|management|callcenter|sales|ceo|sales-leader|finance|marketing|engineering)\/assets\/.*\.js$/.test(relative)&&/Sample workspace only|Explore sample workspace/.test(fs.readFileSync(file,'utf8')))throw new Error(`Preview code leaked: ${relative}`);
  if(relative.startsWith('assets/aistudio/')&&!referencedAssets.has('/'+relative))throw new Error(`Unreferenced artwork: ${relative}`);
}
for(const required of ['index.html','.htaccess','.user.ini','admin/index.html','dashboard/index.html','management/index.html','callcenter/index.html','sales/index.html','ceo/index.html','sales-leader/index.html','finance/index.html','marketing/index.html','engineering/index.html','staff-api/index.php','staff-api/paths.php','api/db.php'])if(!fs.existsSync(path.join(dist,required)))throw new Error(`Missing required public file: ${required}`);
const manifest=walk(output).map(file=>({path:path.relative(output,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
write('manifest.json',JSON.stringify(manifest,null,2));
run(process.platform==='win32'?'python':'python3',['scripts/zip-v2-release.py',output]);
console.log(`Prepared ${output}. MySQL staff auth enabled (no Firebase dependency). No upload or database operation occurred.`);
