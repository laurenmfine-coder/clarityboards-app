// Chore Bank logic. One endpoint, POST {action, ...}. Data lives in the Supabase table chorebank_kv.
// Keys: f:<familyId>:<thing> per family, code:<FAMILYCODE> -> family id, px:<SYMBOL> price cache.
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.CHOREBANK_SECRET || SB_KEY || '';
const PRICE_MOCK = process.env.PRICE_MOCK_URL || '';
const TZ = 'America/New_York';
const ALL = [0, 1, 2, 3, 4, 5, 6];
const START_PRACTICE = 1000;

/* ---------- store ---------- */
let _sb = null;
const sb = () => (_sb = _sb || createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }));
async function kvPrefix(prefix) {
  const out = {}; let from = 0;
  for (;;) {
    const { data, error } = await sb().from('chorebank_kv').select('key,value').like('key', prefix + '%').range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data || []) out[r.key] = r.value;
    if (!data || data.length < 1000) return out;
    from += 1000;
  }
}
async function kvGet(key) {
  const { data, error } = await sb().from('chorebank_kv').select('key,value').eq('key', key);
  if (error) throw new Error(error.message);
  return data && data[0] ? data[0].value : null;
}
async function kvPut(rows) {
  if (!rows.length) return;
  const { error } = await sb().from('chorebank_kv').upsert(rows.map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() })));
  if (error) throw new Error(error.message);
}
async function kvDel(keys) { if (keys.length) await sb().from('chorebank_kv').delete().in('key', keys); }

/* ---------- dates ---------- */
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
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from(crypto.randomBytes(6), (x) => CODE_CHARS[x % CODE_CHARS.length]).join('');
const cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
const cleanSym = (s) => { const x = String(s || '').toUpperCase().trim(); return /^[A-Z0-9.\-^=]{1,12}$/.test(x) ? x : null; };
function makeToken(fid, who, days) {
  const p = b64(JSON.stringify({ fid, who, exp: Date.now() + days * 864e5 }));
  return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
}
function readToken(t) {
  if (!t || typeof t !== 'string' || !t.includes('.')) return null;
  const [p, s] = t.split('.');
  const good = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
  if (!s || s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() ? { who: o.who, fid: o.fid || 'fine' } : null; } catch { return null; }
}

/* ---------- starter content ---------- */
const FINE_CHORES = [
  ['Clean room or keep it clean', 0.5, 'daily'], ['Feed Luca (both meals)', 0.5, 'daily'],
  ["Keep Luca's poop off the patio", 0.5, 'daily'], ['Dishes (keep the sink clean)', 0.5, 'daily'],
  ['Fold laundry (full load)', 1, 'anytime'], ['Put laundry away (full load)', 0.5, 'anytime'],
  ['Feed Luca (one meal)', 0.25, 'anytime'], ['Hebrew practice (15 minutes)', 0.25, 'anytime'],
  ['Give Luca a bath', 1, 'anytime'], ['Shave Luca', 4, 'anytime'], ['Swim practice', 0.5, 'anytime'],
  ['Beat a personal record (swim or run)', 0.25, 'anytime'], ['Clean the pool', 0.5, 'anytime'],
];
const STARTER_CHORES = [
  ['Make bed', 0.25, 'daily'], ['Clean room or keep it clean', 0.5, 'daily'], ['Dishes', 0.5, 'daily'],
  ['Feed the pet', 0.25, 'daily'], ['Homework done', 0.5, 'daily'],
  ['Fold laundry (full load)', 1, 'anytime'], ['Read (15 minutes)', 0.25, 'anytime'],
  ['Practice an instrument (15 minutes)', 0.25, 'anytime'], ['Help in the yard', 1, 'anytime'],
];
const choresFrom = (list, kidId) => list.map(([name, value, kind], i) => ({ id: rid(), kidId, name, value, kind, days: ALL, order: i, active: true }));
const newKid = (name, order) => ({ id: rid(), name, order, pin: null, since: '', interest: { rate: 0, period: 'month', last: null } });

