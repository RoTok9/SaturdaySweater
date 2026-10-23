// Local stand-in for the Worker, for tests: same code, in-memory storage that copies values like the real one, plain http.
// Usage: node mock.mjs [port] [--latency=ms] [--fail=0.05]
//   --latency adds a random delay to each storage call (shakes out ordering bugs)
//   --fail makes that fraction of storage writes throw (shakes out crash-safety bugs)
import http from 'node:http';
import worker, { League } from './src/index.js';
const args = Object.fromEntries(process.argv.slice(3).map(a => a.replace(/^--/, '').split('=')));
const LAT = +args.latency || 0, FAIL = +args.fail || 0;
const wait = () => LAT ? new Promise(r => setTimeout(r, Math.random() * LAT)) : null;
const clone = v => v === undefined ? undefined : structuredClone(v);
class Storage {
  constructor() { this.m = new Map(); this.alarmAt = null; }
  async get(k) { await wait(); if (Array.isArray(k)) { if (k.length > 128) throw new Error('too many keys'); const out = new Map(); k.forEach(x => { if (this.m.has(x)) out.set(x, clone(this.m.get(x))); }); return out; } return clone(this.m.get(k)); }
  async put(a, b) { await wait(); if (FAIL && Math.random() < FAIL) throw new Error('injected storage failure'); if (typeof a === 'object') { const ks = Object.keys(a); if (ks.length > 128) throw new Error('too many keys'); for (const k of ks) { const s = JSON.stringify(a[k]); if (s && s.length > 2 * 1024 * 1024) throw new Error('value too large: ' + k); } for (const k of ks) this.m.set(k, clone(a[k])); } else this.m.set(a, clone(b)); }
  async delete(k) { await wait(); if (Array.isArray(k)) { let n = 0; k.forEach(x => { if (this.m.delete(x)) n++; }); return n; } return this.m.delete(k); }
  async deleteAll() { this.m.clear(); this.alarmAt = null; }
  async setAlarm(t) { this.alarmAt = t; }
  async getAlarm() { return this.alarmAt; }
}
const objs = new Map();
export const env = { LEAGUE: { idFromName: n => n, get: id => { if (!objs.has(id)) objs.set(id, new League({ storage: new Storage() }, env)); const o = objs.get(id); return { fetch: r => o.fetch(r) }; } } };
export const _objs = objs;
const port = +process.argv[2] || 8787;
if (!process.env.NO_LISTEN) http.createServer((req, res) => {
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', async () => {
    try {
      const body = Buffer.concat(chunks).toString('utf8');
      const r = await worker.fetch(new Request('http://localhost' + req.url, { method: req.method, headers: req.headers, body: req.method === 'POST' ? body : undefined }), env);
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
    } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: String(e) })); }
  });
}).listen(port, () => console.log('mock league server on', port, LAT ? `latency ${LAT}ms` : '', FAIL ? `fail ${FAIL}` : ''));
