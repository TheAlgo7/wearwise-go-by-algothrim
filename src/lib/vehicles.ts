import type { VehicleProfile } from '@/types';

export interface VehicleProfileInfo {
  id: VehicleProfile;
  label: string;
  shortLabel: string;
  hint: string;
  packingNote: string;
}

export const VEHICLE_PROFILES: VehicleProfileInfo[] = [
  {
    id: 'curvv',
    label: 'Tata Curvv',
    shortLabel: 'Curvv',
    hint: 'My car, 500L boot',
    packingNote: 'Own car with generous boot space, wireless charging, ventilated seats, and a firm ride on sharp bumps.',
  },
  {
    id: 'virtus_gt',
    label: 'Volkswagen Virtus GT',
    shortLabel: 'Virtus GT',
    hint: 'Big sedan boot',
    packingNote: 'Massive 521L boot and excellent rear legroom, but keep cabin loose items controlled for spirited highway driving.',
  },
  {
    id: 'thar_roxx',
    label: 'Mahindra Thar Roxx',
    shortLabel: 'Thar Roxx',
    hint: 'Off-road friendly',
    packingNote: 'Great for rough roads and offbeat routes; high step-in and wind noise make compact cabin packing useful.',
  },
  {
    id: 'fortuner_legender',
    label: 'Toyota Fortuner Legender',
    shortLabel: 'Fortuner',
    hint: 'Bad-road tank',
    packingNote: 'Excellent for rough roads and luggage-heavy trips, but ride can feel stiff and bouncy at low speeds.',
  },
  {
    id: 'alto_k10',
    label: 'Maruti Alto K10',
    shortLabel: 'Alto K10',
    hint: 'Pack compact',
    packingNote: 'Small car with limited comfort and high-speed stability, so pack light and avoid loose bulky luggage.',
  },
  {
    id: 'venue',
    label: 'Hyundai Venue',
    shortLabel: 'Venue',
    hint: 'Compact SUV',
    packingNote: 'Easy city car, but rear space is tight, so avoid overpacking if adults are sitting in the back.',
  },
  {
    id: 'friends_car',
    label: "Friend's car",
    shortLabel: "Friend's car",
    hint: 'Unknown space',
    packingNote: 'Assume less control over boot space, chargers, and stops. Keep essentials in your own small bag.',
  },
];

export const DEFAULT_VEHICLE_PROFILE: VehicleProfile = 'curvv';

export function getVehicleProfileInfo(profile?: VehicleProfile | null) {
  return VEHICLE_PROFILES.find(vehicle => vehicle.id === profile);
}
