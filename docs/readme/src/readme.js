// WearWise Go's README pictures, drawn by the README Kit (Work\Playbooks\README Kit\render.py).
// Every wide picture has a "-mobile" twin that the README swaps in on screens up to 600 px.
// The phone screens come from scripts/readme-shots.py: the live app at the Galaxy S26 Ultra's
// 412x844 viewport and 2x, with a sample Goa trip. Headlines are in Archivo, as in the app.
const BLUE = '#6f9cf0', INK = '#F2F4F8';
const NIGHT = (at, glow = '#14233a') => `radial-gradient(760px 620px at ${at}, ${glow} 0%, rgba(0,0,0,0) 70%), #000`;
const P = (src, x, y, w, rot = 0, z = 20, glow = null) => ({ type: 'phone', src, x, y, w, rot, z, glow, bar: true, barBg: '#000', barColor: '#F4F2F6' });
const panel = (head, sub, items, glow) => ({
  w: 1600, h: 760, bg: NIGHT('76% 54%', glow), color: INK, accent: BLUE,
  head: { x: 80, y: 200, size: 104, max: 560, lines: head }, sub: { x: 82, width: 500, size: 27, text: sub }, items,
});
const tall = (head, sub, items, glow) => ({
  w: 1080, h: 1360, bg: NIGHT('56% 74%', glow), color: INK, accent: BLUE,
  head: { x: 66, y: 86, size: 120, max: 950, lines: head }, sub: { x: 70, width: 930, size: 36, text: sub }, items,
});
const pair = (a, b) => [P(a, 900, 80, 290, -4, 24), P(b, 1220, 110, 280, 5, 22)];
const pairTall = (a, b) => [P(a, 90, 590, 330, -4, 24), P(b, 590, 620, 330, 5, 22)];

window.README = {
  name: 'WearWise Go', icon: 'icon.png',
  fonts: { head: { family: 'Archivo', src: 'assets/fonts/archivo.woff2', weight: 620, upper: false, lh: 1.04, tracking: '-0.03em', variation: "'wdth' 112" } },
  layouts: {
    hero: {
      w: 1600, h: 820, bg: NIGHT('70% 52%'), color: INK, accent: BLUE,
      brand: { x: 84, y: 120, size: 30 },
      head: { x: 80, y: 236, size: 80, max: 600, lines: ['Pack like you', 'already remembered', 'everything.'] },
      sub: { x: 84, width: 480, size: 27, gap: 34, text: 'A packing list built from the weather, the route and your own wardrobe.' },
      items: [P('new.png', 760, 150, 250, -6), P('trip.png', 1010, 80, 290, 0, 24), P('list.png', 1300, 150, 250, 6, 22)],
    },
    'hero-mobile': {
      w: 1080, h: 1380, bg: NIGHT('56% 76%'), color: INK, accent: BLUE,
      brand: { x: 70, y: 70, size: 38 },
      head: { x: 66, y: 190, size: 104, max: 950, lines: ['Pack like you', 'already remembered', 'everything.'] },
      sub: { x: 70, width: 930, size: 38, text: 'A packing list built from the weather, the route and your own wardrobe.' },
      items: [P('new.png', 64, 730, 280, -6), P('trip.png', 400, 700, 290, 0, 24), P('list.png', 736, 730, 280, 6, 22)],
    },
    plan: panel(['Say where,', 'Go writes it'], 'Where, how many nights, what kind of place and how you travel. Go reads the forecast and builds the list.', pair('new.png', 'trips.png')),
    'plan-mobile': tall(['Say where,', 'Go writes it'], 'Where, how many nights, what kind of place and how you travel. Go builds the list.', pairTall('new.png', 'trips.png')),
    forget: panel(["Don't forget", 'means it'], 'About five things a trip fails without, not twenty, with notes for the route: liquids for a flight, a cabin bag that fits.', pair('trip.png', 'gear.png'), '#2b1d0e'),
    'forget-mobile': tall(["Don't forget", 'means it'], 'About five things a trip fails without, with notes for the route.', pairTall('trip.png', 'gear.png'), '#2b1d0e'),
    clothes: panel(['Your clothes,', 'not categories'], 'Clothing comes from the WearWise wardrobe, picked for the weather at every stop, with what to wear on the way.', pair('list.png', 'trip.png'), '#2a1218'),
    'clothes-mobile': tall(['Your clothes,', 'not categories'], 'Clothing comes from the WearWise wardrobe, picked for the weather at every stop.', pairTall('list.png', 'trip.png'), '#2a1218'),
  },
};
