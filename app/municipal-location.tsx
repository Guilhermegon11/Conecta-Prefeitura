"use client";

import { useState } from "react";
import { Crosshair, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";

export const MUNICIPAL_NEIGHBORHOODS = [
  "Centro", "Caiçara I", "Caiçara II", "Cidade Nova", "Conjunto Palmas", "Distrito Industrial", "Eldorado", "Estância da Palma",
  "Jardim América", "Jardim América II", "Jardim Itália", "Jardim Itália II", "Jardim Palmeiras", "José Evangelista", "Lameirão", "Lameirão II",
  "Morada do Sol", "Nova Esperança", "Novo", "Novo Alambique", "Novo Buritis", "Novo Progresso", "Nossa Senhora de Fátima", "Palmas", "Paulo VI",
  "Pedras Grandes", "Pinlar I", "Pinlar II", "Planalto", "Princesa", "Princesa II", "Progresso", "Serrinha", "Barra do Guaicuí",
] as const;

export function AddressRegistrationField({ neighborhood, address, onNeighborhoodChange, onAddressChange, required = true }: { neighborhood: string; address: string; onNeighborhoodChange: (value: string) => void; onAddressChange: (value: string) => void; required?: boolean }) {
  const [locating,setLocating]=useState(false),[latitude,setLatitude]=useState(""),[longitude,setLongitude]=useState(""),[locationMessage,setLocationMessage]=useState("");
  function useCurrentLocation(){
    if(!navigator.geolocation){setLocationMessage("Este navegador não disponibiliza localização por GPS.");return;}
    setLocating(true);setLocationMessage("");
    navigator.geolocation.getCurrentPosition((position)=>{setLatitude(String(position.coords.latitude));setLongitude(String(position.coords.longitude));setLocationMessage(`Coordenada GPS registrada com precisão aproximada de ${Math.round(position.coords.accuracy)} m.`);setLocating(false);},()=>{setLocationMessage("Não foi possível obter a localização. Verifique a permissão de localização do navegador.");setLocating(false);},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  }
  return <section className="location-map-field location-address-only">
    <div className="location-inputs">
      <label className="field"><span>Bairro *</span><select name="neighborhood" required={required} value={neighborhood} onChange={(event) => onNeighborhoodChange(event.target.value)}><option value="" disabled>Selecione o bairro</option>{MUNICIPAL_NEIGHBORHOODS.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Rua / endereço *</span><input name="address" required={required} value={address} onChange={(event) => onAddressChange(event.target.value)} placeholder="Ex.: Rua Cláudio Manoel da Costa, 1000" /></label>
      <input type="hidden" name="latitude" value={latitude}/><input type="hidden" name="longitude" value={longitude}/>
    </div>
    <div className="address-registration-note"><span><MapPin size={18} /></span><div><strong>Localização vinculada ao chamado</strong><p>Informe rua e bairro ou, se estiver no local da ocorrência, registre a coordenada GPS exata.</p>{locationMessage&&<small className={latitude&&longitude?"location-success":"location-warning"}>{locationMessage}</small>}</div><button className="location-gps-button" type="button" onClick={useCurrentLocation} disabled={locating}>{locating?<LoaderCircle className="spin" size={15}/>:<Crosshair size={15}/>} {locating?"Localizando…":latitude&&longitude?"GPS registrado":"Usar localização atual"}</button><ShieldCheck size={17} /></div>
  </section>;
}
