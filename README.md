# ChargeWise

**Bengaluru EV mobility intelligence** — a clean, light travel-tech experience built with Vite, vanilla JavaScript and Leaflet. The public website is login-free.

## What it does

### Public map intelligence
- Queries public OpenStreetMap charging-station features for the Bengaluru study boundary.
- Draws the BBMP boundary when the public Nominatim geometry lookup is available.
- Shows station name, operator, connector, power, access and opening-hours tags where they exist.
- Search and filter by area, network, fast/DC and connector tags.
- Compare matching stations in a responsive list beside the map, with live map pins, station metadata and directions.
- Switch between OpenStreetMap tiles and the independent Open Charge Map viewer.
- Switch between the custom OpenStreetMap layer and the independent Open Charge Map viewer.
- Station metadata-completeness indicator. This is **not** a charger uptime or reliability score.

### Unique tools
- **Range Guard:** uses browser geolocation only after the user clicks. Compares estimated usable battery range with the nearest mapped station using straight-line distance, then links to driving directions. Road distance is longer and real availability is not checked.
- **EV Trip Planner:** accepts a starting point, destination, exact scooter profile, current state of charge, reserve and a user-adjustable range factor. It geocodes both places, requests a road route, searches OpenStreetMap charger features along the route corridor, estimates when a charge stop is needed, and renders the calculated route and suggested charging-stop pins in its own embedded map. Stops show approximate arrival battery, charge target, detour and connector/network-data confidence.
- **No login or account required:** map browsing, range checks and trip planning are public. There are no sign-in dialogs, saved-account areas or account-only controls in the website UI.

### Trip planner methodology
- Included manufacturer IDC reference figures: Ather 450X (161 km) and 450 Apex (165 km); TVS iQube 3.5 kWh (145 km) and iQube ST 5.3 kWh (212 km); Chetak 3501/3502 (153 km), 3503 (151 km), 3001 (127 km); VIDA V2 Pro (165 km) and V2 Plus (143 km). Figures are manufacturer-published reference values and may differ by model year/variant. Each profile links to the manufacturer's specification/FAQ page.
- The default planning range is 75% of the selected IDC figure. Riders can adjust this factor to reflect their own scooter, load, speed, gradients, road and weather conditions. The planner does not claim this factor is a certified real-world range.
- The stop algorithm accounts for the current battery, a configurable reserve, a target charge level, distance along the routed line and an estimated station detour. It prefers candidates whose station/network text matches the selected brand but never labels a record as guaranteed-compatible.
- Start/destination geocoding uses OpenStreetMap Nominatim; road routing uses the public OSRM demo service; route-corridor charger discovery uses the Overpass API. These are public community/demo services and may be rate-limited or temporarily unavailable.
- **Gap Scan:** highlights map cells whose nearest mapped OSM station is more than 2.7 km away in a straight line. It reveals gaps in the *mapped dataset*, not confirmed charging demand or infrastructure shortage.

### Research layer
- Reproduces CSTEP (2024) potential future charging-location counts by Bengaluru RTO zone.
- These counts are candidate sites, not current installed/operational charging stations.

## Stack

- Vite + vanilla JavaScript
- Leaflet + OpenStreetMap tiles / Overpass API
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

## Backend status

The public website currently operates without authentication or Supabase environment variables. The Supabase migration and secured station-sync Edge Function remain in the repository as optional backend groundwork, but the login, account, saved-station, community-report and admin interfaces are not part of the current frontend.

No backend project is needed to run the website locally. Public map browsing and the EV trip planner use OpenStreetMap, Overpass, Nominatim and OSRM services directly.

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
- The website is intentionally login-free. Personal saved lists, user-submitted reports and administrator tools are not exposed in the current public experience.
- The Gap Scan highlights distance from mapped records, not an empirically validated charging-demand gap.
- The candidate-location chart is research evidence, not a ChargeWise model result. The proposed 40/35/25 scoring formula is a starting assumption that needs local validation.

## Attribution

Map tiles and OSM feature data © OpenStreetMap contributors. Open Charge Map data is provided by Open Charge Map and its contributors. CSTEP figures are reproduced with attribution to the 2024 report.
