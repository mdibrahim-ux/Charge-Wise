import { socColor } from '../lib/format'
import { cx } from './ui'
export function BatteryCells({soc,cells=10,className}:{soc:number;cells?:number;className?:string}) {
 const color=socColor(soc)
 return <div className={cx('flex items-center',className)} aria-hidden><div className="flex h-full flex-1 gap-[3px] rounded-lg border-2 border-black bg-white p-[3px]">{Array.from({length:cells},(_,i)=>{const fill=Math.max(0,Math.min(1,soc/(100/cells)-i));return <div key={i} className="relative h-full flex-1 overflow-hidden rounded-[3px] bg-black/[0.07]"><div className="absolute inset-y-0 left-0 transition-all duration-300" style={{width:`${fill*100}%`,background:color}}/></div>})}</div><div className="h-3 w-1.5 rounded-r-sm border-2 border-l-0 border-black bg-black"/></div>
}
export function BatteryPill({soc,className}:{soc:number;className?:string}) { return <span className={cx('inline-flex items-center gap-1 rounded-full border-2 border-black px-2 py-px font-mono text-[11px] font-bold text-black',className)} style={{background:socColor(soc)}}>{Math.round(soc)}%</span> }
export function SocRing({soc,size=56,stroke=6,label}:{soc:number;size?:number;stroke?:number;label?:string}) {
 const r=(size-stroke)/2-2,c=2*Math.PI*r,color=socColor(soc)
 return <div className="relative shrink-0 rounded-full border-2 border-black bg-white" style={{width:size,height:size}}><svg width={size-4} height={size-4} className="-rotate-90"><circle cx={(size-4)/2} cy={(size-4)/2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke}/><circle cx={(size-4)/2} cy={(size-4)/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${(Math.max(0,soc)/100)*c} ${c}`} className="transition-all duration-700"/></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="num text-[13px] font-bold text-black">{Math.round(soc)}%</span>{label&&<span className="text-[9px] font-bold text-slate uppercase">{label}</span>}</div></div>
}
