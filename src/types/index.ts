// ─── Trip ────────────────────────────────────────────────────────────────────

export type TransportMode = 'plane' | 'car' | 'train' | 'bus';

export interface Destination {
  city: string;        // e.g. "Manali,IN"
  nights: number;
  situation?: string;  // e.g. "beach", "mountain", "business", "resort"
}

export interface Trip {
  id:            string;
  name:          string;
  departure:     string;   // ISO date "YYYY-MM-DD"
  transport:     TransportMode;
  destinations:  Destination[];
  carry_on_only: boolean;
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

export interface PackingItem {
  id:          string;
  trip_id:     string;
  category:    PackingCategory;
  name:        string;
  quantity:    number;
  packed:      boolean;
  is_clothing: boolean;
  notes?:      string;
}

// ─── Travel items (wardrobe shared) ──────────────────────────────────────────

export type ClothingLayer = 'base' | 'mid' | 'outer' | 'bottom' | 'footwear' | 'accessory';
export type WarmthRating = 1 | 2 | 3 | 4 | 5;
export type FormalityRating = 1 | 2 | 3 | 4 | 5;

export interface TravelItem {
  id:           string;
  name:         string;
  category:     PackingCategory;
  layer?:       ClothingLayer;
  warmth?:      WarmthRating;
  formality?:   FormalityRating;
  color?:       string;
  tags:         string[];
  is_clothing:  boolean;
  image_url?:   string;
  created_at:   string;
}

// ─── Packing rules ───────────────────────────────────────────────────────────

export interface PackingRule {
  id:          string;
  situation:   string;   // e.g. "beach", "mountain"
  item_name:   string;
  quantity:    number;
  notes?:      string;
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface DestinationWeather {
  city:        string;
  country:     string;
  tempC:       number;
  feelsLikeC:  number;
  description: string;
  humidity:    number;
  windKph:     number;
  icon:        string;
}

// ─── Packing engine ──────────────────────────────────────────────────────────

export interface PackingContext {
  trip:        Trip;
  weather:     DestinationWeather[];
  coldestTempC: number;
  totalNights: number;
}

export interface GeneratedPackingList {
  clothing:    PackingItem[];
  grooming:    PackingItem[];
  electronics: PackingItem[];
  documents:   PackingItem[];
  misc:        PackingItem[];
  reasoning:   string;
}
