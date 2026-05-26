export const PLANE_LIQUID_ML_LIMIT = 100;

// Clothing count formulae
export const OUTFIT_BUFFER    = 1;
export const UNDERWEAR_BUFFER = 2;

// Temperature thresholds (°C)
export const TEMP_COLD = 10;  // thermals required
export const TEMP_COOL = 18;  // mid-layer recommended
export const TEMP_WARM = 26;  // above this = hot

// Urgency: trip departure within this many days triggers urgent mode
export const URGENCY_DAYS = 1;

// Long trip: conditionally include laptop
export const LONG_TRIP_NIGHTS = 7;

export const CARRY_ON_MAX_LIQUIDS_ML = 100;

export const CATEGORY_ORDER = [
  'critical',
  'clothing',
  'grooming',
  'electronics',
  'documents',
  'misc',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  critical:    '⚠️',
  clothing:    '👕',
  grooming:    '🪥',
  electronics: '🔌',
  documents:   '📄',
  misc:        '🎒',
};

export const CATEGORY_LABELS: Record<string, string> = {
  critical:    'Don\'t forget',
  clothing:    'Clothing',
  grooming:    'Grooming',
  electronics: 'Electronics',
  documents:   'Documents',
  misc:        'Misc',
};

export const TRANSPORT_LABELS: Record<string, string> = {
  plane: 'Flight',
  car:   'Road trip',
  train: 'Train',
  bus:   'Bus',
};
