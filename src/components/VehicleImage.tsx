import type { Vehicle } from '../data/vehicles'
import { cx } from './ui'
export function VehicleImage({vehicle,className,compact}:{vehicle:Vehicle;className?:string;compact?:boolean}) {
 if(vehicle.image) return <img src={vehicle.image} alt={`${vehicle.name} (photo: Wikimedia Commons)`} loading="lazy" className={cx('h-full w-full object-cover',className)}/>
 return <div className={cx('flex h-full w-full flex-col items-center justify-center bg-ink-950 text-center',className)} style={{backgroundImage:'repeating-linear-gradient(45deg, rgba(17,17,17,0.06) 0 2px, transparent 2px 10px)'}} role="img" aria-label={`${vehicle.name} — no freely licensed photo available`}><span className={cx('font-bold tracking-tight text-black',compact?'text-[11px] leading-tight':'text-xl')}>{vehicle.name}</span>{!compact&&<span className="mt-1 rounded-full border-2 border-black bg-white px-2 py-0.5 text-[10px] font-bold text-slate">No free-licence photo available</span>}</div>
}
