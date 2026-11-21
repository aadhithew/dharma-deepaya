// ධර්ම දීපය — offline support
const V="dd-v7";
const CORE=["./","index.html","manifest.json","data.js","media.js","jataka54.js","monks.js","reels.js","pirith.js","places.js","brand/logo-192.png","brand/logo-512.png","brand/mark-256.png","favicon.ico"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin) return;
  if(e.request.mode==="navigate"||/\.(html|js|json)$/.test(u.pathname)){
    // network first, fall back to cache (so updates show up, but it works offline)
    e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
  } else {
    // images: cache first
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{ if(n.ok){ const c=n.clone(); caches.open(V).then(x=>x.put(e.request,c)); } return n; })));
  }
});
