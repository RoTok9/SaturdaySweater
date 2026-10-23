// Saturday Sweater league server: one Durable Object per league.
// Holds the shared save (base), each coach's pending week (delta), ready flags and a version counter.
// The game client runs the sim; the last coach to ready up merges everyone's week and uploads the new base.
//
// Robustness notes
// - Every request to a league is handled one at a time (a promise-chain lock), and the request body is read
//   before any state is loaded, so two coaches hitting the server at once can never interleave a read-modify-write.
// - The save is stored in chunks under a per-version prefix. New chunks are written first, then one atomic put flips
//   the pointer together with meta, coaches and ready flags, then old chunks are deleted. A crash at any point leaves
//   either the old save or the new one, never a torn mix.
// - Each coach's delta lives under its own key, so a big league never hits the per-value size limit.
// - Inputs are validated (team ids, sizes, names), errors always come back as JSON with CORS headers,
//   and idle leagues clean themselves up with an alarm.
export const SERVER_VERSION = 2;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const json = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, CORS) });
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rnd = n => { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; };
const code = () => [...rnd(6)].map(x => ALPHA[x % ALPHA.length]).join('');
const tok = () => [...rnd(16)].map(x => x.toString(16).padStart(2, '0')).join('');
const ID_RE = /^[A-Z0-9]{6}$/;
const CHUNK = 100000;              // characters per stored chunk
const MAX_BODY = 16 * 1024 * 1024; // whole request
const MAX_BASE = 12 * 1024 * 1024; // shared save
const MAX_DELTA = 2 * 1024 * 1024; // one coach's week
const MAX_COACHES = 12;
const MAX_TID = 1000;
const IDLE_MS = 180 * 86400000;    // leagues untouched for 180 days are deleted
const PUT_BATCH = 100;             // keys per storage.put (limit is 128)

const validTid = t => Number.isInteger(t) && t >= 0 && t < MAX_TID;
const cleanName = (s, n, d) => { const v = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n); return v || d; };
const safeEq = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; };
const smallMeta = m => { if (!m || typeof m !== 'object' || Array.isArray(m)) return {}; const s = JSON.stringify(m); return s.length > 20000 ? {} : JSON.parse(s); };

export default {
  async fetch(req, env) {
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      const url = new URL(req.url); const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'health' || parts.length === 0) return json({ ok: true, t: Date.now(), v: SERVER_VERSION });
      if (parts[0] !== 'leagues') return json({ error: 'not found' }, 404);
      if (!['GET', 'POST'].includes(req.method)) return json({ error: 'method' }, 405);
      const len = +req.headers.get('content-length') || 0;
      if (len > MAX_BODY) return json({ error: 'too large' }, 413);
      const body = req.method === 'POST' ? await req.text() : undefined;
      if (body && body.length > MAX_BODY) return json({ error: 'too large' }, 413);
      let id = parts[1];
      if (!id) {
        if (req.method !== 'POST') return json({ error: 'method' }, 405);
        // pick an unused code; the create itself is atomic inside the object, so a collision just retries here
        for (let i = 0; i < 8; i++) {
          id = code();
          const r = await env.LEAGUE.get(env.LEAGUE.idFromName(id)).fetch(new Request('https://do/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-league-id': id }, body }));
          if (r.status !== 409) return r;
        }
        return json({ error: 'could not allocate a league code, try again' }, 503);
      }
      id = String(id).toUpperCase();
      if (!ID_RE.test(id)) return json({ error: 'no such league' }, 404);
      const sub = '/' + parts.slice(2).join('/');
      if (sub === '/create') return json({ error: 'not found' }, 404);
      const stub = env.LEAGUE.get(env.LEAGUE.idFromName(id));
      return await stub.fetch(new Request('https://do' + sub + url.search, { method: req.method, headers: { 'Content-Type': 'application/json', 'x-league-id': id }, body }));
    } catch (e) {
      return json({ error: 'server error', detail: String(e && e.message || e).slice(0, 200) }, 500);
    }
  }
};

export class League {
  constructor(state, env) { this.state = state; this.s = state.storage; this.q = Promise.resolve(); }

  // one request at a time per league
  fetch(req) {
    const run = this.q.then(() => this.handle(req)).catch(e => json({ error: 'server error', detail: String(e && e.message || e).slice(0, 200) }, 500));
    this.q = run.then(() => {}, () => {});
    return run;
  }

  async alarm() {
    const meta = await this.s.get('meta');
    if (!meta) return;
    if (Date.now() - (meta.updated || 0) >= IDLE_MS) { await this.s.deleteAll(); return; }
    await this.arm(meta);
  }
  async arm(meta) { if (this.s.setAlarm) { try { await this.s.setAlarm((meta.updated || Date.now()) + IDLE_MS); } catch (e) {} } }

