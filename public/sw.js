const CACHE = "prefeitura-conecta-offline-v45";
const CORE_ROUTES = ["/", "/avaliar", "/acompanhar", "/manifest.webmanifest", "/favicon.svg"];

function sameOrigin(url) {
  try { return new URL(url, self.location.origin).origin === self.location.origin; } catch { return false; }
}

async function cacheResponse(cache, request, response) {
  if (response && response.ok) {
    try { await cache.put(request, response.clone()); } catch { /* resposta não cacheável */ }
  }
  return response;
}

async function warmRoute(cache, path) {
  try {
    const response = await fetch(path, { cache: "reload" });
    if (!response.ok) return;
    await cache.put(path, response.clone());
    if (!(response.headers.get("content-type") || "").includes("text/html")) return;
    const html = await response.text();
    const assets = new Set();
    const pattern = /(?:src|href)=["']([^"']+)["']/g;
    let match;
    while ((match = pattern.exec(html))) {
      try {
        const asset = new URL(match[1], self.location.origin);
        if (asset.origin === self.location.origin && (asset.pathname.startsWith("/_next/static/") || asset.pathname === "/favicon.svg" || asset.pathname === "/manifest.webmanifest")) assets.add(asset.href);
      } catch { /* ignore */ }
    }
    await Promise.all([...assets].map(async (url) => {
      try { const assetResponse = await fetch(url, { cache: "reload" }); if (assetResponse.ok) await cache.put(url, assetResponse); } catch { /* ignore */ }
    }));
  } catch { /* primeira instalação pode falhar se a rede cair */ }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE_ROUTES.map((path) => warmRoute(cache, path)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE && key.startsWith("prefeitura-conecta")).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});


const OFFLINE_DB = "prefeitura-conecta-offline";
const OFFLINE_DB_VERSION = 1;
const OFFLINE_QUEUE = "queue";
const OFFLINE_RECEIPTS = "receipts";
function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, OFFLINE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db=request.result;
      if(!db.objectStoreNames.contains(OFFLINE_QUEUE)) db.createObjectStore(OFFLINE_QUEUE,{keyPath:"id"});
      if(!db.objectStoreNames.contains(OFFLINE_RECEIPTS)) db.createObjectStore(OFFLINE_RECEIPTS,{keyPath:"localId"});
      if(!db.objectStoreNames.contains("tracking")) db.createObjectStore("tracking",{keyPath:"id"});
    };
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
async function idbAll(storeName){const db=await openOfflineDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,"readonly");const r=tx.objectStore(storeName).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
async function idbDelete(storeName,id){const db=await openOfflineDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).delete(id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
async function idbPut(storeName,value){const db=await openOfflineDb();return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).put(value);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
async function performOfflineItem(item){
  if(item.kind==="form-data"){
    const form=new FormData();for(const entry of item.formEntries||[]){if(typeof entry.value==="string")form.append(entry.key,entry.value);else form.append(entry.key,new File([entry.value],entry.filename||"arquivo",{type:entry.type||entry.value.type||"application/octet-stream"}));}
    const response=await fetch(item.url,{method:item.method,body:form,credentials:"include",cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);return;
  }
  if(item.kind==="citizen-feedback"){
    const response=await fetch(item.url,{method:"POST",headers:item.headers||{"content-type":"application/json"},body:JSON.stringify(item.body||{}),credentials:"include",cache:"no-store"});const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.ok||!payload.protocol)throw new Error(payload?.error||`HTTP ${response.status}`);
    let failures=0;if(payload.accessCode&&item.attachments?.length){for(const attachment of item.attachments){try{const form=new FormData();form.set("protocol",payload.protocol);form.set("accessCode",payload.accessCode);form.set("file",new File([attachment.blob],attachment.name,{type:attachment.type}));const up=await fetch("/api/citizen-feedback-attachment",{method:"POST",body:form,credentials:"include"});if(!up.ok)failures++;}catch{failures++;}}}
    const receipts=await idbAll(OFFLINE_RECEIPTS);const current=receipts.find((r)=>r.localId===item.id);await idbPut(OFFLINE_RECEIPTS,{localId:item.id,localProtocol:current?.localProtocol||String(item.label||"").replace("Manifestação ",""),status:"synced",createdAt:current?.createdAt||item.createdAt,syncedAt:new Date().toISOString(),protocol:payload.protocol,accessCode:payload.accessCode||"",subject:current?.subject,lastError:failures?`${failures} anexo(s) não sincronizado(s).`:undefined});return;
  }
  const response=await fetch(item.url,{method:item.method,headers:item.headers,body:item.body===undefined?undefined:JSON.stringify(item.body),credentials:"include",cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);
}
async function backgroundFlush(){const items=(await idbAll(OFFLINE_QUEUE)).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));for(const item of items){try{await performOfflineItem(item);await idbDelete(OFFLINE_QUEUE,item.id);}catch{break;}}}
self.addEventListener("sync",(event)=>{if(event.tag==="prefeitura-offline-sync")event.waitUntil(backgroundFlush());});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Tiles do OpenStreetMap já visualizados ficam disponíveis offline no aparelho.
  if (url.hostname === "tile.openstreetmap.org") {
    event.respondWith((async () => {
      const tileCache = await caches.open(`${CACHE}-map-tiles`);
      const cached = await tileCache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        await tileCache.put(request, response.clone()).catch(() => undefined);
        return response;
      } catch {
        return new Response("", { status: 504 });
      }
    })());
    return;
  }

  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Assets imutáveis do Next: cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const cache = await caches.open(CACHE);
      try { return await cacheResponse(cache, request, await fetch(request)); } catch { return Response.error(); }
    })());
    return;
  }

  // Navegação e outros GETs: rede primeiro, com fallback para a cópia local.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone()).catch(() => undefined);
      return response;
    } catch {
      const exact = await caches.match(request, { ignoreSearch: true });
      if (exact) return exact;
      const pathFallback = await caches.match(url.pathname, { ignoreSearch: true });
      if (pathFallback) return pathFallback;
      const root = await caches.match("/");
      if (root) return root;
      return new Response("Prefeitura Conecta está offline e esta tela ainda não foi preparada neste dispositivo.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  })());
});
