"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, LoaderCircle, MapPin, Minus, Plus } from "./site-icons";

export type RealMapPoint = {
  id: string;
  title: string;
  subtitle?: string;
  priority?: string;
  address?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
  kind?: "ticket" | "place";
};

type Coordinate = { lat: number; lon: number; precision: "coordenada" | "endereço" | "bairro" };
type Tile = { x: number; y: number; left: number; top: number };

const CITY_CENTER = { lat: -17.6005, lon: -44.7340 };
const NEIGHBORHOOD_CENTERS: Record<string, { lat: number; lon: number }> = {
  "centro": { lat: -17.5987, lon: -44.7328 },
  "planalto": { lat: -17.6038, lon: -44.7275 },
  "pinlar": { lat: -17.5958, lon: -44.7398 },
  "pinlar i": { lat: -17.5958, lon: -44.7398 },
  "pinlar ii": { lat: -17.5945, lon: -44.7422 },
  "guaicui": { lat: -17.5405, lon: -44.8130 },
  "barra do guaicui": { lat: -17.5405, lon: -44.8130 },
  "jardim america": { lat: -17.6015, lon: -44.7378 },
  "lameirao": { lat: -17.6076, lon: -44.7410 },
  "nova esperanca": { lat: -17.6020, lon: -44.7445 },
};
const TILE_SIZE = 256;
const MAP_HEIGHT = 430;

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function worldPixel(lat: number, lon: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const sin = Math.sin((lat * Math.PI) / 180);
  const x = ((lon + 180) / 360) * scale;
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}
function worldLatLon(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lon };
}
function cacheKey(point: RealMapPoint) {
  const raw = `${point.address || ""}|${point.neighborhood || ""}|Várzea da Palma|MG`;
  return `prefeitura-map-geocode:v2:${normalized(raw)}`;
}
function queryFor(point: RealMapPoint) {
  const chunks = [point.address, point.neighborhood, "Várzea da Palma", "Minas Gerais", "Brasil"].filter(Boolean);
  return Array.from(new Set(chunks.map((value) => String(value).trim()))).join(", ");
}
function neighborhoodCoordinate(name?: string | null): Coordinate | null {
  if (!name) return null;
  const normalizedName = normalized(name);
  const match = Object.entries(NEIGHBORHOOD_CENTERS).find(([key]) => normalizedName === key || normalizedName.includes(key) || key.includes(normalizedName));
  if (!match) return null;
  return { lat: match[1].lat, lon: match[1].lon, precision: "bairro" };
}
function readCached(point: RealMapPoint): Coordinate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(point));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Coordinate;
    return Number.isFinite(parsed.lat) && Number.isFinite(parsed.lon) ? parsed : null;
  } catch { return null; }
}
function writeCached(point: RealMapPoint, coordinate: Coordinate) {
  try { localStorage.setItem(cacheKey(point), JSON.stringify(coordinate)); } catch { /* cache opcional */ }
}

