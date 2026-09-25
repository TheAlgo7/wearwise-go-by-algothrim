import { NextRequest, NextResponse } from 'next/server';
import { fetchAllWeather } from '@/lib/weather';

export async function GET(req: NextRequest) {
  const cities = req.nextUrl.searchParams.get('cities');
  if (!cities) {
    return NextResponse.json({ error: 'cities param required' }, { status: 400 });
  }

  const cityList = cities.split('|').map(c => c.trim()).filter(Boolean);
  if (cityList.length === 0) {
    return NextResponse.json({ error: 'no valid cities' }, { status: 400 });
  }

  const { weather, missed } = await fetchAllWeather(cityList);
  if (weather.length === 0) {
    return NextResponse.json({ error: `No weather for ${missed.join(', ')}`, missed }, { status: 502 });
  }
  return NextResponse.json({ weather, missed });
}
