// Chore Bank logic. One endpoint, POST {action, ...}. Data lives in the Supabase table chorebank_kv.
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.CHOREBANK_SECRET || SB_KEY || '';
const TZ = 'America/New_York';
const ALL = [0, 1, 2, 3, 4, 5, 6];

/* ---------- store: Supabase table chorebank_kv (key text primary key, value jsonb) ---------- */
let _sb = null;
const sb = () => (_sb = _sb || createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }));
async function kvAll() {
  const { data, error } = await sb().from('chorebank_kv').select('key,value');
  if (error) throw new Error(error.message);
  const m = {}; for (const r of data || []) m[r.key] = r.value; return m;
}
async function kvPut(rows) {
  if (!rows.length) return;
  const { error } = await sb().from('chorebank_kv').upsert(rows.map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() })));
  if (error) throw new Error(error.message);
}
async function kvDel(key) { await sb().from('chorebank_kv').delete().eq('key', key); }

/* ---------- dates (family time zone) ---------- */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const P = (s) => new Date(s + 'T00:00:00Z');
const F = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = P(s); d.setUTCDate(d.getUTCDate() + n); return F(d); };
const sundayOf = (s) => addDays(s, -P(s).getUTCDay());
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
function nextBoundary(d, period) {
  if (period === 'week') { const dow = P(d).getUTCDay(); return addDays(d, dow === 0 ? 7 : 7 - dow); }
  const x = P(d); return F(new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 1)));
}
const lastBoundary = (d, period) => (period === 'week' ? sundayOf(d) : d.slice(0, 8) + '01');

/* ---------- helpers ---------- */
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const money = (n) => Math.max(0, r2(n));
const rid = () => crypto.randomBytes(6).toString('hex');
const txt = (s, max = 300) => String(s ?? '').slice(0, max).trim();
const sign = (e) => (e.type === 'withdrawal' ? -1 : 1);
const hashPin = (pin) => crypto.createHash('sha256').update(SECRET + ':' + String(pin)).digest('hex');
const b64 = (s) => Buffer.from(s).toString('base64url');
function makeToken(who, days) {
  const p = b64(JSON.stringify({ who, exp: Date.now() + days * 864e5 }));
  return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
}
function readToken(t) {
  if (!t || typeof t !== 'string' || !t.includes('.')) return null;
  const [p, s] = t.split('.');
  const good = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() ? o.who : null; } catch { return null; }
}

const FAMILY_CHORES = [
  // [name, value, kind] daily = paid per day done; anytime = paid each time logged
  ['Clean room or keep it clean', 0.5, 'daily'],
  ['Feed Luca (both meals)', 0.5, 'daily'],
  ["Keep Luca's poop off the patio", 0.5, 'daily'],
  ['Dishes (keep the sink clean)', 0.5, 'daily'],
  ['Fold laundry (full load)', 1, 'anytime'],
  ['Put laundry away (full load)', 0.5, 'anytime'],
  ['Feed Luca (one meal)', 0.25, 'anytime'],
  ['Hebrew practice (15 minutes)', 0.25, 'anytime'],
  ['Give Luca a bath', 1, 'anytime'],
  ['Shave Luca', 4, 'anytime'],
  ['Swim practice', 0.5, 'anytime'],
  ['Beat a personal record (swim or run)', 0.25, 'anytime'],
  ['Clean the pool', 0.5, 'anytime'],
];
const familyChoresFor = (kidId, prefix) => FAMILY_CHORES.map(([name, value, kind], i) => ({ id: prefix + (i + 1), kidId, name, value, kind, days: ALL, order: i, active: true }));
function defaultMeta() {
  const kid = (id, name, order) => ({ id, name, order, pin: null, since: '', interest: { rate: 0, period: 'month', last: null } });
  return {
    parentPin: null, choreSet: 'family1',
    kids: [kid('bobby', 'Bobby', 0), kid('emma', 'Emma', 1)],
    chores: [...familyChoresFor('bobby', 'fb'), ...familyChoresFor('emma', 'fe')],
  };
}
// One-time swap of the original starter chores for the family list.
const STARTER_IDS = new Set(['b1', 'b2', 'b3', 'b4', 'e1', 'e2', 'e3', 'e4']);
function migrate(ctx) {
  const m = ctx.meta; if (!m || m.choreSet === 'family1') return;
  if (m.chores.every((c) => STARTER_IDS.has(c.id))) {
    m.chores = m.kids.flatMap((k) => familyChoresFor(k.id, 'f' + k.id.slice(0, 1) + rid().slice(0, 3) + '-'));
  }
  m.choreSet = 'family1'; ctx.dirty.meta = true;
}

