"""README screenshots and hero banner, from the live app.

  python scripts/readme-shots.py            # against production
  BASE=http://localhost:3000 python scripts/readme-shots.py

Needs Python with Playwright and Chrome, and APP_PIN in the environment or .env.local. It plans a demo trip (Goa, four nights,
by air, three weeks out) through the real form, captures the list Go builds for
it, then deletes the trip again. Past trips are hidden from the pictures, and Gear
is shown on its Electronics shelf. Writes docs/readme/{trips,trip,list,new,gear,hero}.png.
"""
import base64, datetime as dt, os, re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'https://wearwise-go-by-algothrim.vercel.app')
OUT = Path('docs/readme')
OUT.mkdir(parents=True, exist_ok=True)
UA = 'Mozilla/5.0 (Linux; Android 16; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36'
PIN = os.environ.get('APP_PIN') or re.search(r'^APP_PIN=(.*)$', Path('.env.local').read_text(), re.M).group(1).strip().strip('"')
LEAVE = (dt.date.today() + dt.timedelta(days=21)).isoformat()

# SamsungOne is the S24's system font; Chrome on Windows cannot match the installed copy by name.
FONT_DIRS = [os.environ.get('SAMSUNG_FONTS', ''), os.path.expandvars('%LOCALAPPDATA%/Microsoft/Windows/Fonts'), 'C:/Windows/Fonts']
FONTS = next((Path(d) for d in FONT_DIRS if d and (Path(d) / 'SamsungOne-400.ttf').exists()), Path('.'))
FACES = {w: FONTS / f'SamsungOne-{w}.ttf' for w in (400, 700)}
HAVE_FONT = all(f.exists() for f in FACES.values())
print('SamsungOne:', HAVE_FONT and FONTS)
FONT_CSS = ''.join(f"@font-face{{font-family:SamsungOne;src:url('/__readme/SamsungOne-{w}.ttf');font-weight:{w}}}" for w in FACES)
INJECT = "document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = %r; document.head.append(s); });" % FONT_CSS
HIDE_PAST = """() => { for (const h of document.querySelectorAll('h2, p, span')) if (h.textContent.trim() === 'Past trips') {
  let n = h; while (n.parentElement && !n.parentElement.querySelector('a[href*="from="]')) n = n.parentElement;
  (n.parentElement || n).querySelectorAll('ul, ol').forEach(x => x.style.display = 'none'); h.parentElement.style.display = 'none'; } }"""

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2, user_agent=UA, is_mobile=True, has_touch=True, service_workers='block', bypass_csp=True)
    if HAVE_FONT:
        ctx.route('**/__readme/*.ttf', lambda r: r.fulfill(body=FACES[int(r.request.url.split('-')[-1][:3])].read_bytes(), content_type='font/ttf'))
        ctx.add_init_script(INJECT)
    page = ctx.new_page()
    page.goto(BASE + '/unlock')
    assert page.request.post(BASE + '/api/unlock', data={'pin': PIN}).ok, 'unlock failed'
    trip_url = None
    try:
        page.goto(BASE + '/trips/new')
        page.get_by_placeholder('Goa, Manali, Jaipur').fill('Goa')
        page.get_by_role('button', name='One night more').click()
        page.get_by_role('button', name='Beach', exact=True).click()
        page.locator('input[type="date"]').fill(LEAVE)
        page.get_by_role('radio', name=re.compile('^Flight')).click()
        page.wait_for_timeout(600)
        page.screenshot(path=str(OUT / 'new.png'))
        page.get_by_role('button', name='Build my list').click()
        page.wait_for_url(re.compile(r'/trips/[0-9a-f-]{36}$'), timeout=30000)
        trip_url = page.url
        page.wait_for_timeout(20000)  # weather, the list, then the notes
        page.screenshot(path=str(OUT / 'trip.png'))
        page.mouse.wheel(0, 900)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(OUT / 'list.png'))

        page.goto(BASE + '/')
        page.wait_for_timeout(3000)
        page.evaluate(HIDE_PAST)
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / 'trips.png'))

        page.goto(BASE + '/items')
        page.wait_for_timeout(3000)
        page.get_by_role('radio', name=re.compile('^Electronics')).click()
        page.wait_for_timeout(1000)
        page.screenshot(path=str(OUT / 'gear.png'))
    finally:
        if trip_url:  # the demo trip must never outlive the run
            page.goto(trip_url)
            page.wait_for_timeout(2500)
            page.get_by_role('button', name='Trip options').click()
            page.get_by_role('button', name='Delete trip').click()
            page.get_by_role('button', name=re.compile('^Tap again to delete')).click()
            page.wait_for_url(BASE + '/', timeout=15000)
            print('demo trip deleted')
    ctx.close()

    # Hero: the mark, the promise, and three real screens.
    img = lambda n: 'data:image/png;base64,' + base64.b64encode((OUT / n).read_bytes()).decode()
    icon = 'data:image/png;base64,' + base64.b64encode(Path('public/icon-192.png').read_bytes()).decode()
    face = lambda w: 'data:font/ttf;base64,' + base64.b64encode(FACES[w].read_bytes()).decode() if HAVE_FONT else ''
    hero = f'''<html><head><style>
@font-face {{ font-family: SamsungOne; src: url('{face(400)}'); font-weight: 400; }}
@font-face {{ font-family: SamsungOne; src: url('{face(700)}'); font-weight: 700; }}
body {{ margin: 0; width: 1600px; height: 820px; background: #07090D; font-family: SamsungOne, 'SF Pro Display', system-ui, sans-serif; color: #EEF2F8; overflow: hidden; position: relative; }}
.glow {{ position: absolute; right: -160px; top: -200px; width: 1000px; height: 1000px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(107,159,237,0.20), rgba(107,159,237,0)); }}
.copy {{ position: absolute; left: 110px; top: 196px; width: 660px; }}
.wm {{ display: flex; align-items: center; gap: 18px; font-size: 42px; font-weight: 700; letter-spacing: -0.02em; }}
.wm img {{ width: 64px; height: 64px; }}
h1 {{ margin: 60px 0 0; font-size: 68px; line-height: 1.04; font-weight: 700; letter-spacing: -0.035em; }}
h1 em {{ font-style: normal; color: #6B9FED; }}
p {{ margin: 28px 0 0; font-size: 25px; line-height: 1.45; color: #A9B3C2; max-width: 29ch; }}
.phone {{ position: absolute; width: 300px; border-radius: 38px; overflow: hidden; border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 40px 90px -30px rgba(0,0,0,0.9); background: #000; }}
.phone img {{ display: block; width: 100%; }}
.a {{ left: 800px; top: 120px; transform: rotate(-4deg); }}
.b {{ left: 1040px; top: 70px; z-index: 2; }}
.c {{ left: 1280px; top: 140px; transform: rotate(4deg); }}
</style></head><body><div class="glow"></div>
<div class="copy"><div class="wm"><img src="{icon}">WearWise Go</div>
<h1>Pack like you already <em>remembered everything.</em></h1>
<p>A packing list built from the weather, the route and your own wardrobe.</p></div>
<div class="phone a"><img src="{img('new.png')}"></div>
<div class="phone b"><img src="{img('trip.png')}"></div>
<div class="phone c"><img src="{img('list.png')}"></div>
</body></html>'''
    pg = b.new_page(viewport={'width': 1600, 'height': 820})
    pg.set_content(hero)
    pg.evaluate('document.fonts.ready')
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(OUT / 'hero.png'))
    b.close()
print('written:', sorted(x.name for x in OUT.iterdir()))
