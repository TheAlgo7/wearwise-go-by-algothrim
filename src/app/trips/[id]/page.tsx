'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Trash2, MapPin, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUIHeader, OneUIButton } from '@/components/oneui';
import { PackingSection } from '@/components/PackingSection';
import { CriticalSection } from '@/components/CriticalSection';
import { CATEGORY_ORDER, URGENCY_DAYS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Trip, PackingItem, PackingCategory, DestinationWeather } from '@/types';

type NormalCategory = Exclude<(typeof CATEGORY_ORDER)[number], 'critical'>;

export default function TripDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [trip,      setTrip]      = useState<Trip | null>(null);
  const [items,     setItems]     = useState<PackingItem[]>([]);
  const [weather,   setWeather]   = useState<DestinationWeather[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [packing,   setPacking]   = useState(false);
  const [error,     setError]     = useState('');

  const loadTrip = useCallback(async () => {
    setLoading(true);
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (!tripData) { router.replace('/'); return; }
    setTrip(tripData as unknown as Trip);

    const { data: listData } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('trip_id', id)
      .order('category');

    setItems((listData ?? []) as PackingItem[]);
    setLoading(false);
  }, [id, supabase, router]);

  useEffect(() => { loadTrip(); }, [loadTrip]);

  const generateList = async () => {
    if (!trip || packing) return;
    setPacking(true);
    setError('');

    try {
      const cities = trip.destinations.map(d => d.city).join(',');
      const wRes   = await fetch(`/api/weather?cities=${encodeURIComponent(cities)}`);
      const wData  = await wRes.json();
      const weatherData: DestinationWeather[] = wData.weather ?? [];
      setWeather(weatherData);

      await supabase.from('packing_lists').delete().eq('trip_id', id);

      const pRes = await fetch('/api/pack', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ trip, weather: weatherData }),
      });

      if (!pRes.ok) throw new Error('Pack API failed');
      const pData = await pRes.json();

      setReasoning(pData.packingList.reasoning ?? '');
      await loadTrip();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setPacking(false);
    }
  };

  const toggleItem = async (itemId: string, packed: boolean) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, packed } : i));
    await supabase.from('packing_lists').update({ packed }).eq('id', itemId);
  };

  const deleteTrip = async () => {
    if (!confirm(`Delete "${trip?.name}"? This cannot be undone.`)) return;
    await supabase.from('trips').delete().eq('id', id);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!trip) return null;

  const departure   = new Date(trip.departure + 'T00:00:00');
  const daysUntil   = Math.ceil((departure.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent    = daysUntil <= URGENCY_DAYS && daysUntil >= 0;
  const cityNames   = trip.destinations.map(d => d.city.split(',')[0]).join(' → ');

  const criticalItems = items.filter(i => i.priority === 'critical');
  const normalItems   = items.filter(i => i.priority !== 'critical');

  const normalCategories = CATEGORY_ORDER.filter((c): c is NormalCategory => c !== 'critical');
  const byCategory = normalCategories.reduce<Record<NormalCategory, PackingItem[]>>(
    (acc, cat) => {
      acc[cat] = normalItems.filter(i => i.category === cat);
      return acc;
    },
    { clothing: [], grooming: [], electronics: [], documents: [], misc: [] },
  );

  const totalCount  = items.length;
  const packedCount = items.filter(i => i.packed).length;

  return (
    <>
      <OneUIHeader
        title={trip.name}
        subtitle={cityNames}
        left={
          <Link
            href="/"
            aria-label="Back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-fog-300" aria-hidden="true" />
          </Link>
        }
        right={
          <button
            onClick={deleteTrip}
            aria-label="Delete trip"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink-200 transition-colors text-fog-600 hover:text-red-400"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        }
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* Urgency banner */}
        {isUrgent && (
          <div
            role="alert"
            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-oneui-lg px-4 py-3"
          >
            <Zap size={16} className="text-amber-400 shrink-0" aria-hidden="true" />
            <p className="text-sm font-semibold text-amber-400">
              {daysUntil === 0 ? "Leaving today — pack now!" : "Leaving tomorrow — pack tonight!"}
            </p>
          </div>
        )}

        {/* Trip metadata */}
        <div className="bg-ink-100 rounded-oneui-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-fog-400">
            <MapPin size={14} className="text-blue-400" aria-hidden="true" />
            {trip.destinations.length} destination{trip.destinations.length !== 1 ? 's' : ''}
            <span className="text-fog-700">·</span>
            {trip.destinations.reduce((s, d) => s + d.nights, 0)} nights
            {trip.is_work && (
              <>
                <span className="text-fog-700">·</span>
                <span className="text-blue-400/80 text-xs font-medium">Work</span>
              </>
            )}
          </div>
          <span className={cn('text-sm font-medium', daysUntil <= 3 && daysUntil > 0 ? 'text-amber-400' : 'text-fog-500')}>
            {daysUntil === 0 ? 'Today' : daysUntil < 0 ? 'Departed' : `${daysUntil}d away`}
          </span>
        </div>

        {/* Weather summary */}
        {weather.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {weather.map(w => (
              <div key={w.city} className="shrink-0 bg-ink-100 rounded-oneui px-3 py-2 text-center min-w-[96px]">
                <p className="text-xs text-fog-600 truncate">{w.city}</p>
                <p className="text-lg font-semibold text-blue-400">{w.tempC}°C</p>
                <p className="text-[10px] text-fog-700 capitalize truncate">{w.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Generate button */}
        <OneUIButton
          onClick={generateList}
          loading={packing}
          size="lg"
          className="w-full"
          aria-busy={packing}
        >
          <Sparkles size={18} aria-hidden="true" />
          {items.length > 0 ? 'Regenerate packing list' : 'Generate packing list'}
        </OneUIButton>

        {error && (
          <p role="alert" className="text-sm text-red-400 bg-red-400/10 rounded-oneui-sm px-3 py-2">
            {error}
          </p>
        )}

        {/* AI reasoning */}
        {reasoning && (
          <div className="bg-blue-400/[0.08] border border-blue-400/20 rounded-oneui-lg px-4 py-3">
            <p className="text-xs font-semibold text-blue-400 mb-1">Packing intelligence</p>
            <p className="text-sm text-fog-300 leading-relaxed">{reasoning}</p>
          </div>
        )}

        {/* Progress */}
        {totalCount > 0 && (
          <div className="bg-ink-100 rounded-oneui-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-fog-400">{packedCount} of {totalCount} packed</span>
              {packedCount === totalCount && (
                <span className="text-sm font-semibold text-blue-400">All packed!</span>
              )}
            </div>
            <div
              className="h-1.5 bg-ink-300 rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Packing progress"
              aria-valuenow={Math.round((packedCount / totalCount) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-blue-400 rounded-full transition-[width] duration-500"
                style={{ width: `${(packedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Packing sections */}
        {totalCount > 0 && (
          <div className="space-y-3">
            {/* Critical "Don't forget" always first */}
            <CriticalSection items={criticalItems} onToggle={toggleItem} />

            {normalCategories.map(cat => {
              const catItems = byCategory[cat];
              if (catItems.length === 0) return null;
              return (
                <PackingSection
                  key={cat}
                  category={cat}
                  items={catItems}
                  onToggle={toggleItem}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