/* ---------- legacy (single-family) data moves into family "fine" ---------- */
const STARTER_IDS = new Set(['b1', 'b2', 'b3', 'b4', 'e1', 'e2', 'e3', 'e4']);
async function moveLegacy() {
  const meta = await kvGet('meta');
  if (!meta) return null;
  const all = await kvPrefix('');
  const rows = []; const del = [];
  for (const [k, v] of Object.entries(all)) {
    if (k === 'meta' || k.startsWith('week:') || k.startsWith('ledger:')) { rows.push(['f:fine:' + k, v]); del.push(k); }
    else if (k.startsWith('fail:')) del.push(k);
  }
  const m = rows.find((r) => r[0] === 'f:fine:meta')[1];
  if (m.choreSet !== 'family1' && m.chores.every((c) => STARTER_IDS.has(c.id))) m.chores = m.kids.flatMap((k) => choresFrom(FINE_CHORES, k.id));
  m.choreSet = 'family1';
  let code = newCode(); while (await kvGet('code:' + code)) code = newCode();
  m.code = code; m.familyName = m.familyName || 'The Fine Family';
  rows.push(['code:' + code, { fid: 'fine' }]);
  await kvPut(rows); await kvDel(del);
  return 'fine';
}

/* ---------- family load / save ---------- */
async function loadFamily(fid) {
  const pre = 'f:' + fid + ':';
  const all = await kvPrefix(pre);
  const d = { fid, meta: all[pre + 'meta'] || null, weeks: {}, ledger: {}, inv: {}, read: {}, grades: {}, requests: all[pre + 'requests'] || [], fails: {} };
  for (const [key, v] of Object.entries(all)) {
    const k = key.slice(pre.length);
    const [type, id] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)];
    if (type === 'week') d.weeks[id] = v;
    else if (type in d && type !== 'meta' && type !== 'requests' && type !== 'weeks' && type !== 'fid') d[type][id] = v;
  }
  if (d.meta) for (const k of d.meta.kids) { d.ledger[k.id] = d.ledger[k.id] || []; d.read[k.id] = d.read[k.id] || []; d.grades[k.id] = d.grades[k.id] || []; }
  return d;
}
function makeCtx(data) {
  const dirty = { meta: false, requests: false, weeks: new Set(), ledger: new Set(), inv: new Set(), read: new Set(), grades: new Set() };
  const pre = 'f:' + data.fid + ':';
  const ctx = {
    ...data, dirty,
    week(kid, ws) { const id = kid + '_' + ws; if (!ctx.weeks[id]) ctx.weeks[id] = { kidId: kid, weekStart: ws, days: {}, extras: {} }; return { w: ctx.weeks[id], id }; },
    invOf(kid) { if (!ctx.inv[kid]) { ctx.inv[kid] = { cash: START_PRACTICE, granted: START_PRACTICE, holdings: {}, trades: [] }; dirty.inv.add(kid); } return ctx.inv[kid]; },
    async save() {
      const rows = [];
      if (dirty.meta) rows.push([pre + 'meta', ctx.meta]);
      if (dirty.requests) rows.push([pre + 'requests', ctx.requests]);
      for (const id of dirty.weeks) rows.push([pre + 'week:' + id, ctx.weeks[id]]);
      for (const t of ['ledger', 'inv', 'read', 'grades']) for (const k of dirty[t]) rows.push([pre + t + ':' + k, ctx[t][k]]);
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
    const led = ctx.ledger[k.id] || (ctx.ledger[k.id] = []);
    let b = nextBoundary(it.last, it.period); let guard = 0;
    while (b <= t && guard++ < 600) {
      const bal = led.filter((e) => e.date < b).reduce((a, e) => a + sign(e) * e.amount, 0);
      const amt = r2((bal * it.rate) / 100);
      if (amt > 0) led.push({ id: rid(), date: b, type: 'interest', amount: amt, note: `${it.rate}% interest`, at: Date.now() });
      it.last = b; ctx.dirty.meta = true; ctx.dirty.ledger.add(k.id);
      b = nextBoundary(b, it.period);
    }
  }
}

/* ---------- prices (Yahoo daily history, Stooq fallback), cached 6 hours ---------- */
async function fetchYahoo(sym) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=10y&interval=1d&includeAdjustedClose=true`, { headers: { 'User-Agent': 'Mozilla/5.0 (ChoreBank)' } });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const j = await r.json(); const res = j?.chart?.result?.[0]; if (!res || !res.timestamp) throw new Error('yahoo empty');
  const closes = res.indicators?.adjclose?.[0]?.adjclose || res.indicators?.quote?.[0]?.close || [];
  const rows = []; res.timestamp.forEach((ts, i) => { const c = closes[i]; if (c != null && isFinite(c)) rows.push([F(new Date(ts * 1000)), Math.round(c * 10000) / 10000]); });
  const m = res.meta || {};
  return { name: m.longName || m.shortName || sym, rows };
}
async function fetchStooq(sym) {
  const r = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(sym.toLowerCase())}.us&i=d`);
  if (!r.ok) throw new Error('stooq ' + r.status);
  const lines = (await r.text()).trim().split('\n').slice(1);
  const rows = lines.map((l) => l.split(',')).filter((p) => p.length >= 5 && isFinite(+p[4])).map((p) => [p[0], +p[4]]);
  if (!rows.length) throw new Error('stooq empty');
  return { name: sym, rows: rows.slice(-2600) };
}
async function fetchMock(sym) { const r = await fetch(PRICE_MOCK + '/' + sym); if (!r.ok) throw new Error('mock ' + r.status); return r.json(); }
async function getPrice(sym) {
  const key = 'px:' + sym; const cached = await kvGet(key);
  if (cached && Date.now() - cached.at < 6 * 3600e3) return cached;
  let data = null;
  try { data = PRICE_MOCK ? await fetchMock(sym) : await fetchYahoo(sym); }
  catch (e) { if (!PRICE_MOCK) { try { data = await fetchStooq(sym); } catch {} } }
  if (!data || !data.rows || data.rows.length < 2) { if (cached) return cached; return null; }
  const v = { at: Date.now(), name: data.name, rows: data.rows };
  await kvPut([[key, v]]);
  return v;
}
function lastPx(p) { const r = p.rows[p.rows.length - 1]; return { price: r[1], date: r[0] }; }
function sample(rows) {
  // keep about 600 points: all of the last 90 days, weekly before that
  if (rows.length <= 600) return rows;
  const recent = rows.slice(-90); const older = rows.slice(0, -90).filter((_, i) => i % 5 === 0);
  return older.concat(recent);
}

