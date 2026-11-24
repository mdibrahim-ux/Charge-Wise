# ChargeWise

**Bengaluru EV infrastructure intelligence** — a bold dark neo-brutalist web application built with Vite, Leaflet and Supabase.

## What it does

### Public map intelligence
- Queries public OpenStreetMap charging-station features for the Bengaluru study boundary.
- Draws the BBMP boundary when the public Nominatim geometry lookup is available.
- Shows station name, operator, connector, power, access and opening-hours tags where they exist.
- Search and filter by operator and fast/DC tags.
- Switch between the custom OpenStreetMap layer and the independent Open Charge Map viewer.
- Station metadata-completeness indicator. This is **not** a charger uptime or reliability score.

### Unique tools
- **Range Guard:** uses browser geolocation only after the user clicks. Compares estimated usable battery range with the nearest mapped station using straight-line distance, then links to driving directions. Road distance is longer and real availability is not checked.
- **EV Trip Planner:** accepts a starting point, destination, exact scooter profile, current state of charge, reserve and a user-adjustable range factor. It geocodes both places, requests a road route, searches OpenStreetMap charger features along the route corridor, estimates when a charge stop is needed, and draws the route and suggested stops on the Leaflet map. Stops show approximate arrival battery, charge target, detour and connector/network-data confidence.

### Trip planner methodology
- Included manufacturer IDC reference figures: Ather 450X (161 km) and 450 Apex (165 km); TVS iQube 3.5 kWh (145 km) and iQube ST 5.3 kWh (212 km); Chetak 3501/3502 (153 km), 3503 (151 km), 3001 (127 km); VIDA V2 Pro (165 km) and V2 Plus (143 km). Figures are manufacturer-published reference values and may differ by model year/variant. Each profile links to the manufacturer's specification/FAQ page.
- The default planning range is 75% of the selected IDC figure. Riders can adjust this factor to reflect their own scooter, load, speed, gradients, road and weather conditions. The planner does not claim this factor is a certified real-world range.
- The stop algorithm accounts for the current battery, a configurable reserve, a target charge level, distance along the routed line and an estimated station detour. It prefers candidates whose station/network text matches the selected brand but never labels a record as guaranteed-compatible.
- Start/destination geocoding uses OpenStreetMap Nominatim; road routing uses the public OSRM demo service; route-corridor charger discovery uses the Overpass API. These are public community/demo services and may be rate-limited or temporarily unavailable.
- **Gap Scan:** highlights map cells whose nearest mapped OSM station is more than 2.7 km away in a straight line. It reveals gaps in the *mapped dataset*, not confirmed charging demand or infrastructure shortage.
- **Community Field Reports:** signed-in users can report closed stations, wrong coordinates, connector/power information, access issues, incorrect hours, or suggest a missing charger.
- **Saved Chargers:** authenticated users can keep a personal list of locations.
- **Admin review:** users with the admin profile role can review community reports and trigger station inventory synchronisation into the database.

### Research layer
- Reproduces CSTEP (2024) potential future charging-location counts by Bengaluru RTO zone.
- These counts are candidate sites, not current installed/operational charging stations.

## Stack

- Vite + vanilla JavaScript
- Leaflet + OpenStreetMap tiles / Overpass API
- Supabase Auth (email magic link), Postgres, Row Level Security and Edge Functions
- Vercel deployment

## Run the public website locally

~~~bash
git clone https://github.com/mdibrahim-ux/Charge-Wise.git
cd Charge-Wise
npm install
npm run dev
~~~

Open the local Vite URL, usually http://localhost:5173.

## Build

~~~bash
npm run build
npm run preview
~~~

## Connect the ChargeWise backend

The Supabase backend implementation is committed in the supabase directory. A separate **ChargeWise Supabase project** must be created and connected before auth, saved chargers, user reports and admin tools become persistent. The app detects when Supabase environment variables are absent and keeps public map browsing available.

