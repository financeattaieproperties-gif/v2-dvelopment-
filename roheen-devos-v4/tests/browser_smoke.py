"""Optional Chromium UI smoke test; requires locally installed Playwright/browser."""
import tempfile, threading, pathlib, sys, shutil, os
from playwright.sync_api import sync_playwright
from devos.core import Runtime
from devos.studio import make_server

def main():
    output=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'evidence'); output.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        rt=Runtime(tmp); server=make_server(rt,0); thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with sync_playwright() as p:
                browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'] if os.environ.get('DEVOS_TEST_NO_SANDBOX')=='1' else []); page=browser.new_page(viewport={'width':1440,'height':1000}); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(f'http://127.0.0.1:{server.server_port}/'); page.get_by_role('button',name='Create project',exact=True).click();page.get_by_role('heading',name='Attaie Properties',exact=True).wait_for()
                for _ in range(2):
                    page.get_by_role('button',name='Run / continue').click();page.get_by_role('button',name='Approve gate').wait_for();page.wait_for_function("!Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='Approve gate').disabled",timeout=10000);page.get_by_role('button',name='Approve gate').click();page.wait_for_function("!Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='Run / continue').disabled",timeout=10000)
                page.get_by_role('button',name='Run / continue').click();page.get_by_text('SIMULATION_ONLY',exact=True).wait_for(timeout=10000);assert not errors,errors
                page.screenshot(path=str(output/'studio-desktop.png'),full_page=True)
                page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(250);assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');page.screenshot(path=str(output/'studio-mobile.png'),full_page=True)
                print('Chromium smoke: creation, two approvals, full fixture pipeline, verdict, mobile width, zero page errors — PASS')
                browser.close()
        finally:server.shutdown();server.server_close();thread.join()
if __name__=='__main__': main()
