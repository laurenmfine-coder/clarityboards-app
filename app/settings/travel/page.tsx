"use client";
/**
 * Clarityboards — TravelBoard
 * File: app/settings/travel/page.tsx
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Trip {
  id: string; title: string; destination: string;
  start_date: string | null; end_date: string | null;
  cover_image: string | null; status: TripStatus;
  budget: number | null; notes: string | null;
}
interface PlaceCard {
  id: string; trip_id: string; title: string;
  category: PlaceCategory; address: string | null;
  url: string | null; cover_image: string | null;
  notes: string | null; day_number: number | null;
  visit_time: string | null; status: PlaceStatus;
  source: string | null;
}
interface PackingItem {
  id: string; trip_id: string; label: string;
  category: string; packed: boolean;
}

type TripStatus = 'want-to-go' | 'planning' | 'booked' | 'done';
type PlaceCategory = 'restaurant' | 'hotel' | 'activity' | 'transport' | 'place' | 'other';
type PlaceStatus = 'want-to-go' | 'booked' | 'done' | 'skipped';

const T = {
  cream: '#FAF9F7', ivory: '#FFFEF9', sand: '#F2EDE6',
  border: '#EDE9E3', muted: '#C8B8A8', sub: '#9C8B7A',
  ink: '#2C2318', teal: '#2C6E8A', tealLight: '#EAF4F8',
  serif: "'Cormorant Garamond',Georgia,serif",
  sans: "'DM Sans',system-ui,sans-serif",
};

const CAT_ICONS: Record<PlaceCategory, string> = {
  restaurant: '🍽️', hotel: '🏨', activity: '🎭',
  transport: '🚌', place: '📍', other: '✦',
};
const PLACE_STATUS: Record<PlaceStatus, { bg: string; text: string; label: string }> = {
  'want-to-go': { bg: '#EAF4F8', text: '#2C6E8A', label: 'Want to Go' },
  'booked':     { bg: '#D5F0E0', text: '#1E6B40', label: 'Booked' },
  'done':       { bg: '#EAEDED', text: '#717D7E', label: 'Been There' },
  'skipped':    { bg: '#F2EDE6', text: '#9C8B7A', label: 'Skipped' },
};
const TRIP_STATUS: Record<TripStatus, { bg: string; text: string; label: string }> = {
  'want-to-go': { bg: '#EAF4F8', text: '#2C6E8A', label: 'Dream Trip' },
  'planning':   { bg: '#FEF3CD', text: '#8B6914', label: 'Planning' },
  'booked':     { bg: '#D5F0E0', text: '#1E6B40', label: 'Booked ✓' },
  'done':       { bg: '#EAEDED', text: '#717D7E', label: 'Travelled' },
};
const PACK_CATS = ['clothing','toiletries','documents','electronics','health','other'];
const PACK_ICONS: Record<string,string> = { clothing:'👗', toiletries:'🧴', documents:'📄', electronics:'🔌', health:'💊', other:'📦' };

function fmtDate(d: string | null) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function tripDays(start: string | null, end: string | null) {
  if (!start || !end) return null;
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

export default function TravelBoardPage() {
  const router = useRouter();
  const [trips, setTrips]           = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [places, setPlaces]         = useState<PlaceCard[]>([]);
  const [packing, setPacking]       = useState<PackingItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<'trips'|'itinerary'|'packing'|'budget'>('trips');
  const [showAddTrip, setShowAddTrip]   = useState(false);
  const [addPlaceDay, setAddPlaceDay]   = useState<number | null | undefined>(undefined);
  const [detailPlace, setDetailPlace]   = useState<PlaceCard | null>(null);

  useEffect(() => { loadTrips(); }, []);

  const headers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' };
  };

  const loadTrips = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase.from('trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setTrips(data as Trip[]);
    setLoading(false);
  };

  const openTrip = async (trip: Trip) => {
    setActiveTrip(trip); setView('itinerary');
    const h = await headers();
    const [pr, pkr] = await Promise.all([
      fetch(`/api/travel?action=places&tripId=${trip.id}`, { headers: h }),
      fetch(`/api/travel?action=packing&tripId=${trip.id}`, { headers: h }),
    ]);
    const pd = await pr.json(); const pkd = await pkr.json();
    setPlaces(pd.places ?? []); setPacking(pkd.items ?? []);
  };

  const api = async (method: string, path: string, body?: object) => {
    const h = await headers();
    return fetch(path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  };

  const createTrip = async (t: Partial<Trip>) => {
    const r = await api('POST', '/api/travel?action=trip', t);
    const d = await r.json();
    if (d.trip) { setTrips(prev => [d.trip, ...prev]); setShowAddTrip(false); }
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    await api('PATCH', `/api/travel?action=trip&id=${id}`, updates);
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (activeTrip?.id === id) setActiveTrip(prev => prev ? { ...prev, ...updates } : prev);
  };

  const deleteTrip = async (id: string) => {
    await api('DELETE', `/api/travel?action=trip&id=${id}`);
    setTrips(prev => prev.filter(t => t.id !== id));
    setActiveTrip(null); setView('trips');
  };

  const addPlace = async (p: Partial<PlaceCard>) => {
    const r = await api('POST', '/api/travel?action=place', { ...p, trip_id: activeTrip?.id });
    const d = await r.json();
    if (d.place) setPlaces(prev => [...prev, d.place]);
    setAddPlaceDay(undefined);
  };

  const updatePlace = async (id: string, u: Partial<PlaceCard>) => {
    await api('PATCH', `/api/travel?action=place&id=${id}`, u);
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...u } : p));
    if (detailPlace?.id === id) setDetailPlace(prev => prev ? { ...prev, ...u } : prev);
  };

  const deletePlace = async (id: string) => {
    await api('DELETE', `/api/travel?action=place&id=${id}`);
    setPlaces(prev => prev.filter(p => p.id !== id));
    setDetailPlace(null);
  };

  const togglePacked = async (item: PackingItem) => {
    await api('PATCH', `/api/travel?action=packing&id=${item.id}`, { packed: !item.packed });
    setPacking(prev => prev.map(p => p.id === item.id ? { ...p, packed: !p.packed } : p));
  };

  const addPackingItem = async (label: string, category: string) => {
    const r = await api('POST', '/api/travel?action=packing', { trip_id: activeTrip?.id, label, category });
    const d = await r.json();
    if (d.item) setPacking(prev => [...prev, d.item]);
  };

  const dur = tripDays(activeTrip?.start_date ?? null, activeTrip?.end_date ?? null);
  const days = dur ? Array.from({ length: dur }, (_, i) => i + 1) : [1, 2, 3];
  const placesForDay = (day: number) => places.filter(p => p.day_number === day);
  const unscheduled = places.filter(p => !p.day_number);

  return (
    <div style={{ fontFamily: T.sans, minHeight: '100vh', background: T.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        * { box-sizing: border-box; }
        .pc:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(44,35,24,0.12) !important; }
        .tc:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(44,35,24,0.14) !important; }
        .add-slot:hover { background: #EAF4F8 !important; border-color: #2C6E8A !important; color: #2C6E8A !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ background: T.ink, padding: '0 20px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { if (activeTrip) { setActiveTrip(null); setView('trips'); } else { router.push('/dashboard'); }}}
            style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: T.sans }}>
            ← {activeTrip ? 'All Trips' : 'Dashboard'}
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ fontFamily: T.serif, color: 'white', fontSize: 19, fontWeight: 500 }}>
            ✈️ {activeTrip ? activeTrip.title : 'TravelBoard'}
          </span>
          {activeTrip && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 3 }}>
              {[['itinerary','Itinerary'],['packing','Packing'],['budget','Budget']].map(([v,l]) => (
                <button key={v} onClick={() => setView(v as any)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: T.sans, background: view === v ? T.ivory : 'transparent', color: view === v ? T.ink : 'rgba(255,255,255,0.55)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}
          {!activeTrip && (
            <button onClick={() => setShowAddTrip(true)} style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 20, border: 'none', background: T.teal, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: T.sans }}>
              + New Trip
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 100px' }}>

        {/* Trip list */}
        {!activeTrip && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: T.serif, fontSize: 22, color: T.sub, fontStyle: 'italic' }}>Loading…</div>
            ) : trips.length === 0 ? (
              <EmptyTrips onAdd={() => setShowAddTrip(true)} />
            ) : (
              <>
                <div style={{ fontFamily: T.serif, fontSize: 32, color: T.ink, fontWeight: 500, marginBottom: 6 }}>Your Trips</div>
                <div style={{ fontSize: 13, color: T.sub, fontStyle: 'italic', marginBottom: 28 }}>{trips.length} {trips.length === 1 ? 'adventure' : 'adventures'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                  {trips.map(trip => <TripCard key={trip.id} trip={trip} onClick={() => openTrip(trip)} />)}
                  <div onClick={() => setShowAddTrip(true)} className="add-slot"
                    style={{ borderRadius: 16, border: `2px dashed ${T.border}`, background: T.ivory, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '40px 20px', minHeight: 200, transition: 'all 0.15s', color: T.muted }}>
                    <div style={{ fontSize: 32 }}>✈</div>
                    <div style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic' }}>Add a new trip</div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Itinerary */}
        {activeTrip && view === 'itinerary' && (
          <>
            <TripHero trip={activeTrip} onUpdate={u => updateTrip(activeTrip.id, u)} onDelete={() => deleteTrip(activeTrip.id)} />

            {/* CityWindow callout */}
            <div style={{ background: `linear-gradient(135deg, ${T.tealLight}, #D8EEF7)`, border: '1px solid #B8D8E8', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 24 }}>🗺️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.serif, fontSize: 16, color: T.ink, fontWeight: 500 }}>Import from CityWindow</div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>Paste any CityWindow place URL and the photo, address and category import automatically.</div>
              </div>
              <button onClick={() => setAddPlaceDay(null)}
                style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: T.teal, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: T.sans, flexShrink: 0 }}>
                + Add Place
              </button>
            </div>

            {/* Days */}
            {days.map(day => {
              const dp = placesForDay(day);
              const dayDate = activeTrip.start_date
                ? new Date(new Date(activeTrip.start_date + 'T00:00:00').getTime() + (day - 1) * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                : `Day ${day}`;
              return (
                <div key={day} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: T.serif, fontSize: 16, fontWeight: 600, flexShrink: 0 }}>{day}</div>
                    <div>
                      <div style={{ fontFamily: T.serif, fontSize: 18, color: T.ink, fontWeight: 500 }}>Day {day}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{dayDate}</div>
                    </div>
                    <button onClick={() => setAddPlaceDay(day)} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.ivory, color: T.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans }}>+ Add</button>
                  </div>
                  {dp.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                      {dp.map(p => <PlaceCardUI key={p.id} place={p} onClick={() => setDetailPlace(p)} />)}
                    </div>
                  ) : (
                    <div className="add-slot" onClick={() => setAddPlaceDay(day)}
                      style={{ border: `1.5px dashed ${T.border}`, borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', color: T.muted, fontSize: 13, fontStyle: 'italic', transition: 'all 0.15s' }}>
                      Nothing planned yet
                    </div>
                  )}
                </div>
              );
            })}

            {/* Wish list */}
            {unscheduled.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: T.serif, fontSize: 16, color: T.sub, fontStyle: 'italic', marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>Wish List — not yet scheduled</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                  {unscheduled.map(p => <PlaceCardUI key={p.id} place={p} onClick={() => setDetailPlace(p)} />)}
                </div>
              </div>
            )}
            <button className="add-slot" onClick={() => setAddPlaceDay(null)}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1.5px dashed ${T.border}`, background: 'transparent', color: T.sub, fontFamily: T.serif, fontSize: 15, fontStyle: 'italic', cursor: 'pointer', marginTop: 16, transition: 'all 0.15s' }}>
              + Add to wish list
            </button>
          </>
        )}

        {activeTrip && view === 'packing' && (
          <PackingView items={packing} onToggle={togglePacked} onAdd={addPackingItem} />
        )}
        {activeTrip && view === 'budget' && (
          <BudgetView trip={activeTrip} places={places} onUpdateBudget={b => updateTrip(activeTrip.id, { budget: b })} />
        )}
      </div>

      {showAddTrip && <AddTripModal onSave={createTrip} onClose={() => setShowAddTrip(false)} />}
      {addPlaceDay !== undefined && (
        <AddPlaceModal dayNumber={addPlaceDay ?? null} onSave={addPlace} onClose={() => setAddPlaceDay(undefined)} />
      )}
      {detailPlace && (
        <PlaceDetailModal place={detailPlace} days={days}
          onUpdate={u => updatePlace(detailPlace.id, u)}
          onDelete={() => deletePlace(detailPlace.id)}
          onClose={() => setDetailPlace(null)} />
      )}
    </div>
  );
}

function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const s = TRIP_STATUS[trip.status];
  const dur = tripDays(trip.start_date, trip.end_date);
  return (
    <div className="tc" onClick={onClick} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #EDE9E3', background: '#FFFEF9', cursor: 'pointer', boxShadow: '0 2px 10px rgba(44,35,24,0.07)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
      {trip.cover_image ? (
        <div style={{ height: 140, position: 'relative', overflow: 'hidden' }}>
          <img src={trip.cover_image} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(44,35,24,0.55))' }} />
          <div style={{ position: 'absolute', bottom: 10, left: 14, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, color: 'white', fontWeight: 600 }}>{trip.destination}</div>
        </div>
      ) : (
        <div style={{ height: 140, background: 'linear-gradient(135deg, #2C6E8A, #1A4F6A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 36 }}>✈️</div>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, color: 'white', fontWeight: 500 }}>{trip.destination}</div>
        </div>
      )}
      <div style={{ padding: '12px 16px 16px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, color: '#2C2318', fontWeight: 500, marginBottom: 6 }}>{trip.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.text }}>{s.label}</span>
          {trip.start_date && <span style={{ fontSize: 11, color: '#9C8B7A' }}>{fmtDate(trip.start_date)}</span>}
          {dur && <span style={{ fontSize: 11, color: '#9C8B7A' }}>· {dur}d</span>}
        </div>
      </div>
    </div>
  );
}

function TripHero({ trip, onUpdate, onDelete }: { trip: Trip; onUpdate: (u: Partial<Trip>) => void; onDelete: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const s = TRIP_STATUS[trip.status];
  const dur = tripDays(trip.start_date, trip.end_date);
  return (
    <div style={{ marginBottom: 24 }}>
      {trip.cover_image ? (
        <div style={{ height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 14 }}>
          <img src={trip.cover_image} alt={trip.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(44,35,24,0.65))' }} />
          <div style={{ position: 'absolute', bottom: 18, left: 22, right: 22 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, color: 'white', fontWeight: 600 }}>{trip.destination}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
              {trip.start_date && fmtDate(trip.start_date)}{trip.end_date && ` – ${fmtDate(trip.end_date)}`}{dur && ` · ${dur} days`}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'linear-gradient(135deg, #2C6E8A, #1A4F6A)', borderRadius: 16, padding: '24px', marginBottom: 14 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: 'white', fontWeight: 500 }}>{trip.destination}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            {trip.start_date && fmtDate(trip.start_date)}{trip.end_date && ` – ${fmtDate(trip.end_date)}`}{dur && ` · ${dur} days`}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.text }}>{s.label}</span>
        {trip.budget && <span style={{ fontSize: 12, color: '#9C8B7A' }}>Budget: ${trip.budget.toLocaleString()}</span>}
        <a href="/settings/watch" style={{ fontSize: 11, color: '#2C6E8A', fontWeight: 600, textDecoration: 'none', padding: '4px 10px', borderRadius: 20, border: '1px solid #B8D8E8', background: '#EAF4F8' }}>
          👁️ Watch prices
        </a>
        {confirmDel ? (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <button onClick={() => setConfirmDel(false)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid #EDE9E3', background: 'white', color: '#9C8B7A', cursor: 'pointer', fontFamily: "'DM Sans',system-ui" }}>Cancel</button>
            <button onClick={onDelete} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: 'none', background: '#C0392B', color: 'white', cursor: 'pointer', fontFamily: "'DM Sans',system-ui", fontWeight: 700 }}>Delete</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} style={{ marginLeft: 'auto', fontSize: 11, color: '#C8B8A8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',system-ui" }}>Delete trip</button>
        )}
      </div>
    </div>
  );
}

function PlaceCardUI({ place, onClick }: { place: PlaceCard; onClick: () => void }) {
  const s = PLACE_STATUS[place.status];
  return (
    <div className="pc" onClick={onClick} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #EDE9E3', background: '#FFFEF9', cursor: 'pointer', boxShadow: '0 1px 6px rgba(44,35,24,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
      {place.cover_image ? (
        <div style={{ height: 90, overflow: 'hidden', position: 'relative' }}>
          <img src={place.cover_image} alt={place.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
          <div style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#9C8B7A' }}>{CAT_ICONS[place.category]}</div>
        </div>
      ) : (
        <div style={{ height: 4, background: '#2C6E8A' }} />
      )}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#2C2318', lineHeight: 1.35, marginBottom: 6 }}>{place.title}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: s.bg, color: s.text }}>{s.label}</span>
          {place.visit_time && <span style={{ fontSize: 9, color: '#9C8B7A' }}>🕐 {place.visit_time}</span>}
        </div>
        {place.address && <div style={{ fontSize: 10, color: '#9C8B7A', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {place.address}</div>}
      </div>
    </div>
  );
}

function EmptyTrips({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✈️</div>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, color: '#2C2318', fontWeight: 500, marginBottom: 8 }}>Where to next?</div>
      <div style={{ fontSize: 14, color: '#9C8B7A', fontStyle: 'italic', marginBottom: 32, lineHeight: 1.7 }}>
        Plan trips day-by-day with restaurants, hotels and activities.<br />Import places directly from CityWindow.
      </div>
      <button onClick={onAdd} style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#2C2318', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans',system-ui" }}>
        Plan your first trip
      </button>
    </div>
  );
}

function AddTripModal({ onSave, onClose }: { onSave: (t: Partial<Trip>) => void; onClose: () => void }) {
  const [title, setTitle]   = useState('');
  const [dest, setDest]     = useState('');
  const [start, setStart]   = useState('');
  const [end, setEnd]       = useState('');
  const [status, setStatus] = useState<TripStatus>('planning');
  const [budget, setBudget] = useState('');
  const [cover, setCover]   = useState('');

  const tryFetchCover = () => {
    if (!dest.trim() || cover) return;
    // Unsplash source URL — free, no key, returns a relevant travel photo
    setCover(`https://source.unsplash.com/800x400/?${encodeURIComponent(dest)},travel`);
  };

  return (
    <Modal onClose={onClose} title="Plan a Trip">
      <Label>Status</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['want-to-go','planning','booked'] as TripStatus[]).map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',system-ui", background: status === s ? '#2C2318' : '#F2EDE6', color: status === s ? 'white' : '#9C8B7A' }}>
            {TRIP_STATUS[s].label}
          </button>
        ))}
      </div>
      <Label>Trip Name *</Label>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Paris Anniversary Trip" style={SI} />
      <Label>Destination *</Label>
      <input value={dest} onChange={e => setDest(e.target.value)} onBlur={tryFetchCover} placeholder="Paris, France" style={SI} />
      {cover && (
        <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 14, height: 110 }}>
          <img src={cover} alt={dest} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Label>Start</Label><input type="date" value={start} onChange={e => setStart(e.target.value)} style={SI} /></div>
        <div style={{ flex: 1 }}><Label>End</Label><input type="date" value={end} onChange={e => setEnd(e.target.value)} style={SI} /></div>
      </div>
      <Label>Budget (optional)</Label>
      <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="2500" style={{ ...SI, width: '50%' }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={GBtn}>Cancel</button>
        <button onClick={() => { if (!title.trim() || !dest.trim()) return; onSave({ title, destination: dest, start_date: start || null, end_date: end || null, status, budget: budget ? parseFloat(budget) : null, cover_image: cover || null }); }}
          disabled={!title.trim() || !dest.trim()}
          style={{ ...PBtn, flex: 2, opacity: (!title.trim() || !dest.trim()) ? 0.5 : 1, cursor: (!title.trim() || !dest.trim()) ? 'not-allowed' : 'pointer' }}>
          Create Trip
        </button>
      </div>
    </Modal>
  );
}

