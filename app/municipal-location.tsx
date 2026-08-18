"use client";

import { ExternalLink, MapPin } from "lucide-react";

export const MUNICIPAL_NEIGHBORHOODS = [
  "Centro", "Caiçara I", "Caiçara II", "Cidade Nova", "Conjunto Palmas", "Distrito Industrial", "Eldorado", "Estância da Palma",
  "Jardim América", "Jardim América II", "Jardim Itália", "Jardim Itália II", "Jardim Palmeiras", "José Evangelista", "Lameirão", "Lameirão II",
  "Morada do Sol", "Nova Esperança", "Novo", "Novo Alambique", "Novo Buritis", "Novo Progresso", "Nossa Senhora de Fátima", "Palmas", "Paulo VI",
  "Pedras Grandes", "Pinlar I", "Pinlar II", "Planalto", "Princesa", "Princesa II", "Progresso", "Serrinha", "Barra do Guaicuí",
] as const;

function locationQuery(neighborhood: string, address = "") {
  const areaName = neighborhood === "Centro" ? "Centro" : neighborhood === "Barra do Guaicuí" ? "Distrito de Barra do Guaicuí" : `Bairro ${neighborhood}`;
  return [address.trim(), areaName, "Várzea da Palma", "MG"].filter(Boolean).join(", ");
}

export function NeighborhoodMapPreview({ neighborhood, address = "", compact = false }: { neighborhood: string; address?: string; compact?: boolean }) {
  if (!neighborhood) return <div className="neighborhood-map-empty"><MapPin size={22} /><span><strong>Selecione um bairro</strong><small>A área correspondente aparecerá aqui no mapa municipal.</small></span></div>;

  const query = locationQuery(neighborhood, address);
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${address.trim() ? 17 : 15}&output=embed`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return <div className={`neighborhood-map-preview ${compact ? "compact" : ""}`} aria-live="polite">
    <iframe title={`Área de ${neighborhood} no mapa de Várzea da Palma`} src={embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    <div className="neighborhood-map-caption"><span><MapPin size={14} /><span><strong>{neighborhood}</strong><small>{address.trim() || "Área aproximada do bairro · Várzea da Palma, MG"}</small></span></span><a href={mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} />Abrir mapa</a></div>
  </div>;
}

export function NeighborhoodMapField({ neighborhood, address, onNeighborhoodChange, onAddressChange, required = true }: { neighborhood: string; address: string; onNeighborhoodChange: (value: string) => void; onAddressChange: (value: string) => void; required?: boolean }) {
  return <section className="location-map-field">
    <div className="location-inputs">
      <label className="field"><span>Bairro *</span><select name="neighborhood" required={required} value={neighborhood} onChange={(event) => onNeighborhoodChange(event.target.value)}><option value="" disabled>Selecione o bairro</option>{MUNICIPAL_NEIGHBORHOODS.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Rua / endereço *</span><input name="address" required={required} value={address} onChange={(event) => onAddressChange(event.target.value)} placeholder="Ex.: Rua Cláudio Manoel da Costa, 1000" /></label>
    </div>
    <NeighborhoodMapPreview neighborhood={neighborhood} address={address} />
    <p className="location-accuracy-note"><MapPin size={12} />Informe a rua do chamado. Ela será usada para geocodificar e fixar o chamado corretamente no mapa municipal.</p>
  </section>;
}
