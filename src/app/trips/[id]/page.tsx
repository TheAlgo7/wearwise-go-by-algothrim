'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Check, FileText, Loader2, Luggage, MoreHorizontal, Plug, RefreshCw, RotateCcw,
  Shirt, Sparkles, Sunrise, Trash2, TriangleAlert,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUISheet } from '@/components/oneui';
import { PackingGroup } from '@/components/packing/PackingGroup';
import { ItemSheet, type ItemPatch } from '@/components/packing/ItemSheet';
import { cn } from '@/lib/cn';
import { placeNames, tripTiming, weatherIcon } from '@/lib/trip-time';
import { TRANSPORT_LABELS } from '@/lib/constants';
import type { Trip, PackingItem, PackingCategory } from '@/types';

type View = 'todo' | 'packed';

const GROUP_ICONS: Record<PackingCategory, React.ElementType> = {
  clothing: Shirt,
  grooming: Sparkles,
  electronics: Plug,
  documents: FileText,
  misc: Luggage,
};

const GROUP_TITLES: Record<PackingCategory, string> = {
  clothing: 'Clothing',
  grooming: 'Grooming',
  electronics: 'Electronics',
  documents: 'Documents',
  misc: 'Other',
};

/**
 * The packing screen. The checklist is the hero; everything above it is one
 * compact block of status.
 *
 * What changed, and why:
 * - The list builds itself. A new trip used to open on an empty page and a
 *   "Build packing kit" card he had to find.
 * - "To pack" hides what is in the bag, so the list gets shorter as the bag
 *   fills, which is the whole feeling of packing.
 * - Pack last is its own group, and it moves to the top on the day he leaves.
 * - Rebuild merges instead of wiping (see /api/pack), and lives in the menu.
 * - The AI note is three short lines under the progress, not a paragraph wall
 *   above the list.
 */
