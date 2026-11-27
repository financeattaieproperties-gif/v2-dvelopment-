"""Render the approved Attaie workflow atlas as accessible, self-contained HTML/SVG."""
from pathlib import Path
from html import escape
import json
import base64

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'diagrams' / 'v2-roadmap'
OUT.mkdir(parents=True, exist_ok=True)
departments = [
 ('Website Admin', 'Approved submissions', 'Review catalog and content', 'Approve / return / publish', 'Website visitors', '/admin', 'Website database; separate authentication'),
 ('CEO', 'Cross-branch exceptions', 'Assign inventory and staff', 'Review engineering versions', 'Branch owners', '/ceo', 'Only global internal role'),
 ('Management', 'Qualified closure evidence', 'Verify sellers and boundaries', 'Issue contract / amend', 'Finance installments', '/management', 'Active branch scope'),
 ('Call Center', 'Inquiry or phone contact', 'Match customer and property', 'Qualify / schedule / hand off', 'Assigned Sales agent', '/callcenter', 'Branch and assigned work'),
 ('Sales', 'Assigned lead and history', 'Call / follow up / visit', 'Closed / lost / reschedule', 'Management verification', '/sales', 'Own and explicitly shared leads'),
 ('Sales Leader', 'Team queue and deadlines', 'Allocate work and coach', 'Resolve team exceptions', 'Assigned team agents', '/sales-leader', 'Team within branch'),
 ('Finance', 'Issued contract installments', 'Record and verify deposit', 'Post / correct / reverse', 'Receipt and balance', '/finance', 'Authorized finance records'),
 ('Marketing', 'Property production intake', 'Film then edit content', 'Post / submit / correct', 'Website Admin review', '/marketing', 'Manager / Videographer / Editor'),
 ('Engineering', 'CEO assignment and deadline', 'Upload versioned deliverable', 'CEO approves / revises', 'Next approved version', '/engineering', 'Assigned work; retain history'),
]
pages = [
 ('Platform overview', [('Customer','Public website'),('Publishing','Website Admin'),('Operations','Staff workspaces'),('Field work','Android / iOS'),('Desk work','Electron wrappers')], 'Separate customer, publishing and operational experiences share consistent product foundations.'),
 ('System architecture', [('Public zone','Website + Admin'),('Website API','Website database'),('Identity','Firebase Authentication'),('Staff API','Internal CRM database'),('Publishing bridge','Submission database'),('Private zone','Config / sessions / files')], 'Three separate databases. Private configuration lives outside all web roots. Arrows describe relationships, not shared credentials.'),
 ('Customer lifecycle', [('Call Center','Capture and qualify'),('Identity review','Match customer/property'),('Sales','Follow up and visit'),('Sales','Submit closure evidence'),('Management','Verify and issue contract'),('Finance','Collect and receipt')], 'Correction, duplicate review, rescheduling and lost outcomes remain explicit alternate paths. Closed, contracted and paid are separate milestones.'),
 ('Marketing lifecycle', [('Manager','Property intake'),('Videographer','Schedule and film'),('Editor','Edit and prepare'),('Editor','Record post + submit'),('Submission bridge','Queue and retry'),('Website Admin','Review and publish')], 'Rejected content returns for correction. Recorded posting status is not proof of automated external social publication.'),
 ('Engineering lifecycle', [('CEO','Assign work'),('Engineering','Upload version'),('CEO','Review evidence'),('Decision','Approve or revise'),('Engineering','Retain version history')], 'Revision creates another version. Previously approved files and review history remain auditable.'),
 ('Permissions map', [('Website Admin','Website + publication'),('CEO','Global oversight'),('Management','Branch operations'),('Sales Leader','Team oversight'),('Staff','Own / assigned work'),('Finance','Restricted finance data')], 'Server authorization is authoritative. Hidden navigation alone does not enforce permissions.'),
]
for name, trigger, work, decision, result, route, scope in departments:
 pages.append((name, [('Input',trigger),(name,work),('Decision',decision),('Output',result)], f'{route} — {scope}. Proposed panel: due-work queue, searchable records, filter pills, contextual verification drawer and audit history.'))
