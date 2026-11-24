export type ApiErrorKind='offline'|'unavailable'|'not-found'|'no-route'|'rate-limited'|'timeout'|'aborted'
export class ApiError extends Error {constructor(public kind:ApiErrorKind,public service:string,message:string){super(message)}}
export const isOnline=()=>typeof navigator==='undefined'||navigator.onLine!==false
export const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms))
export async function fetchJson<T>(url:string,service:string,opts:{method?:'GET'|'POST';body?:string;headers?:Record<string,string>;timeoutMs?:number;signal?:AbortSignal}={}):Promise<T>{
 if(!isOnline())throw new ApiError('offline',service,'You appear to be offline.')
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort('timeout'),opts.timeoutMs??15000),onAbort=()=>ctrl.abort('aborted');opts.signal?.addEventListener('abort',onAbort)
 try{const res=await fetch(url,{method:opts.method??'GET',body:opts.body,headers:opts.headers,signal:ctrl.signal});if(res.status===429)throw new ApiError('rate-limited',service,`${service} is rate-limiting requests. Please wait a moment.`);if(!res.ok&&res.status!==400)throw new ApiError('unavailable',service,`${service} responded with ${res.status}.`);return await res.json() as T}
 catch(e){if(e instanceof ApiError)throw e;if(opts.signal?.aborted)throw new ApiError('aborted',service,'Request cancelled.');if(ctrl.signal.aborted)throw new ApiError('timeout',service,`${service} took too long to respond.`);if(!isOnline())throw new ApiError('offline',service,'Network connection lost.');throw new ApiError('unavailable',service,`${service} is unreachable right now.`)}finally{clearTimeout(timer);opts.signal?.removeEventListener('abort',onAbort)}
}
export async function withMirrors<T>(bases:string[],run:(base:string)=>Promise<T>):Promise<T>{let last:unknown;for(const base of bases){try{return await run(base)}catch(e){last=e;if(e instanceof ApiError&&(e.kind==='aborted'||e.kind==='offline'||e.kind==='no-route'||e.kind==='not-found'))throw e}}throw last}
