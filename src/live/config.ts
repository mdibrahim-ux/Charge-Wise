/**
 * External services used by the live Bengaluru planner. All are keyless public
 * endpoints; each can be overridden with a VITE_* environment variable (e.g. to
 * point at a self-hosted OSRM or Overpass instance).
 */
const env = (import.meta.env ?? {}) as Record<string, string | undefined>
export const API = {
  photon: env.VITE_PHOTON_URL ?? 'https://photon.komoot.io',
  nominatim: env.VITE_NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org',
  osrm: [env.VITE_OSRM_URL ?? 'https://router.project-osrm.org', 'https://routing.openstreetmap.de/routed-car'],
  overpass: [env.VITE_OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'],
  openMeteo: env.VITE_OPEN_METEO_URL ?? 'https://api.open-meteo.com/v1',
}
export const BENGALURU = { name: 'Bengaluru', center: { lat: 12.9716, lon: 77.5946 }, bbox: { south: 12.7, west: 77.3, north: 13.35, east: 77.95 } }
export const inBengaluru = (lat: number, lon: number) => lat >= BENGALURU.bbox.south && lat <= BENGALURU.bbox.north && lon >= BENGALURU.bbox.west && lon <= BENGALURU.bbox.east
/** MapTiler keys are public browser keys. Restrict them to the ChargeWise domains in MapTiler Cloud; Vite embeds VITE_* values into the client bundle at build time. */
const mapTilerKey = env.VITE_MAPTILER_KEY?.trim()
const mapTilerTiles = (style: string) => mapTilerKey ? `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerKey)}` : undefined
const mapTilerAttribution = '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
const cartoAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
export const TILE_LAYERS = {
  streets: { label: 'Streets', url: mapTilerTiles('streets-v4') ?? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attribution: mapTilerKey ? mapTilerAttribution : cartoAttribution, maxZoom: 20 },
  osm: { label: 'OSM', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 },
  dark: { label: 'Dark', url: mapTilerTiles('dataviz-v4-dark') ?? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: mapTilerKey ? mapTilerAttribution : cartoAttribution, maxZoom: 20 },
} as const
export type TileLayerId = keyof typeof TILE_LAYERS
