import { API, BENGALURU, inBengaluru } from './config'
import { ApiError, fetchJson, sleep } from './http'
export type GeoPlace={id:string;name:string;secondary:string;lat:number;lon:number;source:'photon'|'nominatim'|'gps'|'map'}
type PhotonFeature={properties:Record<string,string|undefined>&{osm_id?:number;osm_type?:string};geometry:{coordinates:[number,number]}}
const searchCache=new Map<string,GeoPlace[]>()
export async function searchPlaces(query:string,signal?:AbortSignal):Promise<GeoPlace[]> {
 const q=query.trim();if(q.length<3)return[];const key=q.toLowerCase(),hit=searchCache.get(key);if(hit)return hit
 const {west,south,east,north}=BENGALURU.bbox,url=`${API.photon}/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=${BENGALURU.center.lat}&lon=${BENGALURU.center.lon}&bbox=${west},${south},${east},${north}`
 const data=await fetchJson<{features:PhotonFeature[]}>(url,'Location search',{signal,timeoutMs:8000}),seen=new Set<string>(),out:GeoPlace[]=[]
 for(const f of data.features??[]){const [lon,lat]=f.geometry.coordinates;if(!inBengaluru(lat,lon))continue;const p=f.properties,name=p.name??[p.housenumber,p.street].filter(Boolean).join(' ');if(!name)continue;const parts=[p.name?[p.housenumber,p.street].filter(Boolean).join(' '):'',p.district??p.locality,p.city??p.county,p.postcode].filter((x):x is string=>!!x&&x!==name),dedupe=`${name}|${lat.toFixed(3)}|${lon.toFixed(3)}`;if(seen.has(dedupe))continue;seen.add(dedupe);out.push({id:`${p.osm_type}${p.osm_id}`,name,secondary:[...new Set(parts)].join(', ')||'Bengaluru',lat,lon,source:'photon'})}
 searchCache.set(key,out);return out
}
let lastCall=0,chain:Promise<unknown>=Promise.resolve()
export function nominatim<T>(path:string):Promise<T>{const run=chain.then(async()=>{const wait=Math.max(0,lastCall+1100-Date.now());if(wait)await sleep(wait);lastCall=Date.now();return fetchJson<T>(`${API.nominatim}${path}`,'Geocoder (Nominatim)',{timeoutMs:10000})});chain=run.catch(()=>undefined);return run}
type NominatimResult={place_id:number;lat:string;lon:string;name?:string;display_name:string}
const splitDisplay=(display:string,name?:string)=>{const parts=display.split(',').map(s=>s.trim()),title=name||parts[0],rest=parts.filter(x=>x!==title&&!/^(India|Karnataka|\d{6})$/.test(x)).slice(0,3);return {title,secondary:rest.join(', ')}}
export async function geocodeText(text:string):Promise<GeoPlace>{const {west,south,east,north}=BENGALURU.bbox,res=await nominatim<NominatimResult[]>(`/search?format=jsonv2&limit=1&countrycodes=in&accept-language=en&bounded=1&viewbox=${west},${north},${east},${south}&q=${encodeURIComponent(text)}`),r=res[0];if(!r)throw new ApiError('not-found','Geocoder',`We couldn't find “${text}” in Bengaluru.`);const {title,secondary}=splitDisplay(r.display_name,r.name);return {id:`n${r.place_id}`,name:title,secondary,lat:+r.lat,lon:+r.lon,source:'nominatim'}}
export async function reverseGeocode(lat:number,lon:number,source:GeoPlace['source']):Promise<GeoPlace>{try{const r=await nominatim<NominatimResult&{error?:string}>(`/reverse?format=jsonv2&zoom=17&accept-language=en&lat=${lat}&lon=${lon}`);if(r.error)throw new Error(r.error);const {title,secondary}=splitDisplay(r.display_name,r.name);return {id:`r${lat.toFixed(5)},${lon.toFixed(5)}`,name:title,secondary,lat,lon,source}}catch{return {id:`r${lat.toFixed(5)},${lon.toFixed(5)}`,name:`${lat.toFixed(5)}, ${lon.toFixed(5)}`,secondary:'Dropped pin',lat,lon,source}}}