/* ---------- view ---------- */
function view(ctx, who) {
  const kids = ctx.meta.kids.map(({ pin, ...k }) => ({ ...k, hasPin: !!pin }));
  const own = (kid) => who === 'parent' || who === kid;
  const pick = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) if (own(k)) r[k] = v; return r; };
  const weeks = {}; for (const [id, w] of Object.entries(ctx.weeks)) if (own(w.kidId)) weeks[id] = w;
  const inv = {}; for (const k of ctx.meta.kids) if (own(k.id)) inv[k.id] = ctx.inv[k.id] || { cash: START_PRACTICE, granted: START_PRACTICE, holdings: {}, trades: [] };
  return {
    who, today: today(), family: { name: ctx.meta.familyName || 'My Family', code: who === 'parent' ? ctx.meta.code : undefined },
    kids, chores: ctx.meta.chores, weeks, ledgers: pick(ctx.ledger), inv, reading: pick(ctx.read), grades: pick(ctx.grades),
    requests: ctx.requests.filter((r) => own(r.kid)),
  };
}

/* ---------- chore item helpers ---------- */
function getItem(w, date, ref, create) {
  if (ref.eid) return w.extras[ref.eid] || null;
  w.days[date] = w.days[date] || {};
  if (!w.days[date][ref.cid] && create) w.days[date][ref.cid] = { status: 'none' };
  return w.days[date][ref.cid] || null;
}
const refOf = (b) => (b.eid ? { eid: String(b.eid) } : { cid: String(b.cid) });
function approveItem(ctx, kid, date, ref, it) {
  it.status = 'approved'; it.approvedAt = Date.now();
  (ctx.ledger[kid] || (ctx.ledger[kid] = [])).push({ id: rid(), date, type: 'earned', amount: money(it.value), note: it.name || 'Chore', ref: date + '|' + (ref.cid || ref.eid), at: Date.now() });
  ctx.dirty.ledger.add(kid);
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
const KID_ACTIONS = new Set(['toggle', 'note', 'addExtra', 'delExtra', 'send', 'setSince', 'buy', 'sell', 'request', 'cancelRequest', 'addReading', 'delReading', 'addGrade', 'delGrade']);
const PARENT_ACTIONS = new Set(['approve', 'approveAll', 'sendBack', 'addChore', 'updateChore', 'addKid', 'renameKid', 'setKidPin', 'setParentPin', 'ledgerAdd', 'ledgerDelete', 'setInterest', 'grantPractice', 'resetPractice', 'answerRequest', 'commentGrade', 'renameFamily']);

function run(ctx, who, b) {
  const a = b.action;
  const kidOk = (kid) => { if (!ctx.meta.kids.some((k) => k.id === kid)) fail('Unknown kid.'); if (who !== 'parent' && who !== kid) fail('Not allowed.'); };
  if (KID_ACTIONS.has(a)) {
    const kid = String(b.kid); kidOk(kid);
    switch (a) {
      case 'setSince': { const k = ctx.meta.kids.find((k) => k.id === kid); k.since = isDate(b.since) ? b.since : ''; ctx.dirty.meta = true; return; }
      case 'send': {
        if (!isDate(b.ws)) fail('Bad week.');
        const { w, id } = ctx.week(kid, b.ws);
        for (const { it, ref } of allItems(w)) if (it.status === 'done') {
          it.status = 'pending'; it.sentAt = Date.now();
          if (ref.cid) { const c = ctx.meta.chores.find((c) => c.id === ref.cid); if (c) { it.name = c.name; it.value = money(c.value); } }
        }
        ctx.dirty.weeks.add(id); return;
      }
      case 'buy': case 'sell': {
        const sym = cleanSym(b.symbol); if (!sym) fail('Pick an investment.');
        const px = b._price; if (!px) fail('Could not get a price for ' + sym + '. Check the symbol.');
        const inv = ctx.invOf(kid); const { price, date } = lastPx(px);
        const h = inv.holdings[sym] || { shares: 0, cost: 0, name: px.name };
        let amount = money(b.amount);
        if (a === 'buy') {
          if (!(amount > 0)) fail('Enter an amount above $0.');
          if (amount > inv.cash + 0.001) fail(`You only have ${'$' + r2(inv.cash).toFixed(2)} of practice money.`);
          const shares = amount / price;
          h.shares += shares; h.cost += amount; h.name = px.name; inv.holdings[sym] = h; inv.cash = r2(inv.cash - amount);
          inv.trades.push({ at: Date.now(), date, sym, side: 'buy', amount, shares, price });
        } else {
          const worth = h.shares * price; if (!(h.shares > 0)) fail('You don’t own any ' + sym + '.');
          if (b.all || amount >= worth - 0.005) amount = r2(worth);
          if (!(amount > 0)) fail('Enter an amount above $0.');
          const shares = Math.min(h.shares, amount / price); const frac = shares / h.shares;
          h.cost = r2(h.cost * (1 - frac)); h.shares -= shares; inv.cash = r2(inv.cash + amount);
          if (h.shares < 1e-6) delete inv.holdings[sym]; else inv.holdings[sym] = h;
          inv.trades.push({ at: Date.now(), date, sym, side: 'sell', amount, shares, price });
        }
        if (inv.trades.length > 500) inv.trades = inv.trades.slice(-500);
        ctx.dirty.inv.add(kid); return;
      }
      case 'request': {
        const sym = cleanSym(b.symbol); const amount = money(b.amount);
        if (!sym) fail('Pick an investment.'); if (!(amount > 0)) fail('Enter an amount above $0.');
        if (ctx.requests.filter((r) => r.kid === kid && r.status === 'open').length >= 20) fail('You have a lot of open requests. Wait for a parent to answer.');
        ctx.requests.push({ id: rid(), kid, symbol: sym, name: txt(b.name, 120) || sym, amount, note: txt(b.note, 400), status: 'open', at: Date.now(), date: today() });
        ctx.dirty.requests = true; return;
      }
      case 'cancelRequest': {
        const r = ctx.requests.find((r) => r.id === b.id && r.kid === kid); if (!r || r.status !== 'open') fail('That request is already answered.');
        r.status = 'cancelled'; ctx.dirty.requests = true; return;
      }
      case 'addReading': {
        const title = txt(b.title, 160); if (!title) fail('Type the book title.');
        const minutes = Math.max(0, Math.min(1440, Math.round(Number(b.minutes) || 0)));
        const date = isDate(b.date) ? b.date : today();
        ctx.read[kid].push({ id: rid(), date, title, author: txt(b.author, 120), minutes, pages: Math.max(0, Math.round(Number(b.pages) || 0)), finished: !!b.finished, at: Date.now() });
        ctx.dirty.read.add(kid); return;
      }
      case 'delReading': { const l = ctx.read[kid]; const i = l.findIndex((e) => e.id === b.id); if (i < 0) fail('Not found.'); l.splice(i, 1); ctx.dirty.read.add(kid); return; }
      case 'addGrade': {
        const subject = txt(b.subject, 80); const grade = txt(b.grade, 20); if (!subject || !grade) fail('Add the class and the grade.');
        const date = isDate(b.date) ? b.date : today();
        ctx.grades[kid].push({ id: rid(), date, subject, kind: txt(b.kind, 40) || 'Test', grade, note: txt(b.note, 400), at: Date.now(), seen: false, comment: '' });
        ctx.dirty.grades.add(kid); return;
      }
      case 'delGrade': { const l = ctx.grades[kid]; const i = l.findIndex((e) => e.id === b.id); if (i < 0) fail('Not found.'); l.splice(i, 1); ctx.dirty.grades.add(kid); return; }
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
      if (ctx.meta.kids.length >= 12) fail('That is the most kids one family can have here.');
      const k = newKid(name, ctx.meta.kids.length); ctx.meta.kids.push(k);
      ctx.meta.chores.push(...choresFrom(STARTER_CHORES, k.id)); ctx.read[k.id] = []; ctx.grades[k.id] = []; ctx.ledger[k.id] = [];
      ctx.dirty.meta = true; return;
    }
    case 'renameKid': { const k = ctx.meta.kids.find((k) => k.id === b.kid); if (!k) fail('Unknown kid.'); const n = txt(b.name, 40); if (n) k.name = n; ctx.dirty.meta = true; return; }
    case 'renameFamily': { const n = txt(b.name, 60); if (n) ctx.meta.familyName = n; ctx.dirty.meta = true; return; }
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
      (ctx.ledger[kid] || (ctx.ledger[kid] = [])).push({ id: rid(), date, type, amount, note: txt(b.note, 120) || (type === 'deposit' ? 'Added' : 'Taken out'), at: Date.now(), manual: true });
      ctx.dirty.ledger.add(kid); return;
    }
    case 'ledgerDelete': {
      const kid = String(b.kid); kidOk(kid);
      const led = ctx.ledger[kid] || []; const i = led.findIndex((e) => e.id === b.id);
      if (i < 0) fail('Not found.'); if (!led[i].manual && led[i].type !== 'interest') fail('Approved chores can’t be removed here.');
      led.splice(i, 1); ctx.dirty.ledger.add(kid); return;
    }
    case 'setInterest': {
      const k = ctx.meta.kids.find((k) => k.id === b.kid); if (!k) fail('Unknown kid.');
      const rate = Math.min(100, Math.max(0, r2(b.rate))); const period = b.period === 'week' ? 'week' : 'month';
      const prev = k.interest || {};
      const restart = !(prev.rate > 0) || prev.period !== period || !prev.last;
      k.interest = { rate, period, last: rate > 0 ? (restart ? lastBoundary(today(), period) : prev.last) : null };
      ctx.dirty.meta = true; return;
    }
    case 'grantPractice': {
      const kid = String(b.kid); kidOk(kid); const amount = money(b.amount); if (!(amount > 0)) fail('Enter an amount above $0.');
      const inv = ctx.invOf(kid); inv.cash = r2(inv.cash + amount); inv.granted = r2(inv.granted + amount); ctx.dirty.inv.add(kid); return;
    }
    case 'resetPractice': {
      const kid = String(b.kid); kidOk(kid); const amount = money(b.amount) || START_PRACTICE;
      ctx.inv[kid] = { cash: amount, granted: amount, holdings: {}, trades: [] }; ctx.dirty.inv.add(kid); return;
    }
    case 'answerRequest': {
      const r = ctx.requests.find((r) => r.id === b.id); if (!r || r.status !== 'open') fail('That request is already answered.');
      r.status = b.status === 'done' ? 'done' : 'declined'; r.reply = txt(b.reply, 400); r.answeredAt = Date.now(); ctx.dirty.requests = true; return;
    }
    case 'commentGrade': {
      const kid = String(b.kid); kidOk(kid); const g = ctx.grades[kid].find((g) => g.id === b.id); if (!g) fail('Not found.');
      g.seen = true; if (b.comment != null) g.comment = txt(b.comment, 300); ctx.dirty.grades.add(kid); return;
    }
  }
}

