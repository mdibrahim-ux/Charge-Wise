import { bestCharger, generateStations, type Station } from '../data/stations'
import { whPerKm, type Vehicle } from '../data/vehicles'
import { clamp } from './geo'
import type { Route } from './route'
export type Preference='fastest'|'min-stops'|'efficient'
export type Weather='clear'|'hot'|'rain'
export type TripInput={route:Route;vehicle:Vehicle;startSoc:number;reserve:number;preference:Preference;weather:Weather;pillion:boolean;preferredStationIds?:string[]}
export type Stop={index:number;station:Station;km:number;kmFromPrev:number;arriveSoc:number;departSoc:number;chargeMin:number;chargeKw:number;energyAddedKwh:number;alternatives:Station[]}
export type Leg={from:string;to:string;startKm:number;endKm:number;km:number;energyKwh:number;startSoc:number;endSoc:number;driveMin:number;climbM:number}
export type Issue={type:'battery-low'|'no-station'|'range-gap';title:string;message:string;km:number;requiredSoc?:number}
export type ProfilePoint={km:number;soc:number;elev:number;charging?:boolean}
export type TripPlan={input:TripInput;feasible:boolean;issue?:Issue;stops:Stop[];legs:Leg[];profile:ProfilePoint[];stations:Station[];arrivalSoc:number;totalKm:number;driveMin:number;chargeMin:number;totalMin:number;energyKwh:number;avgWhKm:number;usableKwhAtStart:number;rangeAtStartKm:number;factors:{label:string;value:string;impact:number}[]}
const SPEED:Record<Preference,number>={fastest:54,'min-stops':47,efficient:40}
const SPEED_F:Record<Preference,number>={fastest:1.12,'min-stops':1,efficient:0.9}
const CHARGE_CAP:Record<Preference,number>={fastest:80,'min-stops':100,efficient:85}
const WEATHER_F:Record<Weather,number>={clear:1,hot:1.05,rain:1.08}
export function makeModel(input:TripInput) {
 const {route,vehicle,preference,weather,pillion}=input,base=whPerKm(vehicle),massF=pillion?1.4:1,pts=route.points,cumWh=new Float64Array(pts.length),cumMin=new Float64Array(pts.length)
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dk=b.km-a.km,dh=b.elev-a.elev,urbanF=b.urban?1.07:1;let wh=base*dk*SPEED_F[preference]*WEATHER_F[weather]*(pillion?1.1:1)*urbanF;wh+=dh>0?0.41*dh*massF:0.13*dh*massF;wh=Math.max(wh,base*dk*0.25);cumWh[i]=cumWh[i-1]+wh;const grade=dk>0?Math.abs(dh)/(dk*1000):0;let speed=b.urban?26:SPEED[preference];if(grade>0.035)speed*=0.78;if(weather==='rain')speed*=0.9;cumMin[i]=cumMin[i-1]+(dk/speed)*60}
 const idxAt=(km:number)=>{let lo=0,hi=pts.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(pts[mid].km<km)lo=mid+1;else hi=mid}return lo}
 const whAt=(km:number)=>cumWh[idxAt(km)],minAt=(km:number)=>cumMin[idxAt(km)]
 return {base,whAt,minAt,idxAt,cumWh,cumMin}
}
function chargeMinutes(fromSoc:number,toSoc:number,capKwh:number,kw:number){const lowPart=Math.max(0,Math.min(toSoc,80)-fromSoc),highPart=Math.max(0,toSoc-Math.max(fromSoc,80)),hrs=((lowPart/100)*capKwh)/kw+((highPart/100)*capKwh)/(kw*0.5);return hrs*60+4}
export function planTrip(input:TripInput):TripPlan {
 const {route,vehicle,startSoc,reserve,preference}=input,cap=vehicle.capacityKwh,model=makeModel(input),all=generateStations(route),usable=all.filter(s=>s.status!=='offline'&&bestCharger(s,vehicle)),preferred=new Set(input.preferredStationIds??[]),end=route.totalKm,energy=(a:number,b:number)=>(model.whAt(b)-model.whAt(a))/1000
 let pos=0,soc=startSoc;const stops:Stop[]=[];let issue:Issue|undefined
 for(let guard=0;guard<25;guard++){
  const needDest=(energy(pos,end)/cap)*100;if(soc-needDest>=reserve)break
  const reachWith=(floor:number)=>usable.filter(s=>{if(s.km<=pos+0.5)return false;const need=((energy(pos,s.km)+(s.offRouteKm*model.base)/1000)/cap)*100;return soc-need>=floor})
  let reachable=reachWith(reserve);if(!reachable.length)reachable=reachWith(Math.min(reserve,5))
  if(!reachable.length){let failKm=pos;for(const p of route.points){if(p.km<pos)continue;if(soc-(energy(pos,p.km)/cap)*100<=0)break;failKm=p.km}const nextStation=usable.find(s=>s.km>pos+0.5)
   if(stops.length===0){const target=nextStation?nextStation.km:end,req=Math.ceil(((energy(0,target)/cap)*100+reserve)/5)*5;issue=req<=100?{type:'battery-low',title:'Battery too low to start this trip',message:`At ${startSoc}% you would run out around km ${Math.round(failKm)}, before reaching the first compatible charger${nextStation?` at km ${Math.round(nextStation.km)}`:''}. Charge to at least ${req}% before departing.`,km:failKm,requiredSoc:Math.min(100,req)}:{type:'range-gap',title:'No feasible route with this vehicle',message:`The first compatible charger is ${Math.round(target)} km away — beyond the ${vehicle.name}'s estimated full-charge range on this terrain.`,km:failKm}}
   else issue={type:nextStation?'range-gap':'no-station',title:'No feasible route with current settings',message:nextStation?`After stop ${stops.length}, the next compatible charger (km ${Math.round(nextStation.km)}) is beyond reach even at ${Math.round(soc)}%. Try Minimum charging stops (charges to 100%) or a lower reserve.`:`There are no compatible, operational chargers between km ${Math.round(pos)} and your destination within range.`,km:failKm};break
  }
  const score=(s:Station)=>{const kw=bestCharger(s,vehicle)!.kw;let v=s.km+kw*(preference==='fastest'?16:preference==='efficient'?10:7);v-=s.offRouteKm*(preference==='efficient'?6:3);if(s.status==='busy')v-=8;if(preferred.has(s.id))v+=10000;return v}
  const pick=reachable.reduce((a,b)=>score(b)>score(a)?b:a),arriveSoc=soc-((energy(pos,pick.km)+(pick.offRouteKm*model.base)/1000)/cap)*100,toDest=(energy(pick.km,end)/cap)*100+reserve+4,target=clamp(Math.min(CHARGE_CAP[preference],Math.max(toDest,arriveSoc+10)),arriveSoc,100),departSoc=Math.max(Math.min(100,arriveSoc+10),toDest<=CHARGE_CAP[preference]?Math.min(100,Math.ceil(toDest/5)*5):target),kw=bestCharger(pick,vehicle)!.kw,chargeMin=chargeMinutes(arriveSoc,departSoc,cap,kw),alternatives=usable.filter(s=>s.id!==pick.id&&Math.abs(s.km-pick.km)<22).slice(0,3)
  stops.push({index:stops.length+1,station:pick,km:pick.km,kmFromPrev:pick.km-pos,arriveSoc,departSoc,chargeMin,chargeKw:kw,energyAddedKwh:((departSoc-arriveSoc)/100)*cap,alternatives});pos=pick.km;soc=departSoc
 }
 const profile:ProfilePoint[]=[],legs:Leg[]=[];let curSoc=startSoc,legStart=0;const marks=[...stops.map(s=>({km:s.km,stop:s as Stop|null})),{km:end,stop:null as Stop|null}],reach=issue?issue.km:end,step=Math.max(1,Math.floor(route.points.length/260));let prevName=route.origin.name
 for(const m of marks){const legEnd=Math.min(m.km,reach),s0=curSoc;for(let i=0;i<route.points.length;i+=step){const p=route.points[i];if(p.km<legStart||p.km>legEnd)continue;profile.push({km:p.km,soc:Math.max(0,s0-(energy(legStart,p.km)/cap)*100),elev:p.elev})}const e=energy(legStart,legEnd)+(m.stop?(m.stop.station.offRouteKm*model.base)/1000:0),endSoc=m.stop?m.stop.arriveSoc:Math.max(0,s0-(e/cap)*100),i0=model.idxAt(legStart),i1=model.idxAt(legEnd);let climb=0;for(let i=i0+1;i<=i1;i++)climb+=Math.max(0,route.points[i].elev-route.points[i-1].elev);const toName=m.stop?`Stop ${m.stop.index}`:issue?'Battery depleted':route.destination.name
  legs.push({from:prevName,to:toName,startKm:legStart,endKm:legEnd,km:legEnd-legStart+(m.stop?m.stop.station.offRouteKm:0),energyKwh:e,startSoc:s0,endSoc,driveMin:model.minAt(legEnd)-model.minAt(legStart)+(m.stop?m.stop.station.offRouteKm*2.4:0),climbM:climb})
  if(legEnd>=reach&&issue)break;profile.push({km:legEnd,soc:endSoc,elev:route.points[i1].elev});if(m.stop){profile.push({km:m.stop.km+0.01,soc:m.stop.departSoc,elev:route.points[i1].elev,charging:true});curSoc=m.stop.departSoc;prevName=`Stop ${m.stop.index}`}legStart=legEnd
 }
 const driveMin=legs.reduce((a,l)=>a+l.driveMin,0),chargeMin=stops.reduce((a,s)=>a+s.chargeMin,0),energyKwh=legs.reduce((a,l)=>a+l.energyKwh,0),arrivalSoc=issue?0:legs[legs.length-1].endSoc,base=model.base,climbTotal=legs.reduce((a,l)=>a+l.climbM,0)
 const factors=[{label:'Riding speed',value:`${SPEED[preference]} km/h cruise`,impact:Math.round((SPEED_F[preference]-1)*100)},{label:'Terrain',value:`${Math.round(climbTotal)} m total climb`,impact:Math.round(((climbTotal*0.41)/(base*end))*100)},{label:'Traffic',value:`${Math.round(route.points.filter(p=>p.urban).length/Math.max(1,route.points.length)*100)}% urban`,impact:Math.round(route.points.filter(p=>p.urban).length/Math.max(1,route.points.length)*7)},{label:'Weather',value:input.weather==='clear'?'Clear · 27°C':input.weather==='hot'?'Hot · 38°C':'Rain',impact:Math.round((WEATHER_F[input.weather]-1)*100)},{label:'Payload',value:input.pillion?'Rider + pillion':'Single rider',impact:input.pillion?10:0}]
 return {input,feasible:!issue,issue,stops,legs,profile,stations:all,arrivalSoc,totalKm:end,driveMin,chargeMin,totalMin:driveMin+chargeMin,energyKwh,avgWhKm:(energyKwh*1000)/Math.max(1,reach),usableKwhAtStart:(cap*startSoc)/100,rangeAtStartKm:((cap*startSoc)/100)*1000/(base*SPEED_F[preference]*WEATHER_F[input.weather]*(input.pillion?1.1:1)),factors}
}
