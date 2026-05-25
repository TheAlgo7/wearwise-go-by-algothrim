export const PLANE_LIQUID_ML_LIMIT = 100;

// Clothing count formulae
// Tops/bottoms: nights + 1 (one per day + one spare)
// Underwear/socks: nights + 2
export const OUTFIT_BUFFER = 1;
export const UNDERWEAR_BUFFER = 2;

// Temperature thresholds (°C) for warmth-layer guidance
export const TEMP_COLD    = 10;  // thermals required
export const TEMP_COOL    = 18;  // mid-layer recommended
export const TEMP_WARM    = 26;  // light clothing
// Above 26 = hot — minimal layers

// Carry-on size limit for checked-luggage-only items
export const CARRY_ON_MAX_LIQUIDS_ML = 100;

// Category display order in packing list UI
export const CATEGORY_ORDER = [
  'clothing',
  'grooming',
  'electronics',
  'documents',
  'misc',
] as const;

// Emoji icons per category
export const CATEGORY_ICONS: Record<string, string> = {
  clothing:    '👕',
  grooming:    '🪥',
  electronics: '🔌',
  documents:   '📄',
  misc:        '🎒',
};

// Transport display labels
export const TRANSPORT_LABELS: Record<string, string> = {
  plane: 'Flight',
  car:   'Road trip',
  train: 'Train',
  bus:   'Bus',
};