/* ---------- load / save ---------- */
async function loadAll() {
  const all = await kvAll();
  const meta = all['meta'] || null;
  const weeks = {}; const ledgers = {}; const fails = {};
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith('week:')) weeks[k.slice(5)] = v;
    else if (k.startsWith('ledger:')) ledgers[k.slice(7)] = v || [];
    else if (k.startsWith('fail:')) fails[k.slice(5)] = v;
  }
  if (meta) for (const k of meta.kids) ledgers[k.id] = ledgers[k.id] || [];
  return { meta, weeks, ledgers, fails };
}

function makeCtx(data) {
  const dirty = { meta: false, weeks: new Set(), ledgers: new Set() };
  const ctx = {
    ...data, dirty,
    week(kid, ws) {
      const id = kid + '_' + ws;
      if (!ctx.weeks[id]) ctx.weeks[id] = { kidId: kid, weekStart: ws, days: {}, extras: {} };
      return { w: ctx.weeks[id], id };
    },
    async save() {
      const rows = [];
      if (dirty.meta) rows.push(['meta', ctx.meta]);
      for (const id of dirty.weeks) rows.push(['week:' + id, ctx.weeks[id]]);
      for (const k of dirty.ledgers) rows.push(['ledger:' + k, ctx.ledgers[k] || []]);
      await kvPut(rows);
    },
  };
  return ctx;
}

/* ---------- interest ---------- */
function accrue(ctx) {
  const t = today();
  for (const k of ctx.meta.kids) {
    const it = k.interest || (k.interest = { rate: 0, period: 'month', last: null });
    if (!(it.rate > 0) || !it.last) continue;
    const led = ctx.ledgers[k.id] || (ctx.ledgers[k.id] = []);
    let b = nextBoundary(it.last, it.period);
    let guard = 0;
    while (b <= t && guard++ < 600) {
      const bal = led.filter((e) => e.date < b).reduce((a, e) => a + sign(e) * e.amount, 0);
      const amt = r2((bal * it.rate) / 100);
      if (amt > 0) led.push({ id: rid(), date: b, type: 'interest', amount: amt, note: `${it.rate}% interest`, at: Date.now() });
      it.last = b; ctx.dirty.meta = true; ctx.dirty.ledgers.add(k.id);
      b = nextBoundary(b, it.period);
    }
  }
}

/* ---------- view of state for a viewer ---------- */
function view(ctx, who) {
  const kids = ctx.meta.kids.map(({ pin, ...k }) => ({ ...k, hasPin: !!pin }));
  const own = (kid) => who === 'parent' || who === kid;
  const weeks = {};
  for (const [id, w] of Object.entries(ctx.weeks)) if (own(w.kidId)) weeks[id] = w;
  const ledgers = {};
  for (const [k, l] of Object.entries(ctx.ledgers)) if (own(k)) ledgers[k] = l;
  return { who, today: today(), kids, chores: ctx.meta.chores, weeks, ledgers };
}

