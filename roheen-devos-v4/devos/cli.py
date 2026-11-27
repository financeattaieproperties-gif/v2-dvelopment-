from __future__ import annotations
import argparse,json,os,pathlib,sys
from .core import Runtime

def main(argv=None):
    p=argparse.ArgumentParser(prog='devos',description='Roheen DevOS V4 — local agent orchestrator')
    p.add_argument('--home',default=os.environ.get('DEVOS_HOME',str(pathlib.Path.home()/'.roheen-devos')))
    sub=p.add_subparsers(dest='cmd',required=True)
    new=sub.add_parser('create'); new.add_argument('--name',required=True); new.add_argument('--brief',required=True,help='Path to a text/Markdown brief'); new.add_argument('--mode',choices=['rapid','professional','enterprise'],default='professional'); new.add_argument('--profile',choices=['landing','fullstack'],default='landing'); new.add_argument('--adapter',choices=['fixture','codex'],default='fixture'); new.add_argument('--verify',default='[]',help='Trusted local command as JSON argv, e.g. ["npm","test"]'); new.add_argument('--source',help='Optional clean local source directory to copy; never works in place'); new.add_argument('--allow-real',action='store_true',help='Acknowledge AI usage, local code execution and configured MCP access')
    for cmd in ['run','status','approve','retry','recover','inspect','repair']:
        x=sub.add_parser(cmd);x.add_argument('project');
        if cmd=='recover':x.add_argument('--worker-stopped',required=True,action='store_true')
    sub.add_parser('list'); sub.add_parser('doctor')
    s=sub.add_parser('studio');s.add_argument('--port',type=int,default=8765)
    a=p.parse_args(argv); rt=Runtime(a.home)
    try:
        if a.cmd=='create':
            if a.adapter=='codex' and not a.allow_real: raise ValueError('Real mode requires --allow-real. Review README safety boundaries first.')
            print(rt.create(a.name,pathlib.Path(a.brief).read_text(encoding='utf-8'),a.mode,a.profile,a.adapter,json.loads(a.verify),a.source))
        elif a.cmd=='doctor': print(json.dumps(rt.capabilities(),indent=2))
        elif a.cmd=='list': print(json.dumps(rt.list(),indent=2))
        elif a.cmd=='status': print(json.dumps({'project':rt.get(a.project),'tasks':rt.tasks(a.project),'usage':rt.usage(a.project)},indent=2,ensure_ascii=False))
        elif a.cmd=='inspect': print(json.dumps({'workspace':str(rt.workspace(a.project)),'evidence':str(rt.evidence(a.project)),'events':rt.events(a.project)},indent=2,ensure_ascii=False))
        elif a.cmd=='run': print(rt.run(a.project))
        elif a.cmd=='approve': rt.approve(a.project); print('Approved. Run again to continue.')
        elif a.cmd=='repair': rt.repair(a.project); print('Repair queued. Run again to reverify candidate.')
        elif a.cmd=='retry': rt.retry(a.project); print('Queued for manual retry.')
        elif a.cmd=='recover': rt.recover(a.project); print('Marked blocked. Inspect then retry.')
        elif a.cmd=='studio':
            from .studio import serve
            serve(rt,a.port)
    except (ValueError,OSError) as e: print(str(e),file=sys.stderr);return 2
    return 0
