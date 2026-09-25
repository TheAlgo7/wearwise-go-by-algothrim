export interface WeatherData {
  city: string;
  country: string;
  /** State or region the name resolved to, so a wrong match is visible. */
  region?: string;
  tempC: number;
  feelsLikeC: number;
  description: string;
  humidity: number;
  windKph: number;
  icon: string;
}

/**
 * Places people travel to that are regions, not towns, mapped to the town the
 * weather should come from. Asked by name, "Goa" resolves to a village in
 * Himachal and "Coorg" to nothing at all.
 */
const REGION_TOWNS: Record<string, string> = {
  goa: 'Panaji',
  'north goa': 'Mapusa',
  'south goa': 'Margao',
  coorg: 'Madikeri',
  kodagu: 'Madikeri',
  kashmir: 'Srinagar',
  ladakh: 'Leh',
  kerala: 'Kochi',
  sikkim: 'Gangtok',
  spiti: 'Kaza',
  'spiti valley': 'Kaza',
  andaman: 'Port Blair',
  andamans: 'Port Blair',
  meghalaya: 'Shillong',
  himachal: 'Shimla',
  'himachal pradesh': 'Shimla',
  uttarakhand: 'Dehradun',
  rajasthan: 'Jaipur',
  lakshadweep: 'Kavaratti',
};

interface Place { lat: number; lon: number; region?: string; country: string }

/**
 * Where a typed destination actually is.
 *
 * The weather endpoint's own name lookup picks an arbitrary match: "Manali"
 * came back as the Chennai suburb at 34°C instead of Manali in Himachal at
 * about 15°, which would have packed a mountain trip for heat. The geocoding
 * endpoint ranks the well-known place first (Manali, Himachal; Udaipur,
 * Rajasthan; Leh, Ladakh), so the lookup goes through it and weather is asked
 * for by coordinates.
 */
async function resolvePlace(input: string, key: string): Promise<Place | null> {
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  const hasCountry = parts.length > 1 && /^[A-Za-z]{2}$/.test(last);
  const country = hasCountry ? last.toUpperCase() : 'IN';
  const name = REGION_TOWNS[parts[0].toLowerCase()] ?? parts[0];
  const state = parts.length > (hasCountry ? 2 : 1) ? parts[1] : undefined;

  const q = [name, state, country].filter(Boolean).join(',');
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${key}`,
    { next: { revalidate: 86_400 } },
  );
  if (!res.ok) return null;
  const hits = (await res.json()) as Array<{ lat: number; lon: number; state?: string; country: string }>;
  const hit = hits[0];
  return hit ? { lat: hit.lat, lon: hit.lon, region: hit.state, country: hit.country } : null;
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

/** Weather for one destination, labelled with the name as he typed it. */
export async function fetchWeather(city: string): Promise<WeatherData> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error('OPENWEATHER_API_KEY not set');

  const place = await resolvePlace(city, key).catch(() => null);
  const url = place
    ? `https://api.openweathermap.org/data/2.5/weather?lat=${place.lat}&lon=${place.lon}&appid=${key}&units=metric`
    : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenWeather error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return {
    // The typed name, not the station's ("Udhagamandalam" for Ooty), so the
    // engine can match weather to the destination it belongs to.
    city:        titleCase(city.split(',')[0].trim()) || data.name,
    country:     place?.country ?? data.sys.country,
    region:      place?.region,
    tempC:       Math.round(data.main.temp),
    feelsLikeC:  Math.round(data.main.feels_like),
    description: data.weather[0].description,
    humidity:    data.main.humidity,
    windKph:     Math.round(data.wind.speed * 3.6),
    icon:        data.weather[0].icon,
  };
}

/**
 * Weather for every destination. One unknown city no longer sinks the rest:
 * the ones that resolve come back, the misses are named.
 */
export async function fetchAllWeather(cities: string[]): Promise<{ weather: WeatherData[]; missed: string[] }> {
  const results = await Promise.allSettled(cities.map(fetchWeather));
  const weather: WeatherData[] = [];
  const missed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') weather.push(r.value);
    else missed.push(cities[i]);
  });
  return { weather, missed };
}