/* ---------- item helpers ---------- */
function getItem(w, date, ref, create) {
  if (ref.eid) return w.extras[ref.eid] || null;
  w.days[date] = w.days[date] || {};
  if (!w.days[date][ref.cid] && create) w.days[date][ref.cid] = { status: 'none' };
  return w.days[date][ref.cid] || null;
}
const refOf = (b) => (b.eid ? { eid: String(b.eid) } : { cid: String(b.cid) });
function approveItem(ctx, kid, date, ref, it) {
  it.status = 'approved'; it.approvedAt = Date.now();
  const led = ctx.ledgers[kid] || (ctx.ledgers[kid] = []);
  led.push({ id: rid(), date, type: 'earned', amount: money(it.value), note: it.name || 'Chore', ref: date + '|' + (ref.cid || ref.eid), at: Date.now() });
  ctx.dirty.ledgers.add(kid);
}
function allItems(w) {
  const out = [];
  for (const [date, m] of Object.entries(w.days || {})) for (const [cid, it] of Object.entries(m || {})) out.push({ it, date, ref: { cid } });
  for (const [eid, it] of Object.entries(w.extras || {})) out.push({ it, date: it.date, ref: { eid } });
  return out;
}

class UserError extends Error {}
const fail = (m) => { throw new UserError(m); };

/* ---------- actions ---------- */
const KID_ACTIONS = new Set(['toggle', 'note', 'addExtra', 'delExtra', 'send', 'setSince']);
const PARENT_ACTIONS = new Set(['approve', 'approveAll', 'sendBack', 'addChore', 'updateChore', 'addKid', 'renameKid', 'setKidPin', 'setParentPin', 'ledgerAdd', 'ledgerDelete', 'setInterest']);