1. Create a new Supabase project for ChargeWise (do not reuse another application's database).
2. Copy .env.example to .env.local and add the project URL and publishable key from Supabase Settings → API Keys:

~~~env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
~~~

3. Link the Supabase project and apply the database migration:

~~~bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
~~~

4. Deploy the secured station-sync Edge Function:

~~~bash
npx supabase functions deploy sync-bengaluru-stations
~~~

5. In Supabase Authentication → URL Configuration, set the Site URL to your deployed website and add http://localhost:5173 as an allowed redirect URL. Add https://charge-wise-omega.vercel.app as well.
6. In Supabase SQL Editor, promote the intended project owner account to admin after that user has signed in once:

~~~sql
update public.profiles
set role = 'admin'
where email = 'YOUR_OWNER_EMAIL';
~~~

7. Set the same two public Vite environment variables in Vercel Project → Settings → Environment Variables, then redeploy. Never add a Supabase secret/service-role key to your VITE_ variables.

The Edge Function receives an authenticated user's JWT, checks the user's database role, and only then uses the server-side service-role key to sync public OSM features. The service-role key is never included in frontend code.

## Database model and access controls

The migration creates:
- profiles — Auth-linked account profile and role (member or admin).
- charging_stations — cached public charging inventory, indexed by source and external ID.
- saved_stations — per-user saved locations.
- station_reports — authenticated user reports with moderation state (pending, reviewing, accepted, rejected).
- station_sync_runs — protected audit trail for admin station synchronisations.

Row Level Security:
- Public users can read the station inventory.
- Users can read their own profile, saved stations and reports.
- Users can insert their own reports, but cannot approve or edit moderation status.
- Only admins can manage the inventory, moderate reports and read sync history.
- Admin role promotion is intentionally not exposed in the browser; it is done through the trusted SQL editor.

## Research and data provenance

### Research candidate locations by Bengaluru RTO zone

| RTO zone | Candidate locations |
|---|---:|
| Central | 82 |
| South | 64 |
| KR Puram | 62 |
| West | 56 |
| Jnanabharathi | 45 |
| North | 40 |
| East | 32 |
| Yelahanka | 23 |
| E-City | 7 |
| **Total** | **411** |

CSTEP describes the total as approximately 400 potential future charging locations. This is not an installed charger count.

### Sources
- [OpenStreetMap](https://www.openstreetmap.org/) and [Overpass API](https://overpass-api.de/) — live map records.
- [Open Charge Map](https://www.openchargemap.org/develop/) — separate independent directory/map viewer.
- [PlugMap Bengaluru](https://plugmap.in/ev-charging-stations/bengaluru.html) — independent snapshot, not merged with the OSM count.
- [CSTEP, Bengaluru 2030: EV Charging Demand and Infrastructure (2024)](https://cstep.in/wp-content/uploads/2025/06/Bengaluru-2030_EV-charging-demand-and-infrastructure.pdf) — future candidate-location research.
- [Smart One Bengaluru historical BESCOM listing](https://www.smartoneblr.com/static_content/EVSations.jsp) — page indicates a December 2021 list; historical cross-check only.

## Important limitations

- OpenStreetMap is community-maintained and is not a complete or certified station inventory.
- Data can be missing, duplicated or out of date. Connector, power, access and opening hours are shown only where tagged.
- The map does not confirm real-time charger availability, pricing, uptime or compatibility with a specific vehicle.
- The Range Guard uses straight-line distances and does not calculate actual road range or battery consumption.
- The Trip Planner uses a general driving road profile rather than a scooter-specific legally verified route. It estimates battery consumption using a configurable fraction of IDC range, not a live vehicle telemetry model.
- Public station datasets do not reliably expose vehicle-side connector compatibility, socket access, uptime, pricing or live availability. A brand/network text match is only a lead; verify each stop in the OEM app and with the operator before setting out.
- The Trip Planner queries public Nominatim, OSRM and Overpass services. Availability, coverage and rate limits are outside ChargeWise control.
- The Gap Scan highlights distance from mapped records, not an empirically validated charging-demand gap.
- The candidate-location chart is research evidence, not a ChargeWise model result. The proposed 40/35/25 scoring formula is a starting assumption that needs local validation.

## Attribution

Map tiles and OSM feature data © OpenStreetMap contributors. Open Charge Map data is provided by Open Charge Map and its contributors. CSTEP figures are reproduced with attribution to the 2024 report.