  async putMany(ents) { const ks = Object.keys(ents); for (let i = 0; i < ks.length; i += PUT_BATCH) { const o = {}; ks.slice(i, i + PUT_BATCH).forEach(k => { o[k] = ents[k]; }); await this.s.put(o); } }
  async delMany(keys) { for (let i = 0; i < keys.length; i += PUT_BATCH) { const ks = keys.slice(i, i + PUT_BATCH); if (ks.length) await this.s.delete(ks); } }

  async getBase(meta) {
    const b = meta.base; if (!b || !b.n) return null;
    const ks = []; for (let i = 0; i < b.n; i++) ks.push(`b${b.v}:${i}`);
    let out = '';
    for (let i = 0; i < ks.length; i += PUT_BATCH) { const m = await this.s.get(ks.slice(i, i + PUT_BATCH)); for (const k of ks.slice(i, i + PUT_BATCH)) { const part = m.get(k); if (part == null) throw new Error('save chunk missing'); out += part; } }
    return out;
  }
  // writes the new save's chunks (not yet visible) and returns the pointer to commit with meta
  async stageBase(str, ver) {
    const n = Math.ceil(str.length / CHUNK); const ents = {};
    for (let i = 0; i < n; i++) ents[`b${ver}:${i}`] = str.slice(i * CHUNK, (i + 1) * CHUNK);
    await this.putMany(ents);
    return { v: ver, n, len: str.length };
  }
  async dropBase(ptr) { if (!ptr || !ptr.n) return; const ks = []; for (let i = 0; i < ptr.n; i++) ks.push(`b${ptr.v}:${i}`); await this.delMany(ks); }

  async getDeltas(coaches) { const ids = Object.keys(coaches); if (!ids.length) return {}; const m = await this.s.get(ids.map(t => 'd:' + t)); const out = {}; ids.forEach(t => { const d = m.get('d:' + t); if (d != null) out[t] = d; }); return out; }

