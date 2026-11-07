"""README screenshots, from the live app.

  python scripts/readme-shots.py            # against production
  BASE=http://localhost:3000 python scripts/readme-shots.py

Needs Python with Playwright and Chrome, and APP_PIN in the environment or .env.local. It plans a demo trip (Goa, four nights,
by air, three weeks out) through the real form, captures the list Go builds for
it, then deletes the trip again. Past trips are hidden from the pictures, and Gear
is shown on its Electronics shelf. Writes docs/readme/src/assets/*.png; the README Kit
(Work/Playbooks/README Kit/render.py) draws docs/readme/*.webp from them.
Screens are captured at 412x844, the Galaxy S26 Ultra's viewport, so the hero can
set them under a drawn status bar at their real size.
"""
import base64, datetime as dt, os, re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'https://wearwise-go-by-algothrim.vercel.app')
OUT = Path('docs/readme/src/assets')
OUT.mkdir(parents=True, exist_ok=True)
UA = 'Mozilla/5.0 (Linux; Android 16; SM-S948B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36'
PIN = os.environ.get('APP_PIN') or re.search(r'^APP_PIN=(.*)$', Path('.env.local').read_text(), re.M).group(1).strip().strip('"')
LEAVE = (dt.date.today() + dt.timedelta(days=21)).isoformat()

# SamsungOne is the Galaxy's system font; Chrome on Windows cannot match the installed copy by name.
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

# The display face is whatever the app itself ships (Archivo through next/font), read off the page.
DISPLAY_FONT_SRC = """() => {
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      if (!(r instanceof CSSFontFaceRule)) continue;
      const fam = r.style.getPropertyValue('font-family');
      const range = r.style.getPropertyValue('unicode-range') || 'U+0-FF';
      if (/archivo/i.test(fam) && !/fallback/i.test(fam) && /U\+0+(-|,|$)|U\+0-/i.test(range.replace(/\s/g, ''))) {
        const m = r.style.getPropertyValue('src').match(/url\("?([^")]+)"?\)/);
        if (m) return new URL(m[1], sheet.href || location.href).href;
      }
    }
  }
  return null;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 412, 'height': 844}, device_scale_factor=2, user_agent=UA, is_mobile=True, has_touch=True, service_workers='block', bypass_csp=True)
    if HAVE_FONT:
        ctx.route('**/__readme/*.ttf', lambda r: r.fulfill(body=FACES[int(r.request.url.split('-')[-1][:3])].read_bytes(), content_type='font/ttf'))
        ctx.add_init_script(INJECT)
    page = ctx.new_page()
    page.goto(BASE + '/unlock')
    assert page.request.post(BASE + '/api/unlock', data={'pin': PIN}).ok, 'unlock failed'
    trip_url = None
    display_font = b''
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
        font_src = page.evaluate(DISPLAY_FONT_SRC)
        display_font = page.request.get(font_src).body() if font_src else b''
        print('display font bytes:', len(display_font))

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

    b.close()
print('written:', sorted(x.name for x in OUT.iterdir()))