function AddPlaceModal({ dayNumber, onSave, onClose }: { dayNumber: number | null; onSave: (p: Partial<PlaceCard>) => void; onClose: () => void }) {
  const [title, setTitle]     = useState('');
  const [url, setUrl]         = useState('');
  const [address, setAddress] = useState('');
  const [cat, setCat]         = useState<PlaceCategory>('place');
  const [time, setTime]       = useState('');
  const [notes, setNotes]     = useState('');
  const [cover, setCover]     = useState('');
  const [fetchSt, setFetchSt] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUrl = async (raw: string) => {
    if (!raw.trim()) return;
    setLoading(true); setFetchSt('Fetching…');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/travel?action=fetch-place', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` }, body: JSON.stringify({ url: raw.trim() }) });
      const d = await r.json();
      if (d.title && !title) setTitle(d.title);
      if (d.image) { setCover(d.image); setFetchSt('✓ Image imported'); }
      else setFetchSt('No image found');
      if (d.address && !address) setAddress(d.address);
    } catch { setFetchSt('Could not fetch'); }
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} title={dayNumber ? `Add to Day ${dayNumber}` : 'Add to Wish List'}>
      <Label>Category</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['restaurant','hotel','activity','place','transport','other'] as PlaceCategory[]).map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{ padding: '5px 11px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',system-ui", background: cat === c ? '#2C6E8A' : '#F2EDE6', color: cat === c ? 'white' : '#9C8B7A' }}>
            {CAT_ICONS[c]} {c}
          </button>
        ))}
      </div>
      <Label>URL — CityWindow, Google Maps, TripAdvisor…</Label>
      <input value={url} onChange={e => setUrl(e.target.value)} onBlur={e => fetchUrl(e.target.value)} placeholder="https://citywindow.app/places/..." style={SI} />
      {fetchSt && <div style={{ fontSize: 11, color: fetchSt.startsWith('✓') ? '#5C8B6A' : '#9C8B7A', marginBottom: 10, fontStyle: 'italic' }}>{fetchSt}</div>}
      {cover && <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 14, height: 100 }}><img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display='none'; }} /></div>}
      <Label>Name *</Label>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Le Jules Verne, Eiffel Tower…" style={SI} />
      <Label>Address</Label>
      <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Avenue Gustave Eiffel, Paris" style={SI} />
      <Label>Visit Time</Label>
      <input value={time} onChange={e => setTime(e.target.value)} placeholder="8:00 PM, Morning…" style={{ ...SI, width: '60%' }} />
      <Label>Notes</Label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Reservation #, what to order…" style={{ ...SI, resize: 'none' }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={GBtn}>Cancel</button>
        <button onClick={() => { if (!title.trim()) return; onSave({ title, url: url || null, address: address || null, category: cat, visit_time: time || null, notes: notes || null, day_number: dayNumber, status: 'want-to-go', cover_image: cover || null, source: url.includes('citywindow') ? 'CityWindow' : url ? 'URL' : 'Manual' }); }}
          disabled={!title.trim()}
          style={{ ...PBtn, flex: 2, background: '#2C6E8A', opacity: !title.trim() ? 0.5 : 1, cursor: !title.trim() ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Importing…' : 'Add Place'}
        </button>
      </div>
    </Modal>
  );
}

