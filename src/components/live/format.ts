export const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
export const fmtKm1 = (km: number) => `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
