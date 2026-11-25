// අසපුව — offline support
const V="dd-v12";
const CORE=["./","index.html","manifest.json","data.js","media.js","jataka54.js","monks.js","reels.js","pirith.js","places.js","brand/logo-192.png","brand/logo-512.png","brand/mark-256.png","favicon.ico"];
const KEEP=[V,"dd-offline"];   // "dd-offline" = files the user saved with the Offline button
self.addEventListener("install",e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>!KEEP.includes(x)).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
const put=(req,res)=>{ if(res&&res.status===200){ const c=res.clone(); caches.open(V).then(x=>x.put(req,c)).catch(()=>{}); } return res; };
const saved=req=>caches.match(req,{ignoreVary:true}).then(r=>r||caches.match(req.url,{ignoreVary:true})).then(r=>r||anySize(req.url));
// offline: a Wikimedia photo saved at one width is used for every width the page asks for
const anySize=url=>{ const m=url.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^\/]+)\/\d+px-/); if(!m) return null;
  return caches.open("dd-offline").then(c=>c.keys().then(ks=>{ const k=ks.find(q=>q.url.includes("/"+m[1]+"/")); return k?c.match(k):null; })); };
self.addEventListener("fetch",e=>{
  const req=e.request, u=new URL(req.url);
  if(req.method!=="GET") return;
  // never touch audio/video or range requests — the browser streams them itself (seeking works)
  if(req.headers.has("range")||/\.(m4a|mp3|mp4|webm|ogg|ogv|mov)$/i.test(u.pathname)||req.destination==="audio"||req.destination==="video") return;
  if(u.origin!==location.origin){
    // photos and fonts saved for offline: online = normal network, offline = the saved copy
    if(req.destination==="image"||req.destination==="font"||req.destination==="style"||/wikimedia|gstatic|googleapis/.test(u.host)){
      e.respondWith(fetch(req).catch(()=>saved(req).then(r=>r||Response.error())));
    }
    return;
  }
  if(req.mode==="navigate"||/\.(html|js|json)$/.test(u.pathname)){
    // network first (updates show up), fall back to cache offline
    e.respondWith(fetch(req).then(r=>put(req,r)).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match("index.html")).then(r=>r||caches.match("./"))));
  } else {
    // local images: cache first
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req).then(n=>put(req,n))));
  }
});