function PlaceDetailModal({ place, days, onUpdate, onDelete, onClose }: { place: PlaceCard; days: number[]; onUpdate: (u: Partial<PlaceCard>) => void; onDelete: () => void; onClose: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const s = PLACE_STATUS[place.status];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,35,24,0.55)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#FFFEF9', width: '100%', maxWidth: 520, borderRadius: '20px 20px 0 0', maxHeight: '92dvh', overflowY: 'auto' }}>
        {place.cover_image ? (
          <div style={{ height: 180, position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
            <img src={place.cover_image} alt={place.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(44,35,24,0.6))' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: 'white', fontSize: 16 }}>×</button>
            <div style={{ position: 'absolute', bottom: 14, left: 20, right: 50 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: 'white', fontWeight: 600 }}>{place.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{CAT_ICONS[place.category]} {place.category}{place.source && ` · via ${place.source}`}</div>
            </div>
          </div>
        ) : null}
        <div style={{ padding: '20px 22px 40px' }}>
          {!place.cover_image && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: '#2C2318', fontWeight: 500 }}>{place.title}</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#C8B8A8' }}>×</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #EDE9E3' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: s.bg, color: s.text }}>{s.label}</span>
            {place.address && <a href={`https://maps.apple.com/?q=${encodeURIComponent(place.address)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2C6E8A', fontWeight: 600, textDecoration: 'none' }}>📍 {place.address} ↗</a>}
            {place.url && <a href={place.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#C17A5A', fontWeight: 600, textDecoration: 'none' }}>View ↗</a>}
          </div>
          <Label>Status</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {(['want-to-go','booked','done','skipped'] as PlaceStatus[]).map(st => (
              <button key={st} onClick={() => onUpdate({ status: st })}
                style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',system-ui", background: place.status === st ? '#2C2318' : '#F2EDE6', color: place.status === st ? 'white' : '#9C8B7A' }}>
                {PLACE_STATUS[st].label}
              </button>
            ))}
          </div>
          <Label>Move to Day</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            <button onClick={() => onUpdate({ day_number: null })}
              style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',system-ui", background: !place.day_number ? '#2C6E8A' : '#F2EDE6', color: !place.day_number ? 'white' : '#9C8B7A' }}>
              Wish List
            </button>
            {days.map(d => (
              <button key={d} onClick={() => onUpdate({ day_number: d })}
                style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',system-ui", background: place.day_number === d ? '#2C6E8A' : '#F2EDE6', color: place.day_number === d ? 'white' : '#9C8B7A' }}>
                Day {d}
              </button>
            ))}
          </div>
          {place.notes && <div style={{ background: '#F2EDE6', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#6B5A4A', lineHeight: 1.6 }}>{place.notes}</div>}
          {confirmDel ? (
            <div style={{ background: '#FDF6F3', borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 16, color: '#2C2318', marginBottom: 10 }}>Remove this place?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDel(false)} style={GBtn}>Cancel</button>
                <button onClick={onDelete} style={{ ...PBtn, background: '#C0392B', flex: 1 }}>Remove</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid #EDE9E3', background: 'transparent', color: '#C8B8A8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui" }}>
              Remove from itinerary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PackingView({ items, onToggle, onAdd }: { items: PackingItem[]; onToggle: (i: PackingItem) => void; onAdd: (l: string, c: string) => void }) {
  const [newLabel, setNewLabel] = useState('');
  const [newCat, setNewCat]     = useState('clothing');
  const packed = items.filter(i => i.packed).length;
  const grouped = PACK_CATS.reduce((acc, c) => { acc[c] = items.filter(i => i.category === c); return acc; }, {} as Record<string, PackingItem[]>);
  return (
    <div>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: '#2C2318', fontWeight: 500, marginBottom: 6 }}>Packing List</div>
      {items.length > 0 && <>
        <div style={{ fontSize: 13, color: '#9C8B7A', marginBottom: 14 }}>{packed} of {items.length} packed</div>
        <div style={{ height: 4, background: '#EDE9E3', borderRadius: 2, marginBottom: 24 }}>
          <div style={{ height: '100%', borderRadius: 2, background: '#2C6E8A', width: `${(packed/items.length)*100}%`, transition: 'width 0.3s' }} />
        </div>
      </>}
      {PACK_CATS.map(cat => {
        const ci = grouped[cat];
        if (!ci.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9C8B7A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{PACK_ICONS[cat]} {cat}</div>
            {ci.map(item => (
              <div key={item.id} onClick={() => onToggle(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid #F5F0EA' }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: item.packed ? 'none' : '1.5px solid #EDE9E3', background: item.packed ? '#2C6E8A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.packed && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, color: item.packed ? '#C8B8A8' : '#2C2318', textDecoration: item.packed ? 'line-through' : 'none' }}>{item.label}</span>
              </div>
            ))}
          </div>
        );
      })}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #EDE9E3', padding: '18px 20px', marginTop: 16 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 17, color: '#2C2318', marginBottom: 12 }}>Add item</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {PACK_CATS.map(c => (
            <button key={c} onClick={() => setNewCat(c)}
              style={{ padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',system-ui", background: newCat === c ? '#2C2318' : '#F2EDE6', color: newCat === c ? 'white' : '#9C8B7A' }}>
              {PACK_ICONS[c]} {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) { onAdd(newLabel.trim(), newCat); setNewLabel(''); }}}
            placeholder="Add item…" style={{ ...SI, marginBottom: 0, flex: 1 }} />
          <button onClick={() => { if (newLabel.trim()) { onAdd(newLabel.trim(), newCat); setNewLabel(''); }}} style={{ ...PBtn, width: 'auto', padding: '10px 16px' }}>Add</button>
        </div>
      </div>
    </div>
  );
}

function BudgetView({ trip, places, onUpdateBudget }: { trip: Trip; places: PlaceCard[]; onUpdateBudget: (b: number) => void }) {
  const [budget, setBudget] = useState(String(trip.budget ?? ''));
  return (
    <div>
      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: '#2C2318', fontWeight: 500, marginBottom: 24 }}>Budget</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
        {[{ l: 'Saved', v: places.length, c: '#2C6E8A' },{ l: 'Booked', v: places.filter(p=>p.status==='booked').length, c: '#5C8B6A' },{ l: 'Visited', v: places.filter(p=>p.status==='done').length, c: '#9C8B7A' }].map(s => (
          <div key={s.l} style={{ background: 'white', borderRadius: 14, border: '1px solid #EDE9E3', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 32, color: s.c, fontWeight: 500 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: '#9C8B7A', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #EDE9E3', padding: '20px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, color: '#2C2318', marginBottom: 14 }}>Trip Budget</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 20, color: '#9C8B7A' }}>$</div>
          <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="2500" style={{ ...SI, marginBottom: 0, flex: 1 }} />
          <button onClick={() => { const b = parseFloat(budget); if (!isNaN(b)) onUpdateBudget(b); }} style={{ ...PBtn, width: 'auto', padding: '10px 16px' }}>Save</button>
        </div>
        <p style={{ fontSize: 12, color: '#B8A99A', fontStyle: 'italic', marginTop: 12 }}>Use Watch & Alert to monitor flights and hotels — get notified when prices drop.</p>
        <a href="/settings/watch" style={{ fontSize: 12, color: '#2C6E8A', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4 }}>👁️ Set a price watch →</a>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,35,24,0.55)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#FFFEF9', width: '100%', maxWidth: 520, borderRadius: '20px 20px 0 0', padding: '10px 24px 44px', maxHeight: '92dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#EDE9E3', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: '#2C2318', fontWeight: 500 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#C8B8A8' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const SI: React.CSSProperties = { width: '100%', padding: '10px 13px', borderRadius: 10, border: '1px solid #EDE9E3', fontSize: 13, fontFamily: "'DM Sans',system-ui", color: '#2C2318', marginBottom: 12, outline: 'none', background: '#FFFEF9' };
const PBtn: React.CSSProperties = { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#2C2318', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans',system-ui" };
const GBtn: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #EDE9E3', background: 'transparent', color: '#9C8B7A', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui" };
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: '#C8B8A8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7, fontFamily: "'DM Sans',system-ui" }}>{children as any}</div>;
}
