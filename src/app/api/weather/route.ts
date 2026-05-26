import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/weather';

export async function GET(req: NextRequest) {
  const cities = req.nextUrl.searchParams.get('cities');
  if (!cities) {
    return NextResponse.json({ error: 'cities param required' }, { status: 400 });
  }

  const cityList = cities.split('|').map(c => c.trim()).filter(Boolean);
  if (cityList.length === 0) {
    return NextResponse.json({ error: 'no valid cities' }, { status: 400 });
  }

  try {
    const results = await Promise.all(cityList.map(fetchWeather));
    return NextResponse.json({ weather: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
