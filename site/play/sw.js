const CACHE='ss-play-v2';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Network first so updates land. Only good responses are cached, and a slow network falls back to the cached copy after 8 seconds.
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const cached=()=>caches.match(e.request).then(m=>m||caches.match('./'));
  const net=fetch(e.request).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c)).catch(()=>{});}return r;});
  e.respondWith(new Promise(res=>{let done=false;const t=setTimeout(()=>{cached().then(m=>{if(m&&!done){done=true;res(m);}});},8000);
    net.then(r=>{if(!r.ok)return cached().then(m=>m||r);return r;}).catch(()=>cached().then(m=>m||Response.error())).then(r=>{clearTimeout(t);if(!done){done=true;res(r);}});}));});
