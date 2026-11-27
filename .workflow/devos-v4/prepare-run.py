"""Create a credential-free, tracked-source snapshot for the first DevOS analysis stage."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

root = Path(__file__).resolve().parents[2]
record = root / '.workflow/devos-v4'
source = record / 'curated-source'
if source.exists():
    raise SystemExit('Refusing to replace an existing curated source.')
source.mkdir(parents=True)
prefixes = ('src/', 'admin-panel/src/', 'apps/staff/src/', 'packages/staff-contracts/',
            'shared/', 'staff-service/src/', 'staff-service/database/', 'tests/staff/domain/')
specific = {'package.json', 'tsconfig.json', 'admin-panel/package.json', 'admin-panel/tsconfig.json',
            'apps/staff/package.json', 'apps/staff/tsconfig.json', 'sales-android/app/build.gradle',
            'sales-ios/package.json', 'sales-ios/capacitor.config.json',
            'callcenter-desktop/package.json', 'sales-desktop/package.json'}
extensions = {'.ts', '.tsx', '.mjs', '.cjs', '.css', '.php', '.sql', '.md', '.json', '.html', '.kt', '.java', '.xml', '.gradle'}
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode('utf-8').split('\0')
manifest = []
for relative in tracked:
    if not relative:
        continue
    candidate = root / relative
    parts = Path(relative).parts
    selected = relative.startswith(prefixes) or relative in specific
    selected = selected or (relative.startswith('public/api/') and candidate.suffix in {'.php', '.sql'})
    selected = selected or (relative.startswith('public/staff-api/') and candidate.suffix == '.php')
    if not selected or candidate.suffix not in extensions or candidate.is_symlink() or not candidate.is_file():
        continue
    if any(p.startswith('.env') or p in {'uploads', 'data', 'sessions', 'node_modules', '.git'} for p in parts):
        continue
    if candidate.name in {'db.php', 'config.php', 'paths.php'} or '.local.' in candidate.name or candidate.suffix in {'.pem', '.key', '.p12', '.pfx'}:
        continue
    data = candidate.read_bytes()
    # Public Firebase identifiers and credential examples are omitted too, for this analysis-only snapshot.
    if b'-----BEGIN ' in data or b'AIza' in data or b'PRIVATE KEY' in data:
        continue
    target = source / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(candidate, target)
    manifest.append({'path': relative, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
instructions = '''# Sanitized V2 analysis workspace
This copy is for the DevOS Product analysis stage only. Do not change product source, install dependencies, run builds, use external connectors, publish, deploy, push, or access production/V1.
Only write the Product handoff and applicable .workflow planning records. Scope: refine the existing Variant 1 design across the public site, separate Website Admin, eight staff panels, Android/iOS Sales and Call Center desktop. Preserve all business rules and product EN/FA/RTL behavior. All planning and diagrams are English.
Owner approved the roadmap direction; do not represent that as approval of new generated scope/design documents. Stop at the runtime approval gate. Do not copy missing credentials, uploads, generated bundles, dependencies, or personal/customer records into this workspace. This snapshot intentionally cannot establish build/deployment readiness.
'''
(source / 'AGENTS.md').write_text(instructions, encoding='utf-8')
(record / 'source-manifest.json').write_text(json.dumps({'baseline': subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip(), 'count':len(manifest),'files':manifest}, indent=2), encoding='utf-8')
print(f'Curated {len(manifest)} tracked source files; no assets, uploads, environment files, dependency trees, git data, or private configuration copied.')