pages += [
 ('Panel structure', [('Navigation','64px rail + drawer'),('Header','Search and breadcrumbs'),('Overview','Observed KPIs only'),('Records','Filters and pagination'),('Action queue','Checklist and drawer'),('States','Empty / error / offline')], 'Variant 1 blue, green and slate. No invented historical series. Accessible keyboard focus and clear status labels.'),
 ('Platform layouts', [('Desktop','Split-rail workspace'),('Tablet','Collapsible drawer'),('Mobile','Today / Leads / Follow-ups'),('Android','Kotlin host'),('iOS','Capacitor host'),('Desktop app','Electron loopback proxy')], 'One approved staff source. Product remains English/Dari with RTL; safe areas, keyboard, files and sessions require device verification.'),
 ('Delivery roadmap', [('Baseline','GitHub + protected changes'),('Audit and design','Evidence + visual approval'),('Core repair','Auth / roles / truthful data'),('Vertical workflows','Departments + handoffs'),('Verification','DB / browser / native QA'),('Release packet','Manual V2 staging upload')], 'No production deployment is authorized. Each phase advances only on recorded evidence; pending checks stay visible.'),
]

def svg(title, nodes, index):
 if index == 2:
  blocks = [(40,64,'Public website / Admin','Separate website auth'),(456,64,'Website PHP API','Catalog and inquiries'),(872,64,'Website database','Website credentials only'),(40,216,'Staff panels / apps','Firebase ID token'),(456,216,'Staff PHP API','UID / role / branch'),(872,216,'Internal CRM DB','Separate runtime user')]
  content = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 420" role="img" aria-labelledby="arch-title arch-desc"><title id="arch-title">System architecture</title><desc id="arch-desc">Separate website and staff application paths. Staff verifies Firebase identities. Publishing uses a third submission database. Configuration, sessions and files stay private.</desc><defs><marker id="arch-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#0072BC"/></marker></defs>'
  for y in [110,262]:
   for x in [344,760]: content += f'<path d="M{x} {y} H{x+108}" fill="none" stroke="#0072BC" stroke-width="2" marker-end="url(#arch-arrow)"/>'
  for x,y,label,note in blocks:
   content += f'<rect x="{x}" y="{y}" width="304" height="92" rx="8" fill="#FFFFFF" stroke="#0072BC"/><text x="{x+16}" y="{y+32}" fill="#1E293B" font-size="20">{label}</text><text x="{x+16}" y="{y+60}" fill="#475569" font-size="16">{note}</text>'
  content += '<text x="40" y="352" fill="#1E293B" font-size="18">Controlled publication bridge: third Submission DB → Website Admin review → Website DB</text><text x="40" y="388" fill="#475569" font-size="16">Private zone: backend source, configuration, sessions and documents outside all web roots.</text></svg>'
  return content
 slug=f'v2-{index}'
 pieces=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 420" role="img" aria-labelledby="{slug}-title {slug}-desc"><title id="{slug}-title">{escape(title)}</title><desc id="{slug}-desc">Proposed workflow: '+escape(' then '.join(a+': '+b for a,b in nodes))+'</desc>']
 n=len(nodes); width=176; gap=32; total=n*width+(n-1)*gap; start=(1280-total)/2
 # Explicit horizontal ports. All connectors precede nodes and do not cross boxes.
 pieces.append('<defs><marker id="'+slug+'-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#0072BC"/></marker></defs>')
 for i in range(n-1) if index not in (1,6,16,17) else []:
  x=start+i*(width+gap)+width
  pieces.append(f'<path d="M{x} 190 H{x+gap-5}" fill="none" stroke="#0072BC" stroke-width="2" marker-end="url(#{slug}-arrow)"/>')
 for i,(label,body) in enumerate(nodes):
  x=start+i*(width+gap)
  pieces.append(f'<rect x="{x}" y="116" width="176" height="148" rx="8" fill="#FFFFFF" stroke="#0072BC" stroke-width="1.5"/><text x="{x+16}" y="146" fill="#0072BC" font-size="15" font-weight="600">{escape(label)}</text>')
  words=body.split(); lines=[]; line=''
  for word in words:
   if len(line+' '+word)>18: lines.append(line); line=word
   else: line=(line+' '+word).strip()
  lines.append(line)
  for j,line in enumerate(lines): pieces.append(f'<text x="{x+16}" y="{180+j*24}" fill="#1E293B" font-size="17">{escape(line)}</text>')
 pieces.append('<text x="40" y="360" fill="#475569" font-size="16">PROPOSED REDESIGN · Blue: handoff / action · Green: approved outcome · Existing responsibility preserved</text></svg>')
 return ''.join(pieces)

