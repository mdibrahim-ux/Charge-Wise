# ChargeWise EV Trip Planner

ChargeWise is a Bengaluru-focused EV two-wheeler trip planner. It estimates trip feasibility from the selected scooter and battery level, plans road routes, and surfaces charging stations along the journey.

## Run locally

Requirements: Node.js 22 or newer and npm.

```bash
npm install
cp .env.example .env.local
```

Add your MapTiler browser key to `.env.local`:

```env
VITE_MAPTILER_KEY=your_maptiler_key_here
```

Start the development server:

```bash
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```

## Map configuration

The `streets` and `dark` Leaflet layers use MapTiler raster tiles when `VITE_MAPTILER_KEY` is configured. Without a key, the app falls back to keyless CARTO basemaps. The optional OSM layer continues to use OpenStreetMap tiles.

Configure `VITE_MAPTILER_KEY` in the Vercel project's **Production**, **Preview**, and **Development** environments. The key is delivered to the browser as part of the map tile URL, so treat it as a public browser key: restrict it in MapTiler Cloud to the exact ChargeWise deployment domains and any local development origin you use. Do not commit `.env.local` or a real key.

## Other live services

Location search and reverse geocoding use Photon and Nominatim; road routing uses OSRM; charging-station discovery uses Overpass; weather uses Open-Meteo. Their configurable endpoint defaults are defined in `src/live/config.ts`. MapTiler only supplies map tiles and does not replace these services.