/* ---------- handler ---------- */
export async function handleChoreBank(rawBody, authHeader) {
  const out = (status, json) => ({ status, json });
  if (!SB_URL || !SB_KEY) return out(500, { error: 'The database is not connected yet.' });
  try {
    const b = rawBody || {};

    // Prices need a login but not a family write.
    if (b.action === 'hello') {
      const code = cleanCode(b.code);
      if (!code) return out(200, { needCode: true });
      const c = await kvGet('code:' + code);
      if (!c) return out(404, { error: 'No family with that code. Check it with a parent.' });
      const d = await loadFamily(c.fid);
      return out(200, { family: { name: d.meta.familyName }, setup: !d.meta.parentPin, kids: d.meta.kids.map((k) => ({ id: k.id, name: k.name, hasPin: !!k.pin })) });
    }
    if (b.action === 'createFamily') {
      const familyName = txt(b.familyName, 60); const pin = String(b.pin || '').trim();
      const names = (Array.isArray(b.kids) ? b.kids : []).map((n) => txt(n, 40)).filter(Boolean).slice(0, 12);
      if (!familyName) return out(400, { error: 'Type a family name.' });
      if (!/^\d{4,8}$/.test(pin)) return out(400, { error: 'Use 4 to 8 digits for the parent PIN.' });
      if (!names.length) return out(400, { error: 'Add at least one kid.' });
      let code = newCode(); while (await kvGet('code:' + code)) code = newCode();
      const fid = rid();
      const kids = names.map((n, i) => newKid(n, i));
      const meta = { familyName, code, parentPin: hashPin(pin), kids, chores: kids.flatMap((k) => choresFrom(STARTER_CHORES, k.id)), created: Date.now(), choreSet: 'starter' };
      await kvPut([['f:' + fid + ':meta', meta], ['code:' + code, { fid }]]);
      const ctx = makeCtx(await loadFamily(fid));
      return out(200, { token: makeToken(fid, 'parent', 30), code, state: view(ctx, 'parent') });
    }
    if (b.action === 'login') {
      const c = await kvGet('code:' + cleanCode(b.code));
      if (!c) return out(404, { error: 'No family with that code.' });
      const ctx = makeCtx(await loadFamily(c.fid));
      const who = String(b.who || '');
      const failKey = 'f:' + c.fid + ':fail:' + who.replace(/[^a-z0-9]/gi, '');
      const f = await kvGet(failKey); const fails = f && f.until > Date.now() ? f.n : 0;
      if (fails >= 8) return out(429, { error: 'Too many wrong tries. Wait 15 minutes.' });
      const hash = who === 'parent' ? ctx.meta.parentPin : ctx.meta.kids.find((k) => k.id === who)?.pin;
      if (!hash) return out(400, { error: who === 'parent' ? 'No parent PIN yet.' : 'Ask a parent to set your PIN first.' });
      if (hashPin(String(b.pin || '').trim()) !== hash) { await kvPut([[failKey, { n: fails + 1, until: Date.now() + 900000 }]]); return out(401, { error: 'That PIN is not right.' }); }
      if (f) await kvDel([failKey]);
      accrue(ctx); await ctx.save();
      return out(200, { token: makeToken(c.fid, who, who === 'parent' ? 30 : 180), state: view(ctx, who) });
    }

    const tok = readToken((authHeader || '').replace(/^Bearer /, ''));
    if (!tok) return out(401, { error: 'Please log in again.' });
    let d = await loadFamily(tok.fid);
    if (!d.meta && tok.fid === 'fine') { await moveLegacy(); d = await loadFamily('fine'); }
    if (!d.meta || (tok.who !== 'parent' && !d.meta.kids.some((k) => k.id === tok.who))) return out(401, { error: 'Please log in again.' });

    if (b.action === 'prices') {
      const syms = [...new Set((Array.isArray(b.symbols) ? b.symbols : []).map(cleanSym).filter(Boolean))].slice(0, 12);
      const res = {};
      await Promise.all(syms.map(async (s) => { const p = await getPrice(s); if (p) res[s] = { name: p.name, ...lastPx(p), rows: sample(p.rows) }; }));
      return out(200, { prices: res });
    }

    const ctx = makeCtx(d);
    accrue(ctx);
    if (b.action === 'buy' || b.action === 'sell') { const s = cleanSym(b.symbol); b._price = s ? await getPrice(s) : null; }
    if (b.action !== 'state') run(ctx, tok.who, b);
    await ctx.save();
    return out(200, { state: view(ctx, tok.who) });
  } catch (e) {
    if (e instanceof UserError) return out(400, { error: e.message });
    console.error(e);
    if (/chorebank_kv|does not exist|schema cache/i.test(String(e && e.message))) return out(500, { error: 'The database table is not set up yet. Run sql/chorebank.sql in the Supabase SQL Editor, then reload.' });
    return out(500, { error: 'Something went wrong saving. Try again.' });
  }
}