export function RealMunicipalMap({ points, onPointClick }: { points: RealMapPoint[]; onPointClick?: (point: RealMapPoint) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(900);
  const [zoom, setZoom] = useState(14);
  const [center, setCenter] = useState(CITY_CENTER);
  const [resolved, setResolved] = useState<Record<string, Coordinate>>({});
  const [geocoding, setGeocoding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; centerX: number; centerY: number } | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => setWidth(Math.max(320, Math.round(element.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const direct: Record<string, Coordinate> = {};
    for (const point of points) {
      if (Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) {
        direct[point.id] = { lat: Number(point.latitude), lon: Number(point.longitude), precision: "coordenada" };
        continue;
      }
      const neighborhoodHit = neighborhoodCoordinate(point.neighborhood);
      if (neighborhoodHit) {
        direct[point.id] = neighborhoodHit;
        continue;
      }
      const cached = readCached(point);
      if (cached) direct[point.id] = cached;
    }
    setResolved((current) => ({ ...current, ...direct }));

    const missing = points.filter((point) => !direct[point.id] && (point.address || point.neighborhood)).slice(0, 12);
    if (!missing.length || !navigator.onLine) return;
    setGeocoding(true);
    void (async () => {
      for (let index = 0; index < missing.length; index += 1) {
        if (cancelled) break;
        const point = missing[index];
        try {
          const response = await fetch(`/api/geocode?q=${encodeURIComponent(queryFor(point))}&precision=${encodeURIComponent(point.address ? "endereço" : "bairro")}`, { cache: "force-cache" });
          if (response.ok) {
            const payload = await response.json() as { found?: boolean; lat?: number; lon?: number; precision?: "endereço" | "bairro" };
            if (payload.found && Number.isFinite(payload.lat) && Number.isFinite(payload.lon)) {
              const coordinate: Coordinate = { lat: Number(payload.lat), lon: Number(payload.lon), precision: payload.precision || (point.address ? "endereço" : "bairro") };
              writeCached(point, coordinate);
              if (!cancelled) setResolved((current) => ({ ...current, [point.id]: coordinate }));
            }
          }
        } catch { /* mapa continua utilizável mesmo sem geocodificação */ }
        if (index < missing.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 1200));
      }
      if (!cancelled) setGeocoding(false);
    })();
    return () => { cancelled = true; };
  }, [points]);

  const centerWorld = worldPixel(center.lat, center.lon, zoom);
  const tiles = useMemo(() => {
    const centerPx = worldPixel(center.lat, center.lon, zoom);
    const leftWorld = centerPx.x - width / 2;
    const topWorld = centerPx.y - MAP_HEIGHT / 2;
    const firstX = Math.floor(leftWorld / TILE_SIZE) - 1;
    const lastX = Math.floor((leftWorld + width) / TILE_SIZE) + 1;
    const firstY = Math.floor(topWorld / TILE_SIZE) - 1;
    const lastY = Math.floor((topWorld + MAP_HEIGHT) / TILE_SIZE) + 1;
    const list: Tile[] = [];
    const max = Math.pow(2, zoom);
    for (let y = firstY; y <= lastY; y += 1) {
      if (y < 0 || y >= max) continue;
      for (let x = firstX; x <= lastX; x += 1) {
        const wrappedX = ((x % max) + max) % max;
        list.push({ x: wrappedX, y, left: x * TILE_SIZE - leftWorld, top: y * TILE_SIZE - topWorld });
      }
    }
    return list;
  }, [center.lat, center.lon, width, zoom]);

  const positioned = points.map((point) => {
    const coordinate = resolved[point.id];
    if (!coordinate) return null;
    const pos = worldPixel(coordinate.lat, coordinate.lon, zoom);
    return { point, coordinate, left: pos.x - centerWorld.x + width / 2, top: pos.y - centerWorld.y + MAP_HEIGHT / 2 };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const selected = positioned.find((item) => item.point.id === selectedId) ?? null;

  function focusPoint(item: (typeof positioned)[number]) {
    setSelectedId(item.point.id);
    setCenter({ lat: item.coordinate.lat, lon: item.coordinate.lon });
    onPointClick?.(item.point);
  }

  return <div className="real-municipal-map" ref={containerRef}>
    <div className="real-map-viewport" style={{ height: MAP_HEIGHT }} onPointerDown={(event)=>{if((event.target as HTMLElement).closest("button"))return;const start=worldPixel(center.lat,center.lon,zoom);dragRef.current={x:event.clientX,y:event.clientY,centerX:start.x,centerY:start.y};(event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);}} onPointerMove={(event)=>{const drag=dragRef.current;if(!drag)return;const next=worldLatLon(drag.centerX-(event.clientX-drag.x),drag.centerY-(event.clientY-drag.y),zoom);setCenter(next);}} onPointerUp={(event)=>{dragRef.current=null;try{(event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId)}catch{}}} onPointerCancel={()=>{dragRef.current=null}}>
      <div className="real-map-tiles" aria-hidden="true">
        {tiles.map((tile) => <img key={`${zoom}-${tile.x}-${tile.y}`} src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`} alt="" draggable={false} style={{ left: tile.left, top: tile.top }} />)}
      </div>
      <div className="real-map-controls">
        <button type="button" aria-label="Aproximar mapa" onClick={() => setZoom((value) => Math.min(18, value + 1))}><Plus size={16}/></button>
        <button type="button" aria-label="Afastar mapa" onClick={() => setZoom((value) => Math.max(12, value - 1))}><Minus size={16}/></button>
        <button type="button" aria-label="Centralizar em Várzea da Palma" onClick={() => { setCenter(CITY_CENTER); setZoom(14); }}><Crosshair size={16}/></button>
      </div>
      {geocoding && <div className="real-map-geocoding"><LoaderCircle className="spin" size={14}/> Localizando endereços…</div>}
      {positioned.map((item) => {
        if (item.left < -35 || item.left > width + 35 || item.top < -35 || item.top > MAP_HEIGHT + 35) return null;
        const priority = normalized(item.point.priority || "normal").replace(/\s+/g, "-");
        return <button
          type="button"
          key={item.point.id}
          className={`real-map-marker priority-${priority} ${selectedId === item.point.id ? "selected" : ""}`}
          style={{ left: item.left, top: item.top }}
          title={`${item.point.title}${item.point.subtitle ? ` — ${item.point.subtitle}` : ""}`}
          onClick={() => focusPoint(item)}
        ><MapPin size={16}/></button>;
      })}
      {!positioned.length && !geocoding && <div className="real-map-empty"><MapPin size={27}/><strong>Sem coordenadas disponíveis</strong><p>Cadastre um endereço completo ou coordenadas para posicionar o registro.</p></div>}
      {selected && <div className="real-map-popup">
        <strong>{selected.point.title}</strong>
        {selected.point.subtitle && <span>{selected.point.subtitle}</span>}
        <small>{selected.coordinate.precision === "coordenada" ? "Posição por coordenada/GPS" : selected.coordinate.precision === "endereço" ? "Posição localizada pelo endereço" : "Posição aproximada pelo bairro"}</small>
      </div>}
    </div>
    <footer className="real-map-attribution"><span>Várzea da Palma/MG · mapa real</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></footer>
  </div>;
}