style='''@font-face{font-family:DM;src:url(../../../public/fonts/dm-sans-400.ttf)}*{box-sizing:border-box}body{margin:0;background:#F8FAFC;color:#1E293B;font-family:DM,Arial,sans-serif}header,main{max-width:1360px;margin:auto;padding:40px}h1{font-size:40px;margin:12px 0}h2{font-size:28px}p{line-height:1.65;max-width:1000px;color:#475569}.eyebrow{font-size:13px;letter-spacing:.12em;color:#0072BC;font-weight:700}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#005E9B}section{padding:24px 0 40px;border-top:1px solid #CBD5E1;break-inside:avoid}.diagram{overflow-x:auto}svg{display:block;min-width:1280px;width:1280px;font-family:DM,Arial,sans-serif}.tag{display:inline-block;background:#E8F7EE;color:#1E293B;padding:6px 10px;border-radius:4px}@media print{header,main{padding:16px}section{break-before:page}.diagram{overflow:visible}svg{min-width:0;width:100%}nav{display:none}}'''
style=style.replace('../../../public/fonts/dm-sans-400.ttf','data:font/ttf;base64,'+base64.b64encode((ROOT/'public/fonts/dm-sans-400.ttf').read_bytes()).decode())
chunks=[]
for i,(title,nodes,note) in enumerate(pages,1):
 diagram=svg(title,nodes,i)
 (OUT/f'{i:02}.svg').write_text(diagram,encoding='utf-8')
 # The skill's strict single-diagram validator forbids even embedded font CSS.
 # Standalone review files use Arial; the atlas embeds the actual brand font.
 standalone_style=style[style.index('*{'):]
 (OUT/f'{i:02}.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>'+standalone_style+'</style></head><body><h1>'+escape(title)+'</h1><div class="diagram">'+diagram+'</div></body></html>',encoding='utf-8')
 chunks.append(f'<section id="page-{i}"><span class="eyebrow">{i:02} / {len(pages):02} · WORKFLOW ATLAS</span><h2>{escape(title)}</h2><p>{escape(note)}</p><div class="diagram">{diagram}</div></section>')
html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Attaie V2 — Workflow Atlas</title><style>'+style+'</style></head><body><header><span class="eyebrow">ATTAIE PROPERTIES · V2 · 26 NOVEMBER 2026</span><h1>One platform. Clear responsibilities.</h1><p>Owner-approved redesign direction: refine Variant 1, preserve and repair business workflows. These diagrams explain the proposed system; they do not certify deployed functionality.</p><span class="tag">English planning · English/Dari product · V2 testing only</span><nav>'+''.join(f'<a href="#page-{i}">{escape(title)}</a>' for i,(title,_,_) in enumerate(pages,1))+'</nav></header><main>'+''.join(chunks)+'</main></body></html>'
(OUT/'index.html').write_text(html,encoding='utf-8')
(OUT/'source.json').write_text(json.dumps(pages,indent=2),encoding='utf-8')
print(f'Rendered {len(pages)} editable SVG diagrams and HTML atlas: {OUT}')
