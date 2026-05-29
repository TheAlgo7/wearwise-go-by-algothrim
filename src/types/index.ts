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

export interface PackingItem {
  id:                string;
  trip_id:           string;
  category:          PackingCategory;
  name:              string;
  quantity:          number;
  packed:            boolean;
  is_clothing:       boolean;
  priority:          PackingPriority;
  notes?:            string;
  destination_label?: string;  // e.g. "Gulmarg" for per-stop items
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
