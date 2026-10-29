// Directory: one Durable Object that holds the public side of online play.
// - League search: leagues marked "listed" report their public card here (name, code, coaches, open slots).
// - Leaderboard: opt-in coach profiles with per-dynasty totals (national titles, playoff trips, record).
// - Reports: anyone can report a league, coach or leaderboard name. Two different reporters hide it until reviewed.
// Profiles are anonymous: a random id and secret token made on the device. No email, no account.
import { badName } from './names.js';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const json = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, CORS) });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);
const int = (v, max) => { const x = Math.floor(+v); return Number.isFinite(x) && x >= 0 ? Math.min(x, max) : 0; };
const PID_RE = /^[a-f0-9]{32}$/;
const DID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const LID_RE = /^[A-Z0-9]{6}$/;
const TOP_N = 250;
const MAX_DYN = 25;
const HIDE_AT = 2;                 // distinct reporters before a name is hidden pending review
const LIST_STALE = 60 * 86400000;  // leagues idle this long drop out of search
const SUBMIT_GAP = 5000;           // ms between leaderboard posts from one profile
const safeEq = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; };
async function sha(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s))); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
const monthKey = t => new Date(t).toISOString().slice(0, 7);
const prevMonth = m => { const [y, mo] = m.split('-').map(Number); return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`; };
const monthEnd = m => { const [y, mo] = m.split('-').map(Number); return Date.UTC(mo === 12 ? y + 1 : y, mo === 12 ? 0 : mo, 1); };
const MONTH_RE = /^\d{4}-\d{2}$/;
const monthSort = (a, b) => (b.titles - a.titles) || (b.playoffs - a.playoffs) || (b.conf - a.conf) || (b.w - a.w) || (a.at - b.at);
const rowSort = (a, b) => (b.titles - a.titles) || (b.playoffs - a.playoffs) || (b.conf - a.conf) || ((b.w / Math.max(1, b.w + b.l)) - (a.w / Math.max(1, a.w + a.l))) || (b.w - a.w) || (a.since - b.since);

export class Directory {
  constructor(state, env) { this.s = state.storage; this.env = env || {}; this.q = Promise.resolve(); }
  fetch(req) {
    const run = this.q.then(() => this.handle(req)).catch(e => json({ error: 'server error', detail: String(e && e.message || e).slice(0, 200) }, 500));
    this.q = run.then(() => {}, () => {});
    return run;
  }
  async list(prefix) { return this.s.list ? await this.s.list({ prefix }) : new Map(); }

  async handle(req) {
    const url = new URL(req.url); const path = url.pathname.replace(/\/+$/, '') || '/';
    let body = {};
    if (req.method === 'POST') { const t = await req.text(); if (t) { try { body = JSON.parse(t); } catch (e) { return json({ error: 'bad json' }, 400); } } if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'bad json' }, 400); }

    // ---- called by league objects whenever a listed league changes
    if (path === '/sync' && req.method === 'POST') {
      const id = String(body.id || ''); if (!LID_RE.test(id)) return json({ error: 'bad id' }, 400);
      const key = 'L:' + id; const old = await this.s.get(key);
      if (body.op === 'del') { if (old) await this.s.delete(key); return json({ ok: true }); }
      const L = body.league || {};
      const ent = { id, name: clean(L.name, 40) || 'League', coaches: (Array.isArray(L.coaches) ? L.coaches : []).slice(0, 12).map(c => ({ tid: int(c.tid, 999), name: clean(c.name, 28) })), max: int(L.max, 12) || 12, season: int(L.season, 9999), label: clean(L.label, 40), app: clean(L.app, 20), created: int(L.created, 1e15), updated: Date.now(), hidden: !!(old && old.hidden) };
      await this.s.put(key, ent);
      return json({ ok: true });
    }

    // ---- league search
    if (path === '/leagues' && req.method === 'GET') {
      const q = clean(url.searchParams.get('q'), 40).toLowerCase(); const now = Date.now();
      const all = await this.list('L:'); const out = []; const stale = [];
      for (const [k, L] of all) {
        if (now - (L.updated || 0) > LIST_STALE) { stale.push(k); continue; }
        if (L.hidden) continue;
        if (q) { const hay = [L.id.toLowerCase(), L.name.toLowerCase()].concat(L.coaches.map(c => c.name.toLowerCase())); if (!hay.some(h => h.includes(q))) continue; }
        out.push(L);
      }
      if (stale.length) { try { for (let i = 0; i < stale.length; i += 100) await this.s.delete(stale.slice(i, i + 100)); } catch (e) {} }
      out.sort((a, b) => (q && (b.id.toLowerCase() === q) - (a.id.toLowerCase() === q)) || ((a.coaches.length >= a.max) - (b.coaches.length >= b.max)) || (b.updated - a.updated));
      return json({ ok: true, leagues: out.slice(0, 30).map(L => ({ id: L.id, name: L.name, coaches: L.coaches, open: Math.max(0, L.max - L.coaches.length), season: L.season, label: L.label, app: L.app, updated: L.updated })) });
    }

    // ---- leaderboard
    if (path === '/top' && req.method === 'GET' && url.searchParams.get('period') === 'month') {
      // this month's race: only what coaches won since the month began (UTC)
      const now = Date.now(); let m = url.searchParams.get('m') || monthKey(now); if (!MONTH_RE.test(m)) m = monthKey(now);
      const n = Math.min(int(url.searchParams.get('n'), TOP_N) || 100, TOP_N);
      const rows = (await this.s.get('M:' + m)) || []; const pm = prevMonth(m); const prev = (await this.s.get('M:' + pm)) || [];
      return json({ ok: true, period: 'month', month: m, ends: monthEnd(m), rows: rows.slice(0, n), total: rows.length, prev: { month: pm, rows: prev.slice(0, 3) } });
    }
    if (path === '/top' && req.method === 'GET' && url.searchParams.get('sort') === 'long') {
      const top = (await this.s.get('topLong')) || [];
      const n = Math.min(int(url.searchParams.get('n'), TOP_N) || 100, TOP_N);
      return json({ ok: true, sort: 'long', rows: top.slice(0, n), total: top.length });
    }
    if (path === '/top' && req.method === 'GET') {
      const top = (await this.s.get('top')) || [];
      const n = Math.min(int(url.searchParams.get('n'), TOP_N) || 100, TOP_N);
      return json({ ok: true, rows: top.slice(0, n), total: top.length, updated: (await this.s.get('topAt')) || 0 });
    }
    if (path === '/profile' && req.method === 'POST') {
      const pid = String(body.pid || ''); const token = String(body.token || '');
      if (!PID_RE.test(pid) || token.length < 16 || token.length > 80) return json({ error: 'bad profile' }, 400);
      const name = clean(body.name, 24);
      if (!name) return json({ error: 'name required' }, 400);
      if (badName(name)) return json({ error: 'That name is not allowed. Pick a different one.' }, 400);
      const th = await sha(token); const pk = 'P:' + pid; const now = Date.now();
      let P = await this.s.get(pk);
      if (P && !safeEq(P.th, th)) return json({ error: 'unauthorized' }, 401);
      if (P && now - (P.last || 0) < SUBMIT_GAP && !body.force) return json({ ok: true, throttled: true, rank: await this.rankOf(pid) });
      if (!P) P = { pid, th, created: now, hidden: false };
      const renamed = P.name && P.name !== name;
      P.name = name; P.last = now;
      let gain = null;
      const d = body.dyn;
      if (d && typeof d === 'object') {
        const did = String(d.did || '');
        if (!DID_RE.test(did)) return json({ error: 'bad dynasty' }, 400);
        const dk = 'D:' + pid + ':' + did; const old = await this.s.get(dk);
        if (!old) { const mine = await this.list('D:' + pid + ':'); if (mine.size >= MAX_DYN) return json({ error: 'too many dynasties' }, 409); }
        const seasons = int(d.seasons, 1000);
        const row = { did, tid: int(d.tid, 999), seasons, titles: Math.min(int(d.titles, 1000), seasons), playoffs: Math.min(int(d.playoffs, 1000), seasons), conf: Math.min(int(d.conf, 1000), seasons), w: int(d.w, seasons * 17 + 17), l: int(d.l, seasons * 17 + 17), online: !!d.online, diff: clean(d.diff, 12), season: int(d.season, 9999), at: now };
        if (old) {
          // a season takes real time to play: allow at most one new season per two minutes since the last post
          const allowed = old.seasons + 1 + Math.floor((now - (old.at || now)) / 120000);
          if (row.seasons > allowed) { row.seasons = allowed; ['titles', 'playoffs', 'conf'].forEach(k => { row[k] = Math.min(row[k], Math.max(old[k], 0) + (allowed - old.seasons)); }); }
        }
        await this.s.put(dk, row);
        // monthly race credit: what changed since this dynasty's last post. A dynasty's first post only counts
        // its most recent achievements (at most one of each), so old dynasties can't flood a new month.
        gain = old ? { titles: Math.max(0, row.titles - old.titles), playoffs: Math.max(0, row.playoffs - old.playoffs), conf: Math.max(0, row.conf - old.conf), w: Math.max(0, row.w - old.w), l: Math.max(0, row.l - old.l), seasons: Math.max(0, row.seasons - old.seasons) }
          : { titles: Math.min(row.titles, 1), playoffs: Math.min(row.playoffs, 1), conf: Math.min(row.conf, 1), w: 0, l: 0, seasons: 0 };
        if (!Object.values(gain).some(v => v > 0)) gain = null;
      }
      await this.s.put(pk, P);
      if (!P.hidden && (gain || renamed)) await this.monthAdd(pid, P, gain, now);
      const rank = await this.refresh(pid, P);
      return json({ ok: true, rank, hidden: !!P.hidden });
    }
    if (path === '/forget' && req.method === 'POST') {
      const pid = String(body.pid || ''); if (!PID_RE.test(pid)) return json({ error: 'bad profile' }, 400);
      const P = await this.s.get('P:' + pid); if (!P) return json({ ok: true });
      if (!safeEq(P.th, await sha(String(body.token || '')))) return json({ error: 'unauthorized' }, 401);
      const mine = [...(await this.list('D:' + pid + ':')).keys()];
      for (let i = 0; i < mine.length; i += 100) await this.s.delete(mine.slice(i, i + 100));
      await this.s.delete('P:' + pid);
      await this.dropTop(pid); await this.dropMonth(pid);
      return json({ ok: true });
    }

    // ---- reports
    if (path === '/report' && req.method === 'POST') {
      let kind = String(body.kind || '');
      if (!['league', 'profile', 'coach'].includes(kind)) return json({ error: 'bad kind' }, 400);
      let target = clean(body.target, 60); if (!target) return json({ error: 'bad target' }, 400);
      // a coach name shows up on its league's card, so coach reports count toward that league
      let rname = clean(body.name, 60);
      if (kind === 'coach') { kind = 'league'; rname = 'coach: ' + rname; target = target.split(':')[0].toUpperCase(); }
      if (kind === 'league' && !LID_RE.test(target.toUpperCase())) return json({ error: 'bad target' }, 400);
      if (kind === 'league') target = target.toUpperCase();
      const from = await sha('r:' + clean(body.from, 80) + ':' + (req.headers.get('cf-connecting-ip') || ''));
      const rk = 'R:' + kind + ':' + target; const now = Date.now();
      const R = (await this.s.get(rk)) || { kind, target, name: rname, reasons: [], from: [], first: now, status: 'open' };
      if (rname && R.name !== rname && !R.name.includes(rname)) R.name = (R.name + ' / ' + rname).slice(0, 200);
      if (!R.from.includes(from)) { R.from.push(from); R.from = R.from.slice(-50); }
      R.reasons.push((clean(body.reason, 200) || 'offensive name') + (rname ? ' [' + rname + ']' : '')); R.reasons = R.reasons.slice(-20); R.last = now;
      if (R.status === 'dismissed' && R.from.length > (R.dismissedAt || 0) + HIDE_AT) R.status = 'open';
      if (R.status === 'open' && R.from.length >= HIDE_AT) { await this.hide(kind, target, true); R.status = 'hidden'; }
      await this.s.put(rk, R);
      return json({ ok: true });
    }

    // ---- moderation (needs the ADMIN_KEY secret)
    if (path.startsWith('/admin/')) {
      const key = req.method === 'GET' ? url.searchParams.get('key') : body.key;
      if (!this.env.ADMIN_KEY || !safeEq(String(key || ''), String(this.env.ADMIN_KEY))) return json({ error: 'forbidden' }, 403);
      if (path === '/admin/reports') { const all = [...(await this.list('R:')).values()].filter(r => url.searchParams.get('all') ? true : r.status !== 'dismissed').sort((a, b) => b.last - a.last); return json({ ok: true, reports: all.slice(0, 200).map(r => ({ kind: r.kind, target: r.target, name: r.name, count: r.from.length, reasons: r.reasons.slice(-5), status: r.status, last: r.last })) }); }
      if (path === '/admin/act' && req.method === 'POST') {
        const kind = String(body.kind || ''); const target = clean(body.target, 60); const act = String(body.action || '');
        if (!['league', 'profile', 'coach'].includes(kind) || !target || !['hide', 'restore', 'dismiss'].includes(act)) return json({ error: 'bad request' }, 400);
        const rk = 'R:' + kind + ':' + target; const R = await this.s.get(rk);
        if (act === 'hide') await this.hide(kind, target, true);
        if (act === 'restore' || act === 'dismiss') await this.hide(kind, target, false);
        if (R) { R.status = act === 'hide' ? 'hidden' : 'dismissed'; if (act !== 'hide') R.dismissedAt = R.from.length; await this.s.put(rk, R); }
        return json({ ok: true });
      }
      return json({ error: 'not found' }, 404);
    }
    return json({ error: 'not found' }, 404);
  }

  async hide(kind, target, on) {
    if (kind === 'league' || kind === 'coach') {
      const id = target.split(':')[0].toUpperCase(); const L = await this.s.get('L:' + id);
      if (L) { L.hidden = on; await this.s.put('L:' + id, L); }
    } else if (kind === 'profile') {
      const P = await this.s.get('P:' + target);
      if (P) { P.hidden = on; await this.s.put('P:' + target, P); if (on) { await this.dropTop(target); await this.dropMonth(target); } else await this.refresh(target, P); }
    }
  }
  async monthAdd(pid, P, gain, now) {
    const mk = 'M:' + monthKey(now); let rows = (await this.s.get(mk)) || [];
    let r = rows.find(x => x.pid === pid);
    if (!r) { if (!gain) return; r = { pid, titles: 0, playoffs: 0, conf: 0, w: 0, l: 0, seasons: 0, at: now }; rows.push(r); }
    r.name = P.name;
    if (gain) { Object.keys(gain).forEach(k => { r[k] = (r[k] || 0) + gain[k]; }); if (gain.titles || gain.playoffs || gain.conf) r.at = now; }
    rows.sort(monthSort); rows = rows.slice(0, TOP_N);
    await this.s.put(mk, rows);
  }
  async dropMonth(pid) { const now = Date.now(); for (const m of [monthKey(now), prevMonth(monthKey(now))]) { const rows = (await this.s.get('M:' + m)) || []; const nr = rows.filter(r => r.pid !== pid); if (nr.length !== rows.length) await this.s.put('M:' + m, nr); } }
  async dropTop(pid) { const top = (await this.s.get('top')) || []; const nt = top.filter(r => r.pid !== pid); const lg = (await this.s.get('topLong')) || []; const nl = lg.filter(r => r.pid !== pid); if (nt.length !== top.length || nl.length !== lg.length) await this.s.put({ top: nt, topAt: Date.now(), topLong: nl }); }
  async rankOf(pid) { const top = (await this.s.get('top')) || []; const i = top.findIndex(r => r.pid === pid); return i < 0 ? null : i + 1; }
  // recompute one profile's totals and its place in the cached top list
  async refresh(pid, P) {
    const dyn = [...(await this.list('D:' + pid + ':')).values()];
    const agg = { pid, name: P.name, titles: 0, playoffs: 0, conf: 0, w: 0, l: 0, seasons: 0, dynasties: dyn.length, online: false, best: null, longest: null, since: P.created };
    dyn.forEach(d => { agg.titles += d.titles; agg.playoffs += d.playoffs; agg.conf += d.conf; agg.w += d.w; agg.l += d.l; agg.seasons += d.seasons; if (d.online && d.titles) agg.online = true; if (!agg.best || d.titles > agg.best.titles || (d.titles === agg.best.titles && d.seasons > agg.best.seasons)) agg.best = { tid: d.tid, titles: d.titles, seasons: d.seasons, online: d.online }; if (!agg.longest || d.seasons > agg.longest.seasons || (d.seasons === agg.longest.seasons && d.titles > agg.longest.titles)) agg.longest = { tid: d.tid, seasons: d.seasons, titles: d.titles, w: d.w, l: d.l, season: d.season }; });
    let top = ((await this.s.get('top')) || []).filter(r => r.pid !== pid);
    if (!P.hidden && agg.seasons > 0) { top.push(agg); top.sort(rowSort); top = top.slice(0, TOP_N); }
    // longest single dynasty board
    let long = ((await this.s.get('topLong')) || []).filter(r => r.pid !== pid);
    if (!P.hidden && agg.longest && agg.longest.seasons > 0) { long.push({ pid, name: P.name, longest: agg.longest, titles: agg.titles, dynasties: agg.dynasties, since: P.created }); long.sort((a, b) => (b.longest.seasons - a.longest.seasons) || (b.longest.titles - a.longest.titles) || (a.since - b.since)); long = long.slice(0, TOP_N); }
    await this.s.put({ top, topAt: Date.now(), topLong: long });
    const i = top.findIndex(r => r.pid === pid); return i < 0 ? null : i + 1;
  }
}