function run(ctx, who, b) {
  const a = b.action;
  const kidOk = (kid) => { if (!ctx.meta.kids.some((k) => k.id === kid)) fail('Unknown kid.'); if (who !== 'parent' && who !== kid) fail('Not allowed.'); };
  if (KID_ACTIONS.has(a)) {
    const kid = String(b.kid); kidOk(kid);
    if (a === 'setSince') { const k = ctx.meta.kids.find((k) => k.id === kid); k.since = isDate(b.since) ? b.since : ''; ctx.dirty.meta = true; return; }
    if (a === 'send') {
      if (!isDate(b.ws)) fail('Bad week.');
      const { w, id } = ctx.week(kid, b.ws);
      for (const { it, ref } of allItems(w)) if (it.status === 'done') {
        it.status = 'pending'; it.sentAt = Date.now();
        if (ref.cid) { const c = ctx.meta.chores.find((c) => c.id === ref.cid); if (c) { it.name = c.name; it.value = money(c.value); } }
      }
      ctx.dirty.weeks.add(id); return;
    }
    const date = b.date; if (!isDate(date)) fail('Bad date.');
    const { w, id } = ctx.week(kid, sundayOf(date));
    ctx.dirty.weeks.add(id);
    if (a === 'addExtra') {
      if (b.preset) {
        const c = ctx.meta.chores.find((c) => c.id === b.preset && c.kidId === kid && c.active !== false && c.kind === 'anytime');
        if (!c) fail('That chore is not on your list.');
        w.extras[rid()] = { date, name: c.name, value: money(c.value), preset: c.id, status: 'done', note: '', at: Date.now() }; return;
      }
      const name = txt(b.name, 120); if (!name) fail('Type what you did first.');
      w.extras[rid()] = { date, name, value: money(b.value), status: 'done', note: '', at: Date.now() }; return;
    }
    const ref = refOf(b);
    if (ref.cid && !ctx.meta.chores.some((c) => c.id === ref.cid)) fail('Unknown chore.');
    const it = getItem(w, date, ref, true); if (!it) fail('Not found.');
    const locked = it.status === 'pending' || it.status === 'approved';
    if (a === 'toggle') {
      if (locked) fail('That one is already sent.');
      if (it.status === 'done') it.status = 'none';
      else if (ref.cid) { const c = ctx.meta.chores.find((c) => c.id === ref.cid); Object.assign(it, { status: 'done', name: c.name, value: money(c.value), at: Date.now() }); }
      else it.status = 'done';
      return;
    }
    if (a === 'note') {
      it.note = txt(b.note, 500);
      if (ref.cid && !it.name) { const c = ctx.meta.chores.find((c) => c.id === ref.cid); it.name = c.name; it.value = money(c.value); }
      return;
    }
    if (a === 'delExtra') { if (!ref.eid || locked) fail('Can’t remove that one.'); it.status = 'deleted'; return; }
  }
  if (!PARENT_ACTIONS.has(a)) fail('Unknown action.');
  if (who !== 'parent') fail('Only a parent can do that.');
  switch (a) {
    case 'approve': case 'sendBack': {
      const kid = String(b.kid); kidOk(kid); if (!isDate(b.date)) fail('Bad date.');
      const { w, id } = ctx.week(kid, sundayOf(b.date)); const ref = refOf(b);
      const it = getItem(w, b.date, ref, false); if (!it || it.status !== 'pending') fail('That one is not waiting anymore.');
      if (a === 'approve') approveItem(ctx, kid, b.date, ref, it); else { it.status = 'returned'; it.reply = txt(b.reply, 300); }
      ctx.dirty.weeks.add(id); return;
    }
    case 'approveAll': {
      const kid = String(b.kid); kidOk(kid);
      for (const [id, w] of Object.entries(ctx.weeks)) if (w.kidId === kid)
        for (const { it, date, ref } of allItems(w)) if (it.status === 'pending') { approveItem(ctx, kid, date, ref, it); ctx.dirty.weeks.add(id); }
      return;
    }
    case 'addChore': {
      const kid = String(b.kid); kidOk(kid);
      const n = ctx.meta.chores.filter((c) => c.kidId === kid && c.active !== false).length;
      ctx.meta.chores.push({ id: rid(), kidId: kid, name: txt(b.name, 120) || 'New chore', value: money(b.value ?? 0.25), kind: b.kind === 'anytime' ? 'anytime' : 'daily', days: ALL, order: n, active: true });
      ctx.dirty.meta = true; return;
    }
    case 'updateChore': {
      const c = ctx.meta.chores.find((c) => c.id === b.id); if (!c) fail('Unknown chore.');
      if (b.name != null && txt(b.name, 120)) c.name = txt(b.name, 120);
      if (b.value != null) c.value = money(b.value);
      if (Array.isArray(b.days)) c.days = [...new Set(b.days.map(Number).filter((d) => d >= 0 && d <= 6))].sort();
      if (b.active === false) c.active = false;
      if (b.kind === 'daily' || b.kind === 'anytime') c.kind = b.kind;
      ctx.dirty.meta = true; return;
    }
    case 'addKid': {
      const name = txt(b.name, 40); if (!name) fail('Type a name.');
      ctx.meta.kids.push({ id: rid(), name, order: ctx.meta.kids.length, pin: null, since: '', interest: { rate: 0, period: 'month', last: null } });
      ctx.dirty.meta = true; return;
    }
    case 'renameKid': { const k = ctx.meta.kids.find((k) => k.id === b.kid); if (!k) fail('Unknown kid.'); const n = txt(b.name, 40); if (n) k.name = n; ctx.dirty.meta = true; return; }
    case 'setKidPin': case 'setParentPin': {
      const pin = String(b.pin || '').trim(); if (!/^\d{4,8}$/.test(pin)) fail('Use 4 to 8 digits.');
      if (a === 'setParentPin') ctx.meta.parentPin = hashPin(pin);
      else { const k = ctx.meta.kids.find((k) => k.id === b.kid); if (!k) fail('Unknown kid.'); k.pin = hashPin(pin); }
      ctx.dirty.meta = true; return;
    }
    case 'ledgerAdd': {
      const kid = String(b.kid); kidOk(kid);
      const type = ['deposit', 'withdrawal'].includes(b.type) ? b.type : fail('Pick add or take out.');
      const amount = money(b.amount); if (!(amount > 0)) fail('Enter an amount above $0.');
      const date = isDate(b.date) ? b.date : today();
      (ctx.ledgers[kid] || (ctx.ledgers[kid] = [])).push({ id: rid(), date, type, amount, note: txt(b.note, 120) || (type === 'deposit' ? 'Added' : 'Taken out'), at: Date.now(), manual: true });
      ctx.dirty.ledgers.add(kid); return;
    }
    case 'ledgerDelete': {
      const kid = String(b.kid); kidOk(kid);
      const led = ctx.ledgers[kid] || []; const i = led.findIndex((e) => e.id === b.id);
      if (i < 0) fail('Not found.'); if (!led[i].manual && led[i].type !== 'interest') fail('Approved chores can’t be removed here.');
      led.splice(i, 1); ctx.dirty.ledgers.add(kid); return;
    }
    case 'setInterest': {
      const k = ctx.meta.kids.find((k) => k.id === b.kid); if (!k) fail('Unknown kid.');
      const rate = Math.min(100, Math.max(0, r2(b.rate))); const period = b.period === 'week' ? 'week' : 'month';
      const prev = k.interest || {};
      const restart = !(prev.rate > 0) || prev.period !== period || !prev.last;
      k.interest = { rate, period, last: rate > 0 ? (restart ? lastBoundary(today(), period) : prev.last) : null };
      ctx.dirty.meta = true; return;
    }
  }
}