export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<string[] | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [view, setView] = useState<View>('todo');
  const [editing, setEditing] = useState<PackingItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const autoBuilt = useRef(false);
  /** Ticks mid slide-out, not yet written, so Undo can cancel them. */
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadTrip = useCallback(async () => {
    const { data: tripData, error: tripError } = await supabase.from('trips').select('*').eq('id', id).single();
    if (tripError && tripError.code !== 'PGRST116') {
      setError('Couldn’t load the trip. Check your connection and retry.');
      setLoading(false);
      return null;
    }
    if (!tripData) { router.replace('/'); return null; }
    const t = tripData as unknown as Trip;
    setTrip(t);
    document.title = `${t.name} · WearWise Go`;

    const { data: listData, error: listError } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('trip_id', id)
      // Tie-break on id: older lists were inserted in one statement with
      // identical timestamps, and without it their order shifted after a tick.
      .order('created_at')
      .order('id');

    if (listError) {
      setError('Couldn’t refresh the list. Retry in a moment.');
      setLoading(false);
      return null;
    }
    setError('');
    const rows = (listData ?? []) as PackingItem[];
    setItems(rows);
    setLoading(false);
    return { trip: t, rows };
  }, [id, supabase, router]);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.notes) && data.notes.length > 0) setNotes(data.notes);
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  const build = useCallback(async () => {
    setBuilding(true);
    setError('');
    try {
      const res = await fetch('/api/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Could not build the list');
      await loadTrip();
      if (Array.isArray(data.missed) && data.missed.length > 0) {
        setToast({ text: `No weather for ${data.missed.map((c: string) => c.split(',')[0]).join(', ')}` });
      } else if (typeof data.added === 'number' && typeof data.kept === 'number' && data.kept > 0) {
        setToast({ text: data.added > 0 ? `Added ${data.added}, kept your ${data.kept}` : 'Nothing new to add' });
      }
      void fetchNotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the list');
    } finally {
      setBuilding(false);
    }
  }, [id, loadTrip, fetchNotes]);

  // Load once; a trip with no list builds its own, no button to find.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadTrip();
      if (cancelled || !loaded) return;
      const stored = loaded.trip.packing_reasoning?.split('\n').map((l) => l.trim()).filter(Boolean) ?? [];
      if (stored.length > 0) setNotes(stored.slice(0, 3));
      // Not for a trip already over: it would pack for today's weather.
      if (loaded.rows.length === 0 && !autoBuilt.current && tripTiming(loaded.trip).phase !== 'past') {
        autoBuilt.current = true;
        void build();
      }
    })();
    return () => { cancelled = true; };
  }, [loadTrip, build]);

  // ── Mutations ──
  const setPacked = useCallback(async (item: PackingItem, packed: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, packed } : i)));
    const { error: e } = await supabase.from('packing_lists').update({ packed }).eq('id', item.id);
    if (e) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, packed: !packed } : i)));
      setToast({ text: 'Couldn’t save that tick' });
    }
  }, [supabase]);

  const toggle = useCallback((item: PackingItem) => {
    if (view === 'todo' && !item.packed) {
      if (pending.current.has(item.id)) return; // already on its way out
      // Let the row settle out before it leaves the list.
      setLeaving((prev) => new Set(prev).add(item.id));
      const stopLeaving = () =>
        setLeaving((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
      pending.current.set(item.id, setTimeout(() => {
        pending.current.delete(item.id);
        void setPacked(item, true);
        stopLeaving();
      }, 240));
      setToast({
        text: `Packed ${item.name}`,
        // An Undo inside the slide-out must cancel the write that has not
        // happened yet, or it lands afterwards and re-packs the item.
        undo: () => {
          const t = pending.current.get(item.id);
          if (t) {
            clearTimeout(t);
            pending.current.delete(item.id);
            stopLeaving();
          } else {
            void setPacked(item, false);
          }
        },
      });
      return;
    }
    void setPacked(item, !item.packed);
  }, [view, setPacked]);

  const addItem = useCallback(async (name: string, category: PackingCategory, opts: { critical?: boolean; last?: boolean } = {}) => {
    const row = {
      trip_id: id,
      category,
      name,
      quantity: 1,
      packed: false,
      is_clothing: category === 'clothing',
      priority: opts.critical ? 'critical' : 'normal',
      notes: null,
      destination_label: null,
      pack_last: opts.last ?? false,
      source: 'user',
    };
    const { data, error: e } = await supabase.from('packing_lists').insert(row as never).select().single();
    if (e || !data) { setToast({ text: 'Couldn’t add that' }); throw e ?? new Error('insert failed'); }
    setItems((prev) => [...prev, data as unknown as PackingItem]);
  }, [id, supabase]);

  const saveItem = useCallback(async (item: PackingItem, patch: ItemPatch) => {
    const { error: e } = await supabase
      .from('packing_lists')
      .update({ ...patch, is_clothing: patch.category === 'clothing' })
      .eq('id', item.id);
    if (e) throw new Error(e.message);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
  }, [supabase]);

  const removeItem = useCallback(async (item: PackingItem) => {
    // His own additions are deleted; a suggestion is hidden, so a rebuild
    // sees the name and does not bring it back.
    const { error: e } = (item.source ?? 'engine') === 'user'
      ? await supabase.from('packing_lists').delete().eq('id', item.id)
      : await supabase.from('packing_lists').update({ dismissed: true }).eq('id', item.id);
    if (e) throw new Error(e.message);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setToast({ text: `Removed ${item.name}` });
  }, [supabase]);

  const deleteTrip = useCallback(async () => {
    await supabase.from('trips').delete().eq('id', id);
    router.push('/');
  }, [id, router, supabase]);

  // ── Derived ──
  const visible = useMemo(() => items.filter((i) => !i.dismissed), [items]);
  const packedCount = visible.filter((i) => i.packed).length;
  const total = visible.length;
  const shown = visible.filter((i) => (view === 'todo' ? !i.packed || leaving.has(i.id) : i.packed));

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-400" aria-label="Loading trip" />
      </div>
    );
  }
  if (!trip) {
    return error ? (
      <div className="px-4 pt-16">
        <ErrorBanner message={error} onRetry={() => void loadTrip()} />
      </div>
    ) : null;
  }

  const timing = tripTiming(trip);
  const singleStop = trip.destinations.length <= 1;
  const leavingSoon = timing.phase === 'today' || timing.phase === 'tomorrow';
  const pct = total > 0 ? Math.round((packedCount / total) * 100) : 0;

  const lastItems = shown.filter((i) => i.pack_last);
  const lastGroup = (
    <PackingGroup
      key="last"
      id="last"
      title="Pack last"
      hint="Still in use until the morning you leave"
      icon={<Sunrise size={15} aria-hidden className="text-fog-300" />}
      items={lastItems}
      leaving={leaving}
      onToggle={toggle}
      onOpen={setEditing} singleStop={singleStop}
      onAdd={view === 'todo' ? (n) => addItem(n, 'grooming', { last: true }) : undefined}
      addLabel="Add something for the morning"
    />
  );

  const categories: PackingCategory[] = ['clothing', 'grooming', 'electronics', 'documents', 'misc'];

  return (
    <>
      <header className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to trips"
            className="press -ml-1 flex h-11 w-11 items-center justify-center rounded-full text-fog-200 transition-colors hover:bg-white/[0.06]"
          >
            <ArrowLeft size={21} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Trip options"
            aria-haspopup="dialog"
            className="press -mr-1 flex h-11 w-11 items-center justify-center rounded-full text-fog-200 transition-colors hover:bg-white/[0.06]"
          >
            <MoreHorizontal size={21} aria-hidden />
          </button>
        </div>

        <h1 className="mt-2 px-1 text-[28px] font-semibold leading-[1.15] tracking-tight text-fog-100 text-balance">{trip.name}</h1>
        <p className="mt-1 px-1 text-[14px] text-fog-300">
          {/* The state the weather came from, so a wrong match ("Manali" in
              Tamil Nadu) is visible rather than silently packed for. Skipped
              when the state has the place's own name, so Goa is not "Goa, Goa". */}
          {placeNames(trip)}
          {singleStop && trip.weather?.[0]?.region && trip.weather[0].region.toLowerCase() !== placeNames(trip).toLowerCase()
            ? `, ${trip.weather[0].region}` : ''}
          {' · '}{timing.nights} night{timing.nights !== 1 ? 's' : ''} · {TRANSPORT_LABELS[trip.transport]}
          {trip.is_work ? ' · Work' : ''}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 px-1">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-semibold',
              leavingSoon ? 'bg-amber-500/[0.14] text-amber-300' : 'bg-white/[0.06] text-fog-200',
            )}
          >
            {timing.phase === 'upcoming' ? `Leaving ${timing.label}` : timing.phase === 'tomorrow' ? 'Leaving tomorrow' : timing.phase === 'today' ? 'Leaving today' : timing.label}
          </span>
          {(trip.weather ?? []).map((w) => {
            const Icon = weatherIcon(w.description);
            return (
              <span key={w.city} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[13px] text-fog-200">
                <Icon size={14} aria-hidden className="text-fog-300" />
                <span className="font-semibold tabular-nums text-fog-100">{w.tempC}°</span>
                {(trip.weather ?? []).length > 1 ? w.city : <span className="capitalize text-fog-300">{w.description}</span>}
              </span>
            );
          })}
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-8">
        {error && <ErrorBanner message={error} onRetry={() => void (items.length === 0 ? build() : loadTrip())} />}

        {timing.phase === 'past' && total === 0 && !building ? (
          <PastTrip trip={trip} />
        ) : building && total === 0 ? (
          <BuildingState />
        ) : total > 0 ? (
          <>
            {/* Progress + notes: one compact status block. */}
            <section aria-label="Packing progress" className="go-card p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-semibold tabular-nums text-fog-100">
                  {packedCount} <span className="font-medium text-fog-400">of {total} packed</span>
                </span>
                {building && (
                  <span className="flex items-center gap-1.5 text-[12px] font-medium text-fog-400">
                    <Loader2 size={12} className="animate-spin" aria-hidden /> Rebuilding
                  </span>
                )}
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-ink-400"
                role="progressbar"
                aria-label="Packing progress"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full rounded-full bg-blue-400 transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </div>

              {(notes || notesLoading) && (
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-blue-300">
                    <Sparkles size={13} aria-hidden /> Notes from Go
                  </p>
                  {notes ? (
                    <ul className="space-y-1.5">
                      {notes.map((n) => (
                        <li key={n} className="text-[14px] leading-[1.45] text-fog-200 text-pretty">{n}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2" aria-label="Writing notes">
                      <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-white/[0.06]" />
                      <div className="h-3.5 w-8/12 animate-pulse rounded-full bg-white/[0.06]" />
                    </div>
                  )}
                </div>
              )}
            </section>

            <div role="tablist" aria-label="Which items" className="seg grid-cols-2">
              <button role="tab" type="button" aria-selected={view === 'todo'} onClick={() => setView('todo')} className="seg-item">
                To pack <span className="tabular-nums text-fog-400">{total - packedCount}</span>
              </button>
              <button role="tab" type="button" aria-selected={view === 'packed'} onClick={() => setView('packed')} className="seg-item">
                Packed <span className="tabular-nums text-fog-400">{packedCount}</span>
              </button>
            </div>

            {view === 'todo' && total - packedCount === 0 ? (
              <AllPacked total={total} />
            ) : view === 'packed' && packedCount === 0 ? (
              <p className="px-1 py-8 text-center text-[14px] text-fog-400">Nothing in the bag yet. Tick things off in To pack.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {leavingSoon && lastGroup}

                <PackingGroup
                  id="critical"
                  title="Don’t forget"
                  tone="critical"
                  icon={<TriangleAlert size={15} aria-hidden />}
                  items={shown.filter((i) => i.priority === 'critical' && !i.pack_last)}
                  leaving={leaving}
                  onToggle={toggle}
                  onOpen={setEditing} singleStop={singleStop}
                />

                {categories.map((cat) => {
                  const Icon = GROUP_ICONS[cat];
                  return (
                    <PackingGroup
                      key={cat}
                      id={cat}
                      title={GROUP_TITLES[cat]}
                      icon={<Icon size={15} aria-hidden className="text-fog-300" />}
                      items={shown.filter((i) => i.category === cat && i.priority !== 'critical' && !i.pack_last)}
                      leaving={leaving}
                      onToggle={toggle}
                      onOpen={setEditing} singleStop={singleStop}
                      onAdd={view === 'todo' ? (n) => addItem(n, cat) : undefined}
                      showEmpty={view === 'todo' && cat === 'misc'}
                    />
                  );
                })}

                {!leavingSoon && lastGroup}
              </div>
            )}
          </>
        ) : !building && !error ? (
          <BuildingState />
        ) : null}
      </div>

      <ItemSheet item={editing} onClose={() => setEditing(null)} onSave={saveItem} onRemove={removeItem} />

      <TripMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tripId={trip.id}
        tripName={trip.name}
        past={timing.phase === 'past'}
        hasList={total > 0}
        building={building}
        onRebuild={() => { setMenuOpen(false); void build(); }}
        onDelete={deleteTrip}
      />

      {toast && (
        <div
          role="status"
          className="animate-slide-up fixed inset-x-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-full border border-white/[0.08] bg-ink-300 py-1.5 pl-5 pr-1.5 shadow-oneui-raised"
          style={{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }}
        >
          <Check size={16} className="shrink-0 text-blue-300" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-fog-100">{toast.text}</span>
          {toast.undo ? (
            <button
              type="button"
              onClick={() => { toast.undo?.(); setToast(null); }}
              className="press min-h-[44px] shrink-0 rounded-full px-4 text-[14px] font-semibold text-blue-200 transition-colors hover:bg-white/[0.06]"
            >
              Undo
            </button>
          ) : (
            <span className="h-[44px]" aria-hidden />
          )}
        </div>
      )}
    </>
  );
}

function BuildingState() {
  return (
    <section aria-live="polite" className="go-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-400/[0.12]">
        <Loader2 size={24} className="animate-spin text-blue-300" aria-hidden />
      </span>
      <p className="text-[17px] font-semibold text-fog-100">Building your list</p>
      <p className="max-w-[30ch] text-[14px] leading-5 text-fog-400">Checking the weather, the route and your wardrobe.</p>
    </section>
  );
}

/**
 * A trip that is over and never had a list: one he went on before Go, added
 * from his photos. What the photos showed, and a way to go again.
 */
function PastTrip({ trip }: { trip: Trip }) {
  const lines = trip.packing_reasoning?.split('\n').map((l) => l.trim()).filter(Boolean) ?? [];
  return (
    <section className="flex flex-col gap-5">
      {lines.length > 0 && (
        <div>
          <h2 className="section-title mb-2 px-1">From your photos</h2>
          <ul className="group-list divide-y divide-white/[0.06]" role="list">
            {lines.map((l) => (
              <li key={l} className="px-4 py-3 text-[15px] leading-[1.45] text-fog-200 text-pretty">{l}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="px-1 text-[14px] leading-5 text-fog-400">
        No list was kept for this one. Going again? Go builds it for the new dates.
      </p>
      <Link
        href={`/trips/new?from=${trip.id}`}
        className="press flex h-14 w-full items-center justify-center gap-2 rounded-full bg-blue-400 text-[16px] font-semibold text-ink-0 transition-colors hover:bg-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0"
      >
        <RotateCcw size={18} aria-hidden />
        Plan it again
      </Link>
    </section>
  );
}

function AllPacked({ total }: { total: number }) {
  return (
    <section aria-live="polite" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="animate-scale-in flex h-16 w-16 items-center justify-center rounded-full bg-blue-400 text-ink-0">
        <Check size={30} strokeWidth={2.6} aria-hidden />
      </span>
      <p className="text-[20px] font-semibold text-fog-100">Everything’s in the bag.</p>
      <p className="text-[14px] text-fog-400">All {total} things packed. Have a good trip.</p>
    </section>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-[1.25rem] bg-red-400/10 px-4 py-2">
      <p className="flex-1 text-[14px] text-red-300">{message}</p>
      <button type="button" onClick={onRetry} className="press min-h-[44px] shrink-0 px-2 text-[14px] font-semibold text-red-200">
        Retry
      </button>
    </div>
  );
}

function TripMenu({
  open, onClose, tripId, tripName, past, hasList, building, onRebuild, onDelete,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  past: boolean;
  hasList: boolean;
  building: boolean;
  onRebuild: () => void;
  onDelete: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <OneUISheet open={open} onClose={() => { setConfirm(false); onClose(); }} title="Trip options">
      <ul className="group-list divide-y divide-white/[0.06]" role="list">
        {/* Today's weather means nothing to a trip that is over. */}
        {!past && (
          <li>
            <MenuRow
              icon={<RefreshCw size={18} aria-hidden />}
              title="Rebuild the list"
              detail="Adds what today’s weather and route call for. Your ticks, notes and own items stay."
              onClick={onRebuild}
              disabled={building}
            />
          </li>
        )}
        <li>
          <Link
            href={`/trips/new?from=${tripId}`}
            className="press flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="text-fog-300"><RotateCcw size={18} aria-hidden /></span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-fog-100">Pack like this again</span>
              <span className="block text-[12px] leading-4 text-fog-400">
                {hasList ? 'A new trip that starts from this list, all unticked' : 'Same places and nights, new dates'}
              </span>
            </span>
          </Link>
        </li>
        <li>
          <MenuRow
            icon={<Trash2 size={18} aria-hidden />}
            title={confirm ? `Tap again to delete ${tripName}` : 'Delete trip'}
            detail={confirm ? 'The trip and its list go for good.' : undefined}
            danger
            onClick={() => (confirm ? void onDelete() : setConfirm(true))}
          />
        </li>
      </ul>
    </OneUISheet>
  );
}

function MenuRow({
  icon, title, detail, onClick, danger, disabled,
}: { icon: React.ReactNode; title: string; detail?: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-50"
    >
      <span className={danger ? 'text-red-300' : 'text-fog-300'}>{icon}</span>
      <span className="min-w-0">
        <span className={cn('block text-[15px] font-semibold', danger ? 'text-red-300' : 'text-fog-100')}>{title}</span>
        {detail && <span className="block text-[12px] leading-4 text-fog-400">{detail}</span>}
      </span>
    </button>
  );
}
