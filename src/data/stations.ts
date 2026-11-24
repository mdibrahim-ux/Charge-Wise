import { fromKm, hashString, rng, toKm } from '../lib/geo'
import { nearestVia, pointAtKm, type Route } from '../lib/route'
import type { Connector, Vehicle } from './vehicles'
export type StationStatus='available'|'busy'|'offline'
export type Charger={type:Connector;kw:number;ports:number;free:number}
export type Station={id:string;name:string;operator:string;km:number;offRouteKm:number;lat:number;lon:number;address:string;locality:string;chargers:Charger[];status:StationStatus;pricePerKwh:number;amenities:string[];hours:string;rating:number;reportedMinsAgo:number}
const OPERATORS=['VoltPoint','Gridline','AmpStop','Ohmway','Ecoflux','Relay Charge']
const SITES=['Highway Plaza','Food Court','Bypass Junction','Fuel Forecourt','Rest Stop','Service Road','Café Hub','Market Square']
const AMENITIES=['Café','Restrooms','Shaded parking','Wi-Fi','Drinking water','Air pump','CCTV']
const CACHE=new Map<string,Station[]>()
export function generateStations(route:Route):Station[] {
 const cached=CACHE.get(route.id); if(cached) return cached
 const rand=rng(hashString(route.id+':stations')); const out:Station[]=[]; let km=4+rand()*6; let i=0
 while(km<route.totalKm-2) {
  const pt=pointAtKm(route,km); const next=pointAtKm(route,Math.min(route.totalKm,km+0.5)); const via=nearestVia(route,km); const hillyZone=via.place.hilly
  const A=toKm(pt,pt), B=toKm(next,pt), len=Math.hypot(B.x-A.x,B.y-A.y)||1, side=rand()>0.5?1:-1, off=0.2+rand()*(rand()>0.8?3.2:1.2)
  const ll=fromKm((-(B.y-A.y)/len)*off*side,((B.x-A.x)/len)*off*side,pt)
  const chargers:Charger[]=[]; const roll=rand(); if(roll<0.62) chargers.push(mk('LECCS',rand()>0.5?3.3:6,rand)); if(rand()<0.68) chargers.push(mk('Type 6',3,rand)); if(rand()<0.32) chargers.push(mk('OEM DC',6,rand)); if(rand()<0.5||chargers.length===0) chargers.push(mk('15A Socket',3.3,rand))
  const sr=rand(); const status:StationStatus=sr<0.1?'offline':sr<0.32?'busy':'available'; if(status==='offline') chargers.forEach(c=>c.free=0); if(status==='busy') chargers.forEach(c=>c.free=Math.min(c.free,rand()>0.5?0:1))
  const operator=OPERATORS[Math.floor(rand()*OPERATORS.length)], site=SITES[Math.floor(rand()*SITES.length)], am=AMENITIES.filter(()=>rand()>0.5).slice(0,4)
  out.push({id:`${route.id}-st${i}`,name:`${operator} ${via.place.name} ${site}`,operator,km,offRouteKm:Math.round(off*10)/10,lat:ll.lat,lon:ll.lon,locality:via.place.name,address:`${site}, near ${via.place.name}, ${via.place.region} · route km ${Math.round(km)}`,chargers,status,pricePerKwh:Math.round(16+rand()*8),amenities:am.length?am:['Restrooms'],hours:rand()>0.4?'Open 24 hours':'6:00 AM – 11:00 PM',rating:Math.round((3.7+rand()*1.2)*10)/10,reportedMinsAgo:3+Math.floor(rand()*55)})
  i++; km+=(hillyZone||route.hilly?26+rand()*38:12+rand()*20)
 }
 CACHE.set(route.id,out); return out
}
function mk(type:Connector,kw:number,rand:()=>number):Charger { const ports=1+Math.floor(rand()*4); return {type,kw,ports,free:Math.max(0,ports-Math.floor(rand()*2))} }
export function bestCharger(st:Station,v:Vehicle) { let best:{charger:Charger;kw:number}|null=null; for(const c of st.chargers){const max=v.connectors[c.type];if(!max)continue;const kw=Math.min(max,c.kw);if(!best||kw>best.kw)best={charger:c,kw}}return best }
export const isCompatible=(st:Station,v:Vehicle)=>bestCharger(st,v)!==null
