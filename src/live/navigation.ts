import type { LatLng } from './geometry'
const ll=(p:LatLng)=>`${p.lat.toFixed(6)},${p.lon.toFixed(6)}`
export function googleMapsRoute(origin:LatLng|null,destination:LatLng,waypoints:LatLng[]=[]){const params=new URLSearchParams({api:'1',destination:ll(destination),travelmode:'two-wheeler'});if(origin)params.set('origin',ll(origin));if(waypoints.length)params.set('waypoints',waypoints.map(ll).join('|'));return `https://www.google.com/maps/dir/?${params.toString()}`}
export const googleMapsTo=(p:LatLng)=>googleMapsRoute(null,p)
