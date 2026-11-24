import { PLACES, type Place } from '../data/places'
import { fromKm, hashString, haversine, lerp, rng, toKm } from './geo'
export type RoutePoint = { lat:number;lon:number;km:number;elev:number;urban:boolean }
export type Via = { place:Place;km:number }
export type Route = { id:string;origin:Place;destination:Place;points:RoutePoint[];vias:Via[];totalKm:number;hilly:boolean }
function pickVias(o:Place,d:Place) {
 const ref=o,A=toKm(o,ref),B=toKm(d,ref),dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy),limit=Math.max(12,L*0.085)
 let cands=PLACES.filter(pl=>pl.id!==o.id&&pl.id!==d.id).map(pl=>{const P=toKm(pl,ref),t=((P.x-A.x)*dx+(P.y-A.y)*dy)/(L*L),off=Math.abs((P.x-A.x)*dy-(P.y-A.y)*dx)/L;return {pl,t,off}}).filter(c=>c.t>0.02&&c.t<0.98&&c.off<limit).sort((a,b)=>a.t-b.t).map(c=>c.pl)
 let changed=true
 while(changed&&cands.length){changed=false;const seq=[o,...cands,d];for(let i=1;i<seq.length-1;i++){const a=toKm(seq[i-1],ref),b=toKm(seq[i],ref),c=toKm(seq[i+1],ref),v1={x:b.x-a.x,y:b.y-a.y},v2={x:c.x-b.x,y:c.y-b.y},cos=(v1.x*v2.x+v1.y*v2.y)/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)||1);if(cos<0.25){cands=cands.filter(x=>x.id!==seq[i].id);changed=true;break}}}
 return cands
}
const ROUTE_CACHE=new Map<string,Route>()
export function buildRoute(o:Place,d:Place):Route {
 const id=`${o.id}__${d.id}`,cached=ROUTE_CACHE.get(id);if(cached)return cached
 const rand=rng(hashString(id)),seq=[o,...pickVias(o,d),d],raw:{lat:number;lon:number;elev:number;viaIdx?:number}[]=[]
 for(let i=0;i<seq.length-1;i++){
  const a=seq[i],b=seq[i+1],A=toKm(a,a),B=toKm(b,a),len=Math.hypot(B.x-A.x,B.y-A.y),nx=-(B.y-A.y)/(len||1),ny=(B.x-A.x)/(len||1),amp=len*(0.035+rand()*0.04)*(rand()>0.5?1:-1),amp2=len*0.012*rand(),freq=2+Math.floor(rand()*3),phase=rand()*Math.PI,steps=Math.max(2,Math.ceil(len/0.9)),hill=a.hilly||b.hilly?70:22
  for(let s=0;s<steps;s++){const t=s/steps,off=Math.sin(Math.PI*t)*amp+Math.sin(t*Math.PI*freq+phase)*amp2*Math.sin(Math.PI*t),x=lerp(A.x,B.x,t)+nx*off,y=lerp(A.y,B.y,t)+ny*off,ll=fromKm(x,y,a),noise=Math.sin(t*9+phase)*hill*0.6+Math.sin(t*23+phase*2)*hill*0.4,elev=lerp(a.elev,b.elev,t*t*(3-2*t))+noise*Math.sin(Math.PI*t);raw.push({...ll,elev,viaIdx:s===0?i:undefined})}
 }
 raw.push({lat:d.lat,lon:d.lon,elev:d.elev,viaIdx:seq.length-1})
 const points:RoutePoint[]=[],vias:Via[]=[];let km=0
 raw.forEach((r,i)=>{if(i>0)km+=haversine(raw[i-1],r)*1.06;points.push({lat:r.lat,lon:r.lon,km,elev:Math.max(0,r.elev),urban:false});if(r.viaIdx!==undefined)vias.push({place:seq[r.viaIdx],km})})
 for(const pt of points)pt.urban=vias.some(v=>Math.abs(v.km-pt.km)<(v.place.size==='metro'?18:v.place.size==='city'?9:2.5))
 const route:Route={id,origin:o,destination:d,points,vias,totalKm:km,hilly:seq.some(x=>x.hilly)};ROUTE_CACHE.set(id,route);return route
}
export function pointAtKm(route:Route,km:number):RoutePoint { const pts=route.points;if(km<=0)return pts[0];for(let i=1;i<pts.length;i++)if(pts[i].km>=km){const a=pts[i-1],b=pts[i],t=(km-a.km)/(b.km-a.km||1);return {lat:lerp(a.lat,b.lat,t),lon:lerp(a.lon,b.lon,t),km,elev:lerp(a.elev,b.elev,t),urban:a.urban}}return pts[pts.length-1] }
export function nearestVia(route:Route,km:number) { let best=route.vias[0];for(const v of route.vias)if(Math.abs(v.km-km)<Math.abs(best.km-km))best=v;return best }
