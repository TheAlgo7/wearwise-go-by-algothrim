// ─── Trip ────────────────────────────────────────────────────────────────────

export type TransportMode = 'plane' | 'car' | 'train' | 'bus';
export type VehicleProfile =
  | 'curvv'
  | 'virtus_gt'
  | 'thar_roxx'
  | 'fortuner_legender'
  | 'alto_k10'
  | 'venue'
  | 'friends_car';

export interface Destination {
  city:       string;     // e.g. "Manali,IN"
  nights:     number;
  situation?: string;     // e.g. "beach", "mountain", "business", "resort"
}

export interface Trip {
  id:            string;
  name:          string;
  departure:     string;  // ISO date "YYYY-MM-DD"
  transport:     TransportMode;
  vehicle_profile?: VehicleProfile | null;
  destinations:  Destination[];
  carry_on_only: boolean;
  is_work:       boolean;
  weather?:      DestinationWeather[] | null;  // last generated snapshot
  packing_reasoning?: string | null;           // last AI review of the kit
  created_at:    string;
  updated_at:    string;
}

// ─── Packing list ────────────────────────────────────────────────────────────

export type PackingCategory =
  | 'clothing'
  | 'grooming'
  | 'electronics'
  | 'documents'
  | 'misc';

export type PackingPriority = 'critical' | 'normal';

export type PackingSource = 'engine' | 'user';

export interface PackingItem {
  id:                string;
  trip_id:           string;
  category:          PackingCategory;
  name:              string;
  quantity:          number;
  packed:            boolean;
  is_clothing:       boolean;
  priority:          PackingPriority;
  notes?:            string | null;
  destination_label?: string | null;  // e.g. "Gulmarg" for per-stop items
  /**
   * Still in use until the morning he leaves: toothbrush, face wash, chargers.
   * Shown as its own group so the bag can be closed the night before.
   */
  pack_last?:        boolean;
  /** 'user' rows were added by hand and survive a rebuild untouched. */
  source?:           PackingSource;
  /** Photo, for clothes picked from the Wardrobe. */
  image_url?:        string | null;
  wardrobe_item_id?: string | null;
  /** A suggestion he removed. Hidden, but kept so a rebuild does not re-add it. */
  dismissed?:        boolean;
}

// ─── Wardrobe (read-only, from WearWise Wardrobe's `items`) ─────────────────

export interface WardrobeItem {
  id:            string;
  name:          string;
  image_url:     string | null;
  primary_color: string | null;
  sleeve_length: string | null;
  formality:     number | null;
  min_temp_c:    number | null;
  max_temp_c:    number | null;
  vibe:          string[];
  occasions:     string[];
  category:      { name: string; layer_type: string } | null;
}

// ─── Travel items (wardrobe shared) ──────────────────────────────────────────

export type ClothingLayer = 'base' | 'mid' | 'outer' | 'bottom' | 'footwear' | 'accessory';
export type WarmthRating  = 1 | 2 | 3 | 4 | 5;
export type FormalityRating = 1 | 2 | 3 | 4 | 5;

export interface TravelItem {
  id:          string;
  name:        string;
  category:    PackingCategory;
  layer?:      ClothingLayer;
  warmth?:     WarmthRating;
  formality?:  FormalityRating;
  color?:      string;
  tags:        string[];
  is_clothing: boolean;
  size_ml?:    number | null;
  image_url?:  string;
  created_at:  string;
}

// ─── Packing rules ───────────────────────────────────────────────────────────

export interface PackingRule {
  id:        string;
  situation: string;
  item_name: string;
  quantity:  number;
  notes?:    string;
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface DestinationWeather {
  city:        string;
  country:     string;
  /** State the destination resolved to, e.g. "Himachal Pradesh". */
  region?:     string;
  tempC:       number;
  feelsLikeC:  number;
  description: string;
  humidity:    number;
  windKph:     number;
  icon:        string;
}

// ─── Packing engine ──────────────────────────────────────────────────────────

export interface GeneratedPackingList {
  critical:    PackingItem[];
  clothing:    PackingItem[];
  grooming:    PackingItem[];
  electronics: PackingItem[];
  documents:   PackingItem[];
  misc:        PackingItem[];
  reasoning:   string;
}
