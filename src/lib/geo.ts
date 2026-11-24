export type LatLon = { lat: number; lon: number }
const R = 6371
const rad = (d: number) => (d * Math.PI) / 180
export function haversine(a: LatLon, b: LatLon) {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export function toKm(p: LatLon, ref: LatLon) {
  return { x: (p.lon - ref.lon) * 111.32 * Math.cos(rad(ref.lat)), y: (p.lat - ref.lat) * 110.57 }
}
export function fromKm(x: number, y: number, ref: LatLon): LatLon {
  return { lat: ref.lat + y / 110.57, lon: ref.lon + x / (111.32 * Math.cos(rad(ref.lat))) }
}
export function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
