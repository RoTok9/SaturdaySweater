// Directory tests: league search, listing toggle, leaderboard, reports, moderation, name filter.
process.env.NO_LISTEN = '1';
process.argv = [process.argv[0], 'mock', '0', '--latency=1'];
const { env } = await import('../mock.mjs');
const worker = (await import('../src/index.js')).default;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log('FAIL:', msg); } };
const call = async (path, body, method, ip) => {
  const h = { 'Content-Type': 'application/json' }; if (ip) h['cf-connecting-ip'] = ip;
  const r = await worker.fetch(new Request('http://x' + path, { method: method || (body !== undefined ? 'POST' : 'GET'), headers: h, body: body === undefined ? undefined : JSON.stringify(body) }), env);
  let j = null; try { j = await r.json(); } catch (e) {} return { status: r.status, j: j || {} };
};
const hex = n => [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
const search = async q => (await call('/dir/leagues' + (q != null ? '?q=' + encodeURIComponent(q) : ''))).j.leagues || [];

// ---------- league listing ----------
const A = await call('/leagues', { name: 'Thursday Night Crew', coach: { tid: 4, name: 'Coach Rolt' }, base: 'b', listed: true, meta: { season: 2026, label: 'Week 1', app: '1.171.0' } });
ok(A.status === 200 && A.j.listed === true, 'create listed');
const B = await call('/leagues', { name: 'Secret League', coach: { tid: 9, name: 'Hidden Guy' }, base: 'b', listed: false });
ok(B.status === 200 && B.j.listed === false, 'create unlisted');
const C = await call('/leagues', { name: 'Old Style', coach: { tid: 1, name: 'Legacy' }, base: 'b' });
ok(C.status === 200 && !C.j.listed, 'create without flag is unlisted');
let L = await search('');
ok(L.some(x => x.id === A.j.id) && !L.some(x => x.id === B.j.id) && !L.some(x => x.id === C.j.id), 'browse shows only listed');
ok((await search('thursday')).some(x => x.id === A.j.id), 'search by league name');
ok((await search('rolt')).some(x => x.id === A.j.id), 'search by coach name');
ok((await search(A.j.id.toLowerCase())).some(x => x.id === A.j.id), 'search by code');
ok((await search('secret')).length === 0, 'unlisted not searchable');
ok((await search('zzzznothing')).length === 0, 'no match');
const card = (await search('thursday')).find(x => x.id === A.j.id);
ok(card && card.open === 11 && card.coaches.length === 1 && card.season === 2026 && card.label === 'Week 1', 'card fields');
ok(!('token' in card) && !JSON.stringify(card).includes(A.j.token), 'no token leak in card');

// join shows up in the card
const J = await call('/leagues/' + A.j.id + '/join', { tid: 12, name: 'Buddy' });
ok(J.status === 200, 'join');
ok((await search('buddy')).some(x => x.id === A.j.id), 'joined coach searchable');
// listed toggle: commissioner only
ok((await call('/leagues/' + A.j.id + '/listed', { tid: 12, token: J.j.token, listed: false })).status === 403, 'non-commissioner cannot unlist');
ok((await call('/leagues/' + A.j.id + '/listed', { tid: 4, token: 'nope', listed: false })).status === 401, 'bad token cannot unlist');
const un = await call('/leagues/' + A.j.id + '/listed', { tid: 4, token: A.j.token, listed: false });
ok(un.status === 200 && un.j.listed === false, 'commissioner unlists');
ok(!(await search('thursday')).some(x => x.id === A.j.id), 'unlisted league drops out');
ok((await call('/leagues/' + A.j.id + '/listed', { tid: 4, token: A.j.token, listed: true })).j.listed === true, 'relist');
ok((await search('thursday')).some(x => x.id === A.j.id), 'relisted league back');
ok((await call('/leagues/' + B.j.id + '/listed', { tid: 9, token: B.j.token, listed: true })).status === 200, 'list later');
ok((await search('secret')).some(x => x.id === B.j.id), 'listed later is searchable');
// leave updates the card, last one out deletes it
await call('/leagues/' + A.j.id + '/leave', { tid: 12, token: J.j.token });
ok(!(await search('buddy')).some(x => x.id === A.j.id), 'left coach removed from card');
await call('/leagues/' + B.j.id + '/leave', { tid: 9, token: B.j.token });
ok(!(await search('secret')).some(x => x.id === B.j.id), 'deleted league removed');
// external callers cannot write the directory
ok((await call('/dir/sync', { op: 'put', id: 'ABCDEF', league: { name: 'Fake' } })).status === 404, 'sync not public');
ok(!(await search('fake')).length, 'no fake league');

// ---------- name filter ----------
ok((await call('/leagues', { name: 'Fuck League', coach: { tid: 2, name: 'x' }, base: 'b' })).status === 400, 'bad league name');
ok((await call('/leagues', { name: 'Fine', coach: { tid: 2, name: 'sh1t head' }, base: 'b' })).status === 400, 'bad coach name');
ok((await call('/leagues/' + A.j.id + '/join', { tid: 30, name: 'N1gg' })).status === 400, 'bad join name');
ok((await call('/leagues', { name: 'Gamecocks Classic', coach: { tid: 2, name: 'Coach Hancock' }, base: 'b' })).status === 200, 'innocent names allowed');

// ---------- leaderboard ----------
const p1 = { pid: hex(32), token: hex(32) }, p2 = { pid: hex(32), token: hex(32) }, p3 = { pid: hex(32), token: hex(32) };
let r = await call('/dir/profile', { ...p1, name: 'Saban Jr', dyn: { did: 's1', tid: 4, seasons: 3, titles: 2, playoffs: 3, conf: 2, w: 36, l: 4, online: false } });
ok(r.status === 200 && r.j.rank === 1, 'first profile rank 1');
r = await call('/dir/profile', { ...p2, name: 'Underdog', dyn: { did: 'x', tid: 70, seasons: 3, titles: 1, playoffs: 2, conf: 1, w: 30, l: 9 } });
ok(r.j.rank === 2, 'second profile rank 2');
r = await call('/dir/profile', { ...p3, name: 'Grinder', dyn: { did: 'g', tid: 33, seasons: 2, titles: 0, playoffs: 1, conf: 0, w: 20, l: 6 } });
ok(r.j.rank === 3, 'third rank 3');
let top = (await call('/dir/top')).j;
ok(top.rows.length === 3 && top.rows[0].name === 'Saban Jr' && top.rows[0].titles === 2 && top.rows[2].name === 'Grinder', 'top order by titles');
ok(!JSON.stringify(top).includes(p1.token), 'no token in top');
ok((await call('/dir/profile', { ...p1, token: hex(32), name: 'Hijack', dyn: { did: 's1', seasons: 3, titles: 9 } })).status === 401, 'wrong token rejected');
ok((await call('/dir/profile', { pid: 'bad', token: hex(32), name: 'x' })).status === 400, 'bad pid');
ok((await call('/dir/profile', { pid: hex(32), token: hex(32), name: 'Bitch Boy', dyn: { did: 'a', seasons: 1 } })).status === 400, 'bad leaderboard name');
// second dynasty adds up; titles can't exceed seasons
r = await call('/dir/profile', { ...p2, name: 'Underdog', force: true, dyn: { did: 'y', tid: 71, seasons: 2, titles: 5, playoffs: 2, conf: 2, w: 25, l: 2, online: true } });
top = (await call('/dir/top')).j;
const u = top.rows.find(x => x.pid === p2.pid);
ok(u && u.titles === 3 && u.dynasties === 2 && u.online === true && u.seasons === 5, 'sums dynasties, clamps titles to seasons');
ok(top.rows[0].pid === p2.pid && r.j.rank === 1, 'new leader on top');
// a dynasty cannot jump ten seasons in a minute
r = await call('/dir/profile', { ...p3, name: 'Grinder', force: true, dyn: { did: 'g', tid: 33, seasons: 12, titles: 10, playoffs: 10, conf: 10, w: 150, l: 10 } });
top = (await call('/dir/top')).j; const g = top.rows.find(x => x.pid === p3.pid);
ok(g && g.seasons === 3 && g.titles <= 1, 'season jump clamped');
// throttle
r = await call('/dir/profile', { ...p3, name: 'Grinder', dyn: { did: 'g', seasons: 3 } });
ok(r.j.throttled === true, 'rapid post throttled');
// forget me
ok((await call('/dir/forget', { pid: p3.pid, token: 'wrong-token-wrong-token' })).status === 401, 'forget needs token');
ok((await call('/dir/forget', p3)).status === 200, 'forget');
ok(!(await call('/dir/top')).j.rows.some(x => x.pid === p3.pid), 'forgotten profile gone');

// ---------- reports ----------
ok((await call('/dir/report', { kind: 'bogus', target: 'x' })).status === 400, 'bad report kind');
await call('/dir/report', { kind: 'profile', target: p1.pid, name: 'Saban Jr', from: 'a' }, undefined, '1.1.1.1');
ok((await call('/dir/top')).j.rows.some(x => x.pid === p1.pid), 'one report does not hide');
await call('/dir/report', { kind: 'profile', target: p1.pid, name: 'Saban Jr', from: 'a' }, undefined, '1.1.1.1');
ok((await call('/dir/top')).j.rows.some(x => x.pid === p1.pid), 'same reporter twice does not hide');
await call('/dir/report', { kind: 'profile', target: p1.pid, name: 'Saban Jr', from: 'b' }, undefined, '2.2.2.2');
ok(!(await call('/dir/top')).j.rows.some(x => x.pid === p1.pid), 'two reporters hide profile');
r = await call('/dir/profile', { ...p1, name: 'Saban Jr', force: true, dyn: { did: 's1', tid: 4, seasons: 3, titles: 2 } });
ok(r.j.hidden === true && r.j.rank === null, 'hidden profile stays off after posting');
await call('/dir/report', { kind: 'league', target: A.j.id, name: 'Thursday Night Crew', from: 'a' }, undefined, '3.3.3.3');
await call('/dir/report', { kind: 'coach', target: A.j.id + ':4', name: 'Coach Rolt', from: 'b' }, undefined, '4.4.4.4');
ok(!(await search('thursday')).some(x => x.id === A.j.id), 'reported league hidden from search');
await call('/leagues/' + A.j.id + '/listed', { tid: 4, token: A.j.token, listed: true });
ok(!(await search('thursday')).some(x => x.id === A.j.id), 'hidden league stays hidden after sync');
// moderation
ok((await call('/dir/admin/reports?key=wrong')).status === 403, 'admin needs key');
const rep = await call('/dir/admin/reports?key=test-admin-key');
ok(rep.status === 200 && rep.j.reports.length === 2 && rep.j.reports.some(x => x.kind === 'league' && x.count === 2 && x.name.includes('coach: Coach Rolt')), 'admin sees merged reports');
ok((await call('/dir/admin/act', { key: 'test-admin-key', kind: 'profile', target: p1.pid, action: 'restore' })).status === 200, 'admin restore');
ok((await call('/dir/top')).j.rows.some(x => x.pid === p1.pid), 'restored profile back');
await call('/dir/admin/act', { key: 'test-admin-key', kind: 'league', target: A.j.id, action: 'restore' });
ok((await search('thursday')).some(x => x.id === A.j.id), 'restored league back');
ok((await call('/dir/admin/act', { key: 'test-admin-key', kind: 'league', target: A.j.id, action: 'hide' })).status === 200, 'admin hide');
ok(!(await search('thursday')).some(x => x.id === A.j.id), 'admin-hidden league gone');

// ---------- monthly race ----------
{
  const p4 = { pid: hex(32), token: hex(32) }, p5 = { pid: hex(32), token: hex(32) };
  await call('/dir/profile', { ...p4, name: 'Veteran', force: true, dyn: { did: 'v', tid: 2, seasons: 10, titles: 5, playoffs: 8, conf: 6, w: 110, l: 20 } });
  let M = (await call('/dir/top?period=month')).j; let v = M.rows.find(x => x.pid === p4.pid);
  ok(M.period === 'month' && /^\d{4}-\d{2}$/.test(M.month) && M.ends > Date.now() && M.prev && Array.isArray(M.prev.rows), 'month board shape');
  ok(v && v.titles === 1 && v.playoffs === 1 && v.conf === 1 && v.w === 0, 'first post credits at most one of each this month');
  await call('/dir/profile', { ...p4, name: 'Veteran', force: true, dyn: { did: 'v', tid: 2, seasons: 11, titles: 6, playoffs: 9, conf: 6, w: 122, l: 21 } });
  await call('/dir/profile', { ...p5, name: 'Rookie', force: true, dyn: { did: 'r', tid: 9, seasons: 2, titles: 0, playoffs: 0, conf: 0, w: 14, l: 10 } });
  await call('/dir/profile', { ...p5, name: 'Rookie', force: true, dyn: { did: 'r', tid: 9, seasons: 3, titles: 1, playoffs: 1, conf: 1, w: 27, l: 11 } });
  M = (await call('/dir/top?period=month')).j; v = M.rows.find(x => x.pid === p4.pid); const r = M.rows.find(x => x.pid === p5.pid);
  ok(v && v.titles === 2 && v.playoffs === 2 && v.w === 12 && v.seasons === 1, 'gains add up within the month');
  ok(r && r.titles === 1 && r.w === 13, 'rookie credited for this month only');
  ok(M.rows.findIndex(x => x.pid === p4.pid) < M.rows.findIndex(x => x.pid === p5.pid), 'month sorted by titles');
  await call('/dir/profile', { ...p5, name: 'Rookie Star', force: true });
  M = (await call('/dir/top?period=month')).j; ok(M.rows.some(x => x.pid === p5.pid && x.name === 'Rookie Star'), 'rename shows on month board');
  ok((await call('/dir/top?period=month&m=1999-01')).j.rows.length === 0, 'old month empty');
  await call('/dir/forget', p5);
  ok(!(await call('/dir/top?period=month')).j.rows.some(x => x.pid === p5.pid), 'forget clears month board');
  await call('/dir/admin/act', { key: 'test-admin-key', kind: 'profile', target: p4.pid, action: 'hide' });
  ok(!(await call('/dir/top?period=month')).j.rows.some(x => x.pid === p4.pid), 'hidden profile off month board');
}

console.log(fails ? `${fails}/${checks} checks FAILED` : `${checks}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
