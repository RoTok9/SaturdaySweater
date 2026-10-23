// League server tests: validation, auth, races, crash safety. Runs in-process against the mock storage.
// node test/stress.mjs            normal storage
// node test/stress.mjs --chaos    random storage latency and injected write failures
process.env.NO_LISTEN = '1';
const chaos = process.argv.includes('--chaos');
process.argv = [process.argv[0], 'mock', '0', ...(chaos ? ['--latency=8', '--fail=0.04'] : ['--latency=2'])];
const { env } = await import('../mock.mjs');
const worker = (await import('../src/index.js')).default;

let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('FAIL:', msg); } };
const call = async (path, body, method) => {
  const r = await worker.fetch(new Request('http://x' + path, { method: method || (body !== undefined ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) }), env);
  let j = null; try { j = await r.json(); } catch (e) {}
  return { status: r.status, j: j || {}, cors: r.headers.get('Access-Control-Allow-Origin') };
};
// with injected failures any write may 500; retry like a client would
const retry = async (fn, tries = 12) => { let r; for (let i = 0; i < tries; i++) { r = await fn(); if (r.status !== 500) return r; } return r; };
const bigStr = (n, seed) => { let s = ''; const a = 'abcdefghijklmnopqrstuvwxyz0123456789'; let x = seed; while (s.length < n) { x = (x * 1103515245 + 12345) & 0x7fffffff; s += a[x % a.length].repeat(50); } return s.slice(0, n); };

// ---------- validation ----------
{
  ok((await call('/health')).j.ok, 'health');
  ok((await call('/nope')).status === 404, '404 route');
  ok((await call('/leagues/ab')).status === 404, 'bad id format');
  ok((await call('/leagues/ZZZZZZ')).status === 404, 'unknown league');
  ok((await call('/leagues', 'not json')).status === 400, 'bad json create');
  ok((await call('/leagues', { name: 'x', coach: { tid: '__proto__' }, base: 'b' })).status === 400, 'proto tid rejected');
  ok((await call('/leagues', { name: 'x', coach: { tid: -1 }, base: 'b' })).status === 400, 'negative tid');
  ok((await call('/leagues', { name: 'x', coach: { tid: 3 } })).status === 400, 'missing base');
  ok((await call('/leagues', { name: 'x', coach: { tid: 3 }, base: bigStr(13 * 1024 * 1024, 1) })).status === 413, 'base too large');
  const r = await call('/leagues', {}, 'DELETE'); ok(r.status === 405 && r.cors === '*', 'method + cors on error');
}

// ---------- create, join, register, ready, advance ----------
const base0 = bigStr(450000, 7);
const cr = await retry(() => call('/leagues', { name: '<b>Test</b> League', coach: { tid: 10, name: 'Alpha' }, base: base0, meta: { week: 1 } }));
ok(cr.status === 200 && /^[A-Z0-9]{6}$/.test(cr.j.id), 'create ' + JSON.stringify(cr.j).slice(0, 100));
ok(!/[<>]/.test(cr.j.name), 'name sanitized');
const L = '/leagues/' + cr.j.id; const tokA = cr.j.token;
{
  const g = await call(L + '?base=1'); ok(g.j.base === base0, 'base roundtrip (chunked)'); ok(g.j.version === 1, 'v1');
  ok((await call(L.toLowerCase())).status === 200, 'lowercase id works');
  ok((await call(L + '?since=1')).j.unchanged === true, 'since=version short response');
}
// concurrent joins: 11 coaches race for 11 seats, plus duplicates for the same team
const joins = await Promise.all([...Array(14)].map((_, i) => retry(() => call(L + '/join', { tid: 20 + (i % 11), name: 'Coach ' + i }))));
const tokens = {};
joins.forEach((r, i) => { if (r.status === 200) tokens[20 + (i % 11)] = r.j.token; });
ok(Object.keys(tokens).length === 11, 'exactly one coach per team: ' + Object.keys(tokens).length);
ok(joins.filter(r => r.status === 409).length === 3, 'duplicate team joins rejected');
ok((await call(L + '/join', { tid: 99 })).j.error === 'league full', 'league full at 12');
{
  const st = await call(L); ok(st.j.coaches.length === 12, '12 coaches'); ok(st.j.version === 1, 'joins do not bump version');
  ok((await call(L + '/ready', { tid: 20, token: tokens[20], version: 1, delta: {} })).j.error === 'not registered', 'pending coach cannot ready');
  ok((await call(L + '/advance', { tid: 10, token: tokA, version: 1, base: 'x' })).status === 409, 'cannot advance past pending coaches');
}
// A readies first; then everyone registers concurrently, each retrying on stale like the client does
ok((await retry(() => call(L + '/ready', { tid: 10, token: tokA, version: 1, delta: { a: 1 } }))).j.ok, 'A ready');
await Promise.all(Object.keys(tokens).map(async t => {
  t = +t; for (let i = 0; i < 40; i++) { const st = await call(L); const r = await call(L + '/register', { tid: t, token: tokens[t], version: st.j.version, base: base0 + '|' + t }); if (r.status === 200) return; if (r.status !== 409 && r.status !== 500) { ok(false, 'register ' + r.status); return; } }
  ok(false, 'register never succeeded ' + t);
}));
let st = await call(L + '?deltas=1');
ok(st.j.version === 12, 'version after 11 registers: ' + st.j.version);
ok(st.j.coaches.find(c => c.tid === 10).ready === true && st.j.deltas[10] && st.j.deltas[10].a === 1, 'A kept ready + delta through registrations');
ok(st.j.meta.joined.length === 11, 'joined log');
// everyone readies concurrently with the right version
let V = st.j.version;
const readies = await Promise.all(Object.keys(tokens).map(t => retry(() => call(L + '/ready', { tid: +t, token: tokens[t], version: V, delta: { t: +t, pad: bigStr(150000, +t) } }))));
ok(readies.every(r => r.status === 200), 'all ready ok');
ok(readies.filter(r => r.j.allReady).length >= 1, 'someone saw allReady');
ok((await call(L + '/ready', { tid: 21, token: 'wrong', version: V, delta: {} })).status === 401, 'bad token');
ok((await call(L + '/ready', { tid: 21, token: tokens[21], version: V - 1, delta: {} })).status === 409, 'stale version');
st = await call(L + '?deltas=1'); ok(Object.keys(st.j.deltas).length === 12, '12 deltas stored separately (1.8MB total)');
// two coaches advance at once: exactly one wins
const adv = await Promise.all([20, 21, 22].map(t => retry(() => call(L + '/advance', { tid: t, token: tokens[t], version: V, base: 'NEW-' + t + bigStr(300000, t), meta: { week: 2 } }))));
ok(adv.filter(r => r.status === 200).length === 1, 'exactly one advance wins: ' + adv.map(r => r.status));
st = await call(L + '?deltas=1&base=1');
const winner = adv.findIndex(r => r.status === 200);
ok(st.j.base.startsWith('NEW-' + (20 + winner)), 'winner base stored');
ok(st.j.version === V + 1 && Object.keys(st.j.deltas).length === 0 && st.j.coaches.every(c => !c.ready), 'advance resets week');
V = st.j.version;

