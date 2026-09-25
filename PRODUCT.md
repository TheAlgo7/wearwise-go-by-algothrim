# WearWise Go — Impeccable Design Context

## Design Context

### Users
Single user: Gaurav Kumar (The Algothrim). Personal AI travel-packing app installed as a PWA on his Samsung phone. Sibling of WearWise Wardrobe — used before and during trips: create a trip, generate a packing kit, check items off while packing. Context is always mobile, always him, no onboarding or discoverability needed.

### Brand Personality
**3 words: Personal. Instant. Effortless.**
A private tool, not a product. It should feel like an extension of the phone's native OS, not a standalone app.

### Aesthetic Direction
- **Theme:** AMOLED dark — pure `#000000` background. Matches the Samsung One UI 9 system aesthetic on his phone.
- **Accent:** Cornflower blue `#6B9FED` (travel = blue; the Wardrobe sibling owns crimson). Soft copper/terracotta (`#C8855A`) for urgency, never neon amber.
- **Typography:** SamsungOne / system stack. Hierarchical, clean, no decorative type.
- **Feel:** Samsung One UI 9 native: generous padding, pill shapes, thick rounded progress bars, matte surfaces, grouped lists instead of a card per item. Content-first. Glass only on the nav, and it is real liquid glass (edge refraction), not a frosted blur. The one glow is the next trip's weather light, and it carries information.
- **One UI 9 notes (vs 8.5):** incremental, not an overhaul: thicker progress bars, status/micro text ≥11px, descriptions trimmed from menus. Blue ticks mark packed items; a chosen segment or chip is a raised neutral, not blue, so blue stays on the one action per screen.
- **Clothes are the Wardrobe's.** Go reads WearWise Wardrobe's `items` table (same Supabase project, read-only) and packs his real pieces with their photos. It never keeps its own copy of a shirt.
- **Anti-references:** No travel-brochure aesthetic. No luxury editorial. No glassmorphic blur on content. No AI-generated gradient vibes.

### Design Principles
1. **One tap, done** — every core action (new trip, tick an item, add a forgotten one) reachable in 1 tap from wherever you are. Creating a trip builds its list; there is no separate "generate" step.
2. **Content is the UI** — the packing checklist is the hero. Chrome stays quiet.
3. **Native feel** — transitions, tap feedback, and safe-area handling indistinguishable from a Samsung system app.
4. **No waste** — no apologetic empty states, no redundant labels, no decoration that doesn't earn its place.
5. **Honest states** — a failed fetch is an error with a Retry, never silently rendered as "empty". On mobile networks this matters.
6. **Personal over polished** — tuned for one person, not a public launch.