/* ---------- handler ---------- */
export async function handleChoreBank(rawBody, authHeader) {
  const out = (status, json) => ({ status, json });
  if (!SB_URL || !SB_KEY) return out(500, { error: 'The database is not connected yet.' });
  try {
    const b = rawBody || {};
    const ctx = makeCtx(await loadAll());

    if (b.action === 'hello') {
      if (!ctx.meta) return out(200, { setup: true, kids: [] });
      return out(200, { setup: !ctx.meta.parentPin, kids: ctx.meta.kids.map((k) => ({ id: k.id, name: k.name, hasPin: !!k.pin })) });
    }
    if (b.action === 'setup') {
      if (ctx.meta && ctx.meta.parentPin) return out(400, { error: 'Already set up. Log in as parent.' });
      const pin = String(b.pin || '').trim(); if (!/^\d{4,8}$/.test(pin)) return out(400, { error: 'Use 4 to 8 digits.' });
      ctx.meta = ctx.meta || defaultMeta(); ctx.meta.parentPin = hashPin(pin); ctx.dirty.meta = true;
      await ctx.save();
      return out(200, { token: makeToken('parent', 30), state: view(ctx, 'parent') });
    }
    if (b.action === 'login') {
      if (!ctx.meta) return out(400, { error: 'Set up the parent PIN first.' });
      const who = String(b.who || '');
      const failKey = 'fail:' + who.replace(/[^a-z0-9]/gi, '');
      const f = ctx.fails[failKey.slice(5)];
      const fails = f && f.until > Date.now() ? f.n : 0;
      if (fails >= 8) return out(429, { error: 'Too many wrong tries. Wait 15 minutes.' });
      const hash = who === 'parent' ? ctx.meta.parentPin : ctx.meta.kids.find((k) => k.id === who)?.pin;
      if (!hash) return out(400, { error: who === 'parent' ? 'No parent PIN yet.' : 'Ask a parent to set your PIN first.' });
      if (hashPin(String(b.pin || '').trim()) !== hash) { await kvPut([[failKey, { n: fails + 1, until: Date.now() + 900000 }]]); return out(401, { error: 'That PIN is not right.' }); }
      if (f) await kvDel(failKey);
      migrate(ctx); accrue(ctx); await ctx.save();
      return out(200, { token: makeToken(who, who === 'parent' ? 30 : 180), state: view(ctx, who) });
    }

    const who = readToken((authHeader || '').replace(/^Bearer /, ''));
    if (!who || !ctx.meta || (who !== 'parent' && !ctx.meta.kids.some((k) => k.id === who))) return out(401, { error: 'Please log in again.' });
    migrate(ctx); accrue(ctx);
    if (b.action !== 'state') run(ctx, who, b);
    await ctx.save();
    return out(200, { state: view(ctx, who) });
  } catch (e) {
    if (e instanceof UserError) return out(400, { error: e.message });
    console.error(e);
    if (/chorebank_kv|does not exist|schema cache/i.test(String(e && e.message))) return out(500, { error: 'The database table is not set up yet. Run sql/chorebank.sql in the Supabase SQL Editor, then reload.' });
    return out(500, { error: 'Something went wrong saving. Try again.' });
  }
}
