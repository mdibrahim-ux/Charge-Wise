import type { Vehicle } from '../data/vehicles'
import type { ChargingStation } from './stations'
export type CompatLevel='compatible'|'likely'|'unknown'|'incompatible'
export type Compatibility={level:CompatLevel;connector:string;reason:string;kw:number;kwSource:'published'|'assumed'}
export function compatibility(st:ChargingStation,v:Vehicle):Compatibility {
 const brandText=[st.name,st.operator,st.network].filter(Boolean).join(' '),net=v.live.network
 const publishedKw=(keys?:string[])=>st.sockets.find(x=>(!keys||keys.includes(x.key))&&x.outputKw)?.outputKw??null
 if(net&&net.match.test(brandText)){const pk=publishedKw();return {level:'compatible',connector:net.connector,reason:`${net.label} station — your ${v.name}'s brand network`,kw:pk?Math.min(pk,net.kw):net.kw,kwSource:pk?'published':'assumed'}}
 const lev=st.sockets.find(s=>v.live.levSockets.includes(s.key));if(lev)return {level:'compatible',connector:lev.label,reason:'Listed connector matches your scooter',kw:lev.outputKw??net?.kw??v.live.portableKw,kwSource:lev.outputKw?'published':'assumed'}
 const domestic=st.sockets.find(s=>s.kind==='domestic');if(domestic)return {level:'compatible',connector:domestic.label,reason:'Standard socket — use your portable charger',kw:v.live.portableKw,kwSource:'assumed'}
 if(st.twoWheeler==='yes')return {level:'likely',connector:'Two-wheeler charging (connector not listed)',reason:'Tagged for scooters/motorcycles, connector type not published',kw:v.live.portableKw,kwSource:'assumed'}
 const industrial=st.sockets.find(s=>s.kind==='industrial');if(industrial)return {level:'likely',connector:industrial.label,reason:'Bharat AC-001 style socket — may need an adapter',kw:v.live.portableKw,kwSource:'assumed'}
 if(st.twoWheeler==='no')return {level:'incompatible',connector:'Cars only',reason:'Listed as not for two-wheelers',kw:0,kwSource:'assumed'}
 const levOther=st.sockets.find(s=>s.kind==='lev');if(levOther)return {level:'unknown',connector:levOther.label,reason:`${levOther.label} — check whether your ${v.name} supports it`,kw:v.live.portableKw,kwSource:'assumed'}
 if(st.sockets.length&&st.sockets.every(s=>s.kind==='car'))return {level:'incompatible',connector:st.sockets.map(s=>s.label).join(', '),reason:'Car connectors only',kw:0,kwSource:'assumed'}
 if(net&&/\b(ather|ola)\b/i.test(brandText))return {level:'unknown',connector:'Brand-specific network',reason:`Another brand's network — compatibility with ${v.name} unconfirmed`,kw:v.live.portableKw,kwSource:'assumed'}
 return {level:'unknown',connector:'Not published',reason:'Connector details not listed in OpenStreetMap',kw:v.live.portableKw,kwSource:'assumed'}
}
export const COMPAT_LABEL:Record<CompatLevel,string>={compatible:'Compatible',likely:'Likely compatible',unknown:'Compatibility unconfirmed',incompatible:'Not compatible'}
