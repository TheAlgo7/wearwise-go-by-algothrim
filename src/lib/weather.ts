export interface WeatherData {
  city: string;
  country: string;
  tempC: number;
  feelsLikeC: number;
  description: string;
  humidity: number;
  windKph: number;
  icon: string;
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error('OPENWEATHER_API_KEY not set');

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;
  const res = await fetch(url, { next: { revalidate: 1800 } });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenWeather error ${res.status}: ${text}`);
  }

  const data = await res.json();

  return {
    city:        data.name,
    country:     data.sys.country,
    tempC:       Math.round(data.main.temp),
    feelsLikeC:  Math.round(data.main.feels_like),
    description: data.weather[0].description,
    humidity:    data.main.humidity,
    windKph:     Math.round(data.wind.speed * 3.6),
    icon:        data.weather[0].icon,
  };
}
