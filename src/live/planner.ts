import { compatibility } from './compatibility'
import { fetchElevations, fetchWeather, type Weather } from './environment'
import { cumulativeKm, projectOnPolyline } from './geometry'
import { fetchRoutes, type RoadRoute } from './routing'
import { fetchBengaluruStations, type ChargingStation } from './stations'
import { buildProfile, type EnergyProfile, type LivePreference } from './energyModel'
import type { GeoPlace } from './geocoding'
import type { Vehicle } from '../data/vehicles'
export type PlanInput={origin:GeoPlace;destination:GeoPlace;vehicle:Vehicle;battery:number;reserve:number;preference:LivePreference;pillion:boolean;departAt?:Date}
export type Suggestion={id:string;label:string;detail:string;battery?:number;reserve?:number;preference?:LivePreference}
export type StationOnRoute=ChargingStation & {kmOnRoute:number;offRouteKm:number;compatible:ReturnType<typeof compatibility>}
export type ChargeStop={station:StationOnRoute;arriveSoc:number;departSoc:number;chargeMin:number;energyAddedKwh:number}
export type PlanIssue={title:string;message:string;km:number;requiredSoc?:number}
export type JourneyPlan={input:PlanInput;route:RoadRoute;profile:EnergyProfile;stations:StationOnRoute[];stops:ChargeStop[];feasible:boolean;issue?:PlanIssue;arrivalSoc:number;distanceKm:number;driveMin:number;chargeMin:number;totalMin:number;energyKwh:number;avgWhKm:number;weather:Weather|null;sourceNote:string}
export async function planJourney(input:PlanInput,onProgress?:(message:string)=>void,signal?:AbortSignal):Promise<JourneyPlan>{
 onProgress?.('Finding the road route…')
 let route:RoadRoute
 try{route=(await fetchRoutes([input.origin,input.destination],{signal}))[0]}catch(error){if(signal?.aborted)throw error;const km=Math.hypot((input.destination.lat-input.origin.lat)*110.57,(input.destination.lon-input.origin.lon)*111.32*Math.cos(input.origin.lat*Math.PI/180))*1.18;route={coords:[[input.origin.lat,input.origin.lon],[input.destination.lat,input.destination.lon]],distanceM:km*1000,durationS:km/42*3600,legs:[],segDurationsS:null,source:'Approximate straight-line fallback'}}
 onProgress?.('Checking terrain and weather…')
 const samples=await fetchElevations(route.coords.map(([lat,lon])=>({lat,lon}))).catch(()=>null),elevations=samples?Float64Array.from(samples):null,weather=await fetchWeather().catch(()=>null)
 const profile=buildProfile(route,input.vehicle,{elevations,weather,pillion:input.pillion,departAt:input.departAt??new Date(),preference:input.preference})
 onProgress?.('Checking compatible charging stations…')
 const stationSet=await fetchBengaluruStations(),cum=cumulativeKm(route.coords)
 const stations:StationOnRoute[]=stationSet.stations.map(st=>{const p=projectOnPolyline({lat:st.lat,lon:st.lon},route.coords,cum);return {...st,kmOnRoute:p.alongKm,offRouteKm:p.distKm,compatible:compatibility(st,input.vehicle)}}).filter(s=>s.offRouteKm<=5&&s.compatible.level!=='incompatible'&&s.kmOnRoute>2&&s.kmOnRoute<profile.totalKm-1).sort((a,b)=>a.kmOnRoute-b.kmOnRoute)
 const energyKwh=profile.totalWh/1000,avgWhKm=profile.totalWh/Math.max(1,profile.totalKm),usable=(input.battery-input.reserve)/100*input.vehicle.capacityKwh*1000,stops:ChargeStop[]=[]
 let issue:PlanIssue|undefined,arrivalSoc=input.battery-profile.totalWh/(input.vehicle.capacityKwh*1000)*100
 if(profile.totalWh>usable){const reachable=stations.filter(s=>s.kmOnRoute<=usable/avgWhKm-Math.max(.5,s.offRouteKm*2)),good=reachable.filter(s=>s.compatible.level==='compatible'),pick=good.length?good[good.length-1]:reachable.length?reachable[reachable.length-1]:undefined
 if(!pick){const required=Math.min(100,Math.ceil((input.reserve+profile.totalWh/(input.vehicle.capacityKwh*1000)*100)/5)*5);issue={title:'Not enough battery to complete this trip',message:stations.length?'No compatible charging station is within your current battery range. Increase your departure charge or choose a scooter with more range.':'No mapped charging station was found within reach on this route. Check station coverage and confirm charging access before departure.',km:Math.max(0,usable/avgWhKm),requiredSoc:required}}
 else{const arriveSoc=Math.max(0,input.battery-(pick.kmOnRoute*avgWhKm+pick.offRouteKm*avgWhKm*2)/(input.vehicle.capacityKwh*10)),remainingWh=(profile.totalKm-pick.kmOnRoute+pick.offRouteKm)*avgWhKm,target=Math.min(95,Math.max(80,Math.ceil((input.reserve+remainingWh/(input.vehicle.capacityKwh*10))*5)/5)),departSoc=Math.min(100,Math.max(arriveSoc+10,target)),energyAddedKwh=(departSoc-arriveSoc)/100*input.vehicle.capacityKwh,kw=Math.max(.5,pick.compatible.kw),chargeMin=energyAddedKwh/kw*60+4;stops.push({station:pick,arriveSoc,departSoc,chargeMin,energyAddedKwh});const afterWh=remainingWh,afterReach=(departSoc-input.reserve)/100*input.vehicle.capacityKwh*1000;if(afterWh>afterReach&&!stations.some(s=>s.kmOnRoute>pick.kmOnRoute&&s.kmOnRoute-pick.kmOnRoute<afterReach/avgWhKm))issue={title:'Another charging stop may be required',message:'The next section is longer than the estimated reserve-aware range. Confirm charging availability before departure.',km:pick.kmOnRoute}}}
 const finalSoc=stops.length?stops[0].departSoc-((profile.totalKm-stops[0].station.kmOnRoute+stops[0].station.offRouteKm)*avgWhKm/(input.vehicle.capacityKwh*10)):arrivalSoc
 return {input,route,profile,stations,stops,feasible:!issue,issue,arrivalSoc:Math.max(0,Math.min(100,stops.length?finalSoc:arrivalSoc)),distanceKm:profile.totalKm,driveMin:profile.totalMin,chargeMin:stops.reduce((a,s)=>a+s.chargeMin,0),totalMin:profile.totalMin+stops.reduce((a,s)=>a+s.chargeMin,0),energyKwh,avgWhKm,weather,sourceNote:stationSet.partial?'Charger data came from a partial fallback query.':'Charging stations sourced from OpenStreetMap; availability is not live.'}
}
