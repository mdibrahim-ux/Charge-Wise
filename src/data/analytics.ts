import { hashString, rng } from '../lib/geo'
import { buildRoute, type Route } from '../lib/route'
import { makeModel, planTrip, type Preference, type TripPlan } from '../lib/tripEngine'
import { placeById } from './places'
import { generateStations } from './stations'
import { VEHICLES } from './vehicles'
export type TripLog = { id: string; date: Date; label: string; vehicleId: string; distanceKm: number; estRangeKm: number; actualRangeKm: number; estEnergyKwh: number; actualEnergyKwh: number; whPerKm: number; batteryUsedPct: number; chargeSessions: number[]; preference: Preference; plan: TripPlan }
const LOG_ROUTES: [string, string][] = [['bengaluru','mysuru'],['mysuru','bengaluru'],['mumbai','pune'],['pune','mumbai'],['bengaluru','tumakuru'],['bengaluru','kolar'],['mysuru','madikeri'],['coimbatore','ooty'],['bengaluru','chennai'],['pune','satara'],['hosur','krishnagiri'],['bengaluru','madikeri']]
let CACHE: TripLog[] | null = null
export function getTripLogs(): TripLog[] {
  if (CACHE) return CACHE
  const rand = rng(hashString('chargewise-logs'))
  const now = new Date('2026-05-30T09:00:00')
  const out: TripLog[] = []
  for (let i = 0; i < 64; i++) {
    const [a,b] = LOG_ROUTES[Math.floor(rand()*LOG_ROUTES.length)]
    const route = buildRoute(placeById(a)!,placeById(b)!)
    const vehicle = VEHICLES[Math.floor(rand()*VEHICLES.length)]
    const prefs: Preference[] = ['fastest','min-stops','efficient']
    const preference = prefs[Math.floor(rand()*3)]
    const plan = planTrip({route,vehicle,startSoc:85+Math.floor(rand()*15),reserve:15,preference,weather:rand()>0.8?'rain':rand()>0.6?'hot':'clear',pillion:rand()>0.75})
    if (!plan.feasible) continue
    const noise = 0.9 + rand()*0.2
    const estWh = plan.avgWhKm
    const actualWh = estWh*noise
    const date = new Date(now.getTime()-Math.floor(rand()*120)*86400000-Math.floor(rand()*10)*3600000)
    out.push({id:`T-${(1040+i).toString()}`,date,label:`${route.origin.name} → ${route.destination.name}`,vehicleId:vehicle.id,distanceKm:plan.totalKm,estRangeKm:(vehicle.capacityKwh*1000)/estWh,actualRangeKm:(vehicle.capacityKwh*1000)/actualWh,estEnergyKwh:plan.energyKwh,actualEnergyKwh:plan.energyKwh*noise,whPerKm:actualWh,batteryUsedPct:((plan.energyKwh*noise)/vehicle.capacityKwh)*100,chargeSessions:plan.stops.map(s=>s.chargeMin*(0.85+rand()*0.35)),preference,plan})
  }
  out.sort((x,y)=>y.date.getTime()-x.date.getTime())
  CACHE=out
  return out
}
export function segmentEnergy(plan: TripPlan) {
  const model = makeModel(plan.input)
  const r = plan.input.route
  const out: {name:string;km:number;kwh:number;whKm:number;climb:number}[] = []
  for (let i=0;i<r.vias.length-1;i++) {
    const a=r.vias[i], b=r.vias[i+1]
    const kwh=(model.whAt(b.km)-model.whAt(a.km))/1000
    const km=b.km-a.km
    if (km<2) continue
    const i0=model.idxAt(a.km), i1=model.idxAt(b.km)
    let climb=0
    for(let j=i0+1;j<=i1;j++) climb+=Math.max(0,r.points[j].elev-r.points[j-1].elev)
    out.push({name:`${short(a.place.name)}–${short(b.place.name)}`,km,kwh,whKm:(kwh*1000)/km,climb})
  }
  return out
}
const short=(s:string)=>(s.length>9?s.slice(0,8)+'.':s)
export function stationsForRoutes(routes: Route[]) {
  const seen=new Set<string>()
  return routes.flatMap(r=>(seen.has(r.id)?[]:(seen.add(r.id),generateStations(r))))
}
