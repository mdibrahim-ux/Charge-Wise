export const fmtKm = (km: number) => `${km >= 100 ? Math.round(km) : Math.round(km * 10) / 10} km`
export const fmtPct = (p: number) => `${Math.round(p)}%`
export function fmtDur(min: number) {
  const m = Math.round(min)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}
export const socColor = (soc: number) => (soc >= 50 ? '#B8ED65' : soc >= 25 ? '#19C6D2' : soc >= 12 ? '#F5AF45' : '#F2675A')
/** Darker variants of the SoC colours, readable as text on light surfaces. */
export const socInk = (soc: number) => (soc >= 50 ? '#3B6D0C' : soc >= 25 ? '#08707A' : soc >= 12 ? '#8A4F00' : '#AD2B1C')
