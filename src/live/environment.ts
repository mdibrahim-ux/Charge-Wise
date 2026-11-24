import { API, BENGALURU } from './config'
import { fetchJson } from './http'
import type { LatLng } from './geometry'
export async function fetchElevations(points: LatLng[]): Promise<number[] | null> {
  if (!points.length) return []
  try {
    const chunks: LatLng[][] = []
    for (let i = 0; i < points.length; i += 100) chunks.push(points.slice(i, i + 100))
    const res = await Promise.all(chunks.map((c) => fetchJson<{ elevation: number[] }>(`${API.openMeteo}/elevation?latitude=${c.map((p) => p.lat.toFixed(5)).join(',')}&longitude=${c.map((p) => p.lon.toFixed(5)).join(',')}`, 'Elevation (Open-Meteo)', { timeoutMs: 12000 })))
    const all = res.flatMap((r) => r.elevation)
    return all.length === points.length && all.every((x) => Number.isFinite(x)) ? all : null
  } catch { return null }
}
export type Weather = { tempC: number; precipMm: number; windKmh: number; observedAt: string }
export async function fetchWeather(): Promise<Weather | null> {
  try {
    const d = await fetchJson<{ current: { time: string; temperature_2m: number; precipitation: number; wind_speed_10m: number } }>(`${API.openMeteo}/forecast?latitude=${BENGALURU.center.lat}&longitude=${BENGALURU.center.lon}&current=temperature_2m,precipitation,wind_speed_10m&timezone=Asia%2FKolkata`, 'Weather (Open-Meteo)', { timeoutMs: 8000 })
    return { tempC: d.current.temperature_2m, precipMm: d.current.precipitation, windKmh: d.current.wind_speed_10m, observedAt: d.current.time }
  } catch { return null }
}