  async handle(req) {
    const url = new URL(req.url); const path = url.pathname.replace(/\/+$/, '') || '/'; const id = req.headers.get('x-league-id');
    // read the body before touching state
    let body = {};
    if (req.method === 'POST') { const t = await req.text(); if (t) { try { body = JSON.parse(t); } catch (e) { return json({ error: 'bad json' }, 400); } } if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'bad json' }, 400); }
    let meta = await this.s.get('meta');
    if (path === '/exists') return json({ exists: !!meta });

    if (path === '/create') {
      if (req.method !== 'POST') return json({ error: 'method' }, 405);
      if (meta) return json({ error: 'exists' }, 409);
      const c0 = body.coach || {}; const tid = c0.tid;
      if (typeof body.base !== 'string' || !body.base) return json({ error: 'missing base' }, 400);
      if (body.base.length > MAX_BASE) return json({ error: 'save too large' }, 413);
      if (!validTid(tid)) return json({ error: 'bad team' }, 400);
      const token = tok(); const now = Date.now();
      const ptr = await this.stageBase(body.base, 1);
      meta = { id, name: cleanName(body.name, 40, 'League'), version: 1, created: now, updated: now, meta: smallMeta(body.meta), commissioner: tid, base: ptr };
      const coaches = { [tid]: { tid, name: cleanName(c0.name, 28, 'Coach'), token, ready: false, joined: now, seen: now } };
      await this.s.put({ meta, coaches });
      await this.arm(meta);
      return json({ id, token, version: 1, meta: meta.meta, name: meta.name });
    }
    if (!meta) return json({ error: 'no such league' }, 404);
    const coaches = (await this.s.get('coaches')) || {};
    const pub = () => Object.values(coaches).map(c => ({ tid: c.tid, name: c.name, ready: !!c.ready, joined: c.joined, seen: c.seen || c.joined })).sort((a, b) => a.joined - b.joined);
    const auth = () => { if (!validTid(body.tid)) return null; const c = coaches[body.tid]; return c && safeEq(c.token, body.token) ? c : null; };
    const touch = () => { meta.updated = Date.now(); };
    const state = extra => Object.assign({ ok: true, id, name: meta.name, version: meta.version, meta: meta.meta, coaches: pub(), commissioner: meta.commissioner, updated: meta.updated }, extra || {});

    if (path === '/') {
      if (req.method !== 'GET') return json({ error: 'method' }, 405);
      const since = url.searchParams.get('since');
      const out = state();
      if (since != null && +since === meta.version) { out.unchanged = true; return json(out); }
      if (url.searchParams.get('deltas') === '1') out.deltas = await this.getDeltas(coaches);
      if (url.searchParams.get('base') === '1') out.base = await this.getBase(meta);
      return json(out);
    }
    if (req.method !== 'POST') return json({ error: 'method' }, 405);

    if (path === '/join') {
      const tid = body.tid;
      if (!validTid(tid)) return json({ error: 'bad team' }, 400);
      if (coaches[tid]) return json({ error: 'team taken' }, 409);
      if (Object.keys(coaches).length >= MAX_COACHES) return json({ error: 'league full' }, 409);
      const token = tok(); const now = Date.now();
      // the joiner registers their team in the shared save with /register; until then nobody can advance past them
      coaches[tid] = { tid, name: cleanName(body.name, 28, 'Coach'), token, ready: false, joined: now, seen: now, pending: true };
      touch();
      await this.s.put({ coaches, meta });
      return json(state({ token }));
    }

    const c = auth();
    if (!c) return json({ error: 'unauthorized' }, 401);
    c.seen = Date.now();

    if (path === '/register') {
      // a new coach uploads the save with their team added. Everyone else keeps their pending week and ready flag.
      if (body.version !== meta.version) return json(state({ error: 'stale' }), 409);
      if (typeof body.base !== 'string' || !body.base) return json({ error: 'missing base' }, 400);
      if (body.base.length > MAX_BASE) return json({ error: 'save too large' }, 413);
      const old = meta.base; const v = meta.version + 1;
      meta.base = await this.stageBase(body.base, v);
      delete c.pending; c.ready = false; meta.version = v; touch();
      meta.meta = Object.assign({}, meta.meta, smallMeta(body.meta), { joined: ((meta.meta && meta.meta.joined) || []).concat([{ tid: c.tid, name: c.name, v }]).slice(-30) });
      await this.s.put({ meta, coaches });
      await this.dropBase(old); await this.arm(meta);
      return json(state());
    }

    if (path === '/ready') {
      if (body.version !== meta.version) return json(state({ error: 'stale' }), 409);
      if (c.pending) return json({ error: 'not registered' }, 409);
      if (body.ready === false) { c.ready = false; await this.s.put({ coaches }); await this.s.delete('d:' + c.tid); }
      else {
        if (body.delta == null || typeof body.delta !== 'object') return json({ error: 'missing delta' }, 400);
        if (JSON.stringify(body.delta).length > MAX_DELTA) return json({ error: 'week too large' }, 413);
        c.ready = true;
        if (validTid(body.tidNow) && body.tidNow !== c.tid) c.next = body.tidNow; else delete c.next;
        await this.s.put({ coaches, ['d:' + c.tid]: body.delta });
      }
      const allReady = Object.values(coaches).every(x => x.ready);
      return json(state({ allReady }));
    }

    if (path === '/advance') {
      if (body.version !== meta.version) return json(state({ error: 'stale' }), 409);
      if (typeof body.base !== 'string' || !body.base) return json({ error: 'missing base' }, 400);
      if (body.base.length > MAX_BASE) return json({ error: 'save too large' }, 413);
      const allReady = Object.values(coaches).every(x => x.ready);
      const canForce = body.force === true && meta.commissioner === c.tid;
      if (!allReady && !canForce) return json(state({ error: 'not all ready' }), 409);
      const old = meta.base; const v = meta.version + 1;
      meta.base = await this.stageBase(body.base, v);
      const oldDeltaKeys = Object.keys(coaches).map(t => 'd:' + t);
      // coaches who took a new job this week move to their new team id
      const moved = [];
      Object.values(coaches).forEach(x => { if (x.next != null && !coaches[x.next]) { const nt = x.next; delete coaches[x.tid]; if (meta.commissioner === x.tid) meta.commissioner = nt; moved.push({ from: x.tid, to: nt, v }); x.tid = nt; coaches[nt] = x; } delete x.next; x.ready = false; });
      meta.version = v; touch(); meta.lastAdvance = { by: c.tid, t: Date.now() };
      meta.meta = Object.assign({}, smallMeta(body.meta), { joined: (meta.meta && meta.meta.joined) || [], kicked: (meta.meta && meta.meta.kicked) || [], moved: ((meta.meta && meta.meta.moved) || []).concat(moved).slice(-30) });
      await this.s.put({ meta, coaches });
      await this.delMany(oldDeltaKeys); await this.dropBase(old); await this.arm(meta);
      return json(state({ moved }));
    }

    if (path === '/kick' || path === '/leave') {
      const target = path === '/leave' ? c.tid : body.target;
      if (path === '/kick' && meta.commissioner !== c.tid) return json({ error: 'only the commissioner can remove a coach' }, 403);
      if (!validTid(target) || !coaches[target] || (path === '/kick' && target === c.tid)) return json({ error: 'bad target' }, 400);
      delete coaches[target];
      if (!Object.keys(coaches).length) { await this.s.deleteAll(); return json({ ok: true, deleted: true }); }
      if (meta.commissioner === target) meta.commissioner = pub()[0].tid;
      meta.version++; touch();
      meta.meta = Object.assign({}, meta.meta, { kicked: ((meta.meta && meta.meta.kicked) || []).concat([{ tid: target, v: meta.version, left: path === '/leave' }]).slice(-30) });
      // everyone else keeps their pending week and ready flag
      await this.s.put({ coaches, meta }); await this.s.delete('d:' + target); await this.arm(meta);
      return json(state({ allReady: Object.values(coaches).every(x => x.ready) }));
    }
    return json({ error: 'not found' }, 404);
  }
}
