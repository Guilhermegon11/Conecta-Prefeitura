"use client";

import { MapPin, ShieldCheck } from "lucide-react";

export const MUNICIPAL_NEIGHBORHOODS = [
  "Centro", "Caiçara I", "Caiçara II", "Cidade Nova", "Conjunto Palmas", "Distrito Industrial", "Eldorado", "Estância da Palma",
  "Jardim América", "Jardim América II", "Jardim Itália", "Jardim Itália II", "Jardim Palmeiras", "José Evangelista", "Lameirão", "Lameirão II",
  "Morada do Sol", "Nova Esperança", "Novo", "Novo Alambique", "Novo Buritis", "Novo Progresso", "Nossa Senhora de Fátima", "Palmas", "Paulo VI",
  "Pedras Grandes", "Pinlar I", "Pinlar II", "Planalto", "Princesa", "Princesa II", "Progresso", "Serrinha", "Barra do Guaicuí",
] as const;

export function AddressRegistrationField({ neighborhood, address, onNeighborhoodChange, onAddressChange, required = true }: { neighborhood: string; address: string; onNeighborhoodChange: (value: string) => void; onAddressChange: (value: string) => void; required?: boolean }) {
  return <section className="location-map-field location-address-only">
    <div className="location-inputs">
      <label className="field"><span>Bairro *</span><select name="neighborhood" required={required} value={neighborhood} onChange={(event) => onNeighborhoodChange(event.target.value)}><option value="" disabled>Selecione o bairro</option>{MUNICIPAL_NEIGHBORHOODS.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Rua / endereço *</span><input name="address" required={required} value={address} onChange={(event) => onAddressChange(event.target.value)} placeholder="Ex.: Rua Cláudio Manoel da Costa, 1000" /></label>
    </div>
    <div className="address-registration-note"><span><MapPin size={18} /></span><div><strong>Endereço registrado no chamado</strong><p>O bairro e a rua ficam vinculados ao histórico da demanda para consulta, encaminhamento e atendimento em campo.</p></div><ShieldCheck size={17} /></div>
  </section>;
}
