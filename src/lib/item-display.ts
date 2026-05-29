import type { TravelItem } from '@/types';

interface ProductDisplay {
  title: string;
  brand?: string;
  line?: string;
  detail?: string;
  image?: string;
}

const KNOWN_PRODUCTS: Record<string, ProductDisplay> = {
  'arata volumizing sea salt hair spray': {
    title: 'Sea salt spray',
    brand: 'Arata',
    line: 'Volumizing texture spray',
    detail: '50 ml · volume, texture, UV filter',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/arata-sea-salt-spray.png',
  },
  'beardo dandruff control sulphate free shampoo': {
    title: 'Anti-dandruff shampoo',
    brand: 'Beardo',
    line: 'Dandruff Control Sulphate Free Shampoo',
    detail: '200 ml · itchy scalp, biotin',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/beardo-dandruff-shampoo.png',
  },
  'beardo hair clay wax': {
    title: 'Hair clay wax',
    brand: 'Beardo',
    line: 'Matte strong-hold styling clay',
    detail: '100 g · volume, texture, restylable',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/beardo-clay-wax.png',
  },
  "l'oreal paris hyaluron moisture sealing conditioner": {
    title: 'Conditioner',
    brand: "L'Oreal Paris",
    line: 'Hyaluron Moisture Sealing Conditioner',
    detail: '175 ml · dry hair, frizz control',
    image: "https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/loreal-hyaluron-conditioner.png",
  },
  "l'oreal paris fresh hyaluron moisture 72hr moisture sealing conditioner": {
    title: 'Conditioner',
    brand: "L'Oreal Paris",
    line: 'Hyaluron Moisture 72HR',
    detail: '175 ml · hydration, smoothness',
    image: "https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/loreal-hyaluron-conditioner.png",
  },
  "l'oreal paris hyaluron moisture 72hr conditioner": {
    title: 'Conditioner',
    brand: "L'Oreal Paris",
    line: 'Hyaluron Moisture 72HR',
    detail: '175 ml · hydration, smoothness',
    image: "https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/loreal-hyaluron-conditioner.png",
  },
  'the derma co. 1% hyaluronic sunscreen aqua gel spf 50': {
    title: 'Sunscreen',
    brand: 'The Derma Co.',
    line: '1% Hyaluronic Aqua Gel SPF 50',
    detail: '80 g · fragrance-free, hydrating',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/tdc-sunscreen-aqua.png',
  },
  'the derma co. 1% hyaluronic sunscreen oil-free matte gel spf 50': {
    title: 'Sunscreen',
    brand: 'The Derma Co.',
    line: '1% Hyaluronic Oil-Free Matte Gel SPF 50',
    detail: '50 g · oily skin, no white cast',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/tdc-sunscreen-matte.png',
  },
  'the derma co. 1% kojic acid face wash': {
    title: 'Face wash',
    brand: 'The Derma Co.',
    line: '1% Kojic Acid Face Wash',
    detail: '100 ml · pigmentation, blemishes',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/tdc-kojic-facewash.png',
  },
  'the derma co. tran-zelaic pigmentation corrector serum': {
    title: 'Face serum',
    brand: 'The Derma Co.',
    line: 'Tran-Zelaic Pigmentation Corrector',
    detail: '30 ml · acne marks, clarity',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/tdc-tranzelaic-serum.png',
  },
  'trimfinity edge shave dual-action mini electric razor': {
    title: 'Electric razor',
    brand: 'Trimfinity',
    line: 'Edge Shave Dual-Action Mini',
    detail: 'Rechargeable · waterproof travel razor',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/trimfinity-electric-razor.png',
  },
  'urbangabru hair volumizing powder wax': {
    title: 'Hair powder wax',
    brand: 'UrbanGabru',
    line: 'Volumizing Powder Wax',
    detail: '10 g · matte volume, strong hold',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/urbangabru-powder-wax.png',
  },
  'wild stone edge premium perfume': {
    title: 'Perfume',
    brand: 'Wild Stone',
    line: 'Edge Premium Perfume',
    detail: '100 ml · fresh woody fragrance',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/wild-stone-edge-perfume.png',
  },
  'yardley london gentleman classic perfume edt': {
    title: 'Perfume',
    brand: 'Yardley London',
    line: 'Gentleman Classic EDT',
    detail: '50 ml · citrus, spicy, woody',
    image: 'https://mymduybnngsatxxbzzet.supabase.co/storage/v1/object/public/items/travel-items/grooming/yardley-gentleman-edt.png',
  },
};

const KNOWN_BRANDS = [
  'The Derma Co.',
  "L'Oreal Paris",
  'Yardley London',
  'Wild Stone',
  'UrbanGabru',
  'Trimfinity',
  'Beardo',
  'Arata',
];

const TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/conditioner/i, 'Conditioner'],
  [/shampoo/i, 'Shampoo'],
  [/sunscreen/i, 'Sunscreen'],
  [/face wash/i, 'Face wash'],
  [/serum/i, 'Face serum'],
  [/perfume|edt|fragrance/i, 'Perfume'],
  [/razor|shaver/i, 'Electric razor'],
  [/clay wax/i, 'Hair clay wax'],
  [/powder wax/i, 'Hair powder wax'],
  [/sea salt|hair spray/i, 'Hair spray'],
  [/body wash/i, 'Body wash'],
  [/deodorant/i, 'Deodorant'],
  [/moisturiser|moisturizer/i, 'Moisturiser'],
  [/lip balm/i, 'Lip balm'],
  [/nail clipper/i, 'Nail clippers'],
  [/comb/i, 'Hair comb'],
];

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+for men\b/g, '')
    .replace(/\s+pa\+{2,4}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripBrand(name: string, brand?: string) {
  if (!brand) return name;
  return name.replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
}

export function getItemDisplay(item: TravelItem): ProductDisplay {
  const normalized = normalizeName(item.name);
  const known = KNOWN_PRODUCTS[normalized];
  if (known) return known;

  const brand = KNOWN_BRANDS.find((candidate) => item.name.toLowerCase().startsWith(candidate.toLowerCase()));
  const type = TYPE_PATTERNS.find(([pattern]) => pattern.test(item.name))?.[1] ?? item.name;
  const line = stripBrand(item.name, brand);
  const detailTags = item.tags.filter((tag) => tag.toLowerCase() !== type.toLowerCase()).slice(0, 3);

  return {
    title: type,
    brand,
    line: line !== type ? line : undefined,
    detail: detailTags.length > 0 ? detailTags.join(', ') : undefined,
    image: item.image_url,
  };
}