// ---------- force, kick, leave, move ----------
ok((await call(L + '/advance', { tid: 21, token: tokens[21], version: V, base: 'f', force: true })).status === 409, 'non-commissioner cannot force');
await retry(() => call(L + '/ready', { tid: 21, token: tokens[21], version: V, delta: { keep: 1 } }));
await retry(() => call(L + '/ready', { tid: 22, token: tokens[22], version: V, delta: { keep: 2 }, tidNow: 300 }));
ok((await call(L + '/kick', { tid: 21, token: tokens[21], target: 23 })).status === 403, 'only commissioner kicks');
const k = await retry(() => call(L + '/kick', { tid: 10, token: tokA, target: 23 }));
ok(k.status === 200 && k.j.coaches.length === 11, 'kick');
st = await call(L + '?deltas=1');
ok(st.j.deltas[21] && st.j.deltas[21].keep === 1 && st.j.coaches.find(c => c.tid === 21).ready, 'kick keeps other coaches week');
ok(st.j.meta.kicked.some(x => x.tid === 23), 'kick logged');
V = st.j.version;
const lv = await retry(() => call(L + '/leave', { tid: 10, token: tokA }));
ok(lv.status === 200 && lv.j.commissioner !== 10, 'commissioner leaves, role passes on: ' + lv.j.commissioner);
const comm = lv.j.commissioner; V = lv.j.version;
// everyone readies; commissioner can force regardless
const f = await retry(() => call(L + '/advance', { tid: comm, token: tokens[comm], version: V, base: 'FORCED', force: true }));
ok(f.status === 200, 'commissioner force advance');
ok(f.j.moved && f.j.moved.some(m => m.from === 22 && m.to === 300), 'coach who changed jobs moved to new team id');
st = await call(L);
ok(st.j.coaches.some(c => c.tid === 300) && !st.j.coaches.some(c => c.tid === 22), 'coaches re-keyed');
ok((await call(L + '/ready', { tid: 300, token: tokens[22], version: st.j.version, delta: {} })).status === 200, 'moved coach keeps token');
// last coaches leave -> league is deleted
for (const c of st.j.coaches) { const t = c.tid === 300 ? tokens[22] : tokens[c.tid]; await retry(() => call(L + '/leave', { tid: c.tid, token: t })); }
ok((await call(L)).status === 404, 'empty league deleted');

// ---------- crash safety: random ops, base must never tear ----------
{
  const c2 = await retry(() => call('/leagues', { name: 'Crash', coach: { tid: 1, name: 'A' }, base: 'v1:' + bigStr(250000, 1) }));
  const L2 = '/leagues/' + c2.j.id; const t1 = c2.j.token;
  const j2 = await retry(() => call(L2 + '/join', { tid: 2 })); const t2 = j2.j.token;
  let s2 = await call(L2); await retry(() => call(L2 + '/register', { tid: 2, token: t2, version: s2.j.version, base: 'v2:' + bigStr(250000, 2) }));
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    s2 = await call(L2 + '?base=1');
    if (s2.status === 500) continue;
    const b = s2.j.base; const tag = b.slice(0, b.indexOf(':'));
    ok(b === tag + ':' + bigStr(250000, +tag.slice(1)), 'save never torn at ' + tag);
    seen.add(tag);
    const v = s2.j.version;
    await call(L2 + '/ready', { tid: 1, token: t1, version: v, delta: { i } });
    await call(L2 + '/ready', { tid: 2, token: t2, version: v, delta: { i } });
    const nv = 'v' + (v + 1);
    await call(L2 + '/advance', { tid: 1 + (i % 2), token: i % 2 ? t2 : t1, version: v, base: nv + ':' + bigStr(250000, v + 1) });
  }
  ok(seen.size > 10, 'advanced through many versions: ' + seen.size);
}

console.log(`${checks - fails}/${checks} checks passed${chaos ? ' (chaos mode)' : ''}`);
process.exit(fails ? 1 : 0);
