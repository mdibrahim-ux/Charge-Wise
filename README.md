# ChargeWise

A Bengaluru-focused EV charging intelligence explorer built with Vite, Leaflet and a Material You-inspired visual system.

## Features

- Interactive Bengaluru map with public charging station features queried from OpenStreetMap via Overpass.
- BBMP boundary lookup and location filtering, with a Bengaluru study-area bounding-box fallback.
- Station details, operator filter, search, fast/DC-tag filter and map links.
- Alternate Open Charge Map embedded map for an independent directory view.
- CSTEP (2024) candidate-location chart across nine RTO zones.
- A visible five-stage ChargeWise analysis pipeline and research/data provenance.

## Run locally

\`\`\`bash
git clone https://github.com/mdibrahim-ux/Charge-Wise.git
cd Charge-Wise
npm install
npm run dev
\`\`\`

Open the local URL printed by Vite (usually http://localhost:5173).

## Production build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Data and research notes

### Current mapped stations

The custom map queries OpenStreetMap features tagged \`amenity=charging_station\` in the Bengaluru study-area bounding box, then attempts to filter the results to the BBMP polygon. The result count is dynamic and appears with the query timestamp. It is **not** a complete certified inventory: OSM is community-maintained and can omit, duplicate or contain outdated station entries.

Use the **Open Charge Map** map switch as an independent directory view. PlugMap's Bengaluru directory reports 159 locations (including 122 working fast DC chargers) from an Open Charge Map snapshot dated 6 November 2026. That regional directory snapshot is a separate source and should not be added to the OSM count because its geographic coverage and inclusion rules differ.

### Research candidate locations

The chart reproduces CSTEP's 2024 potential future charging-location counts by RTO zone. These are candidate locations for future planning, **not existing chargers**:

| RTO zone | Potential locations |
|---|---:|
| Bengaluru Central | 82 |
| Bengaluru South | 64 |
| KR Puram | 62 |
| Bengaluru West | 56 |
| Jnanabharathi | 45 |
| Bengaluru North | 40 |
| Bengaluru East | 32 |
| Yelahanka | 23 |
| E-city | 7 |
| **Total** | **411** |

CSTEP describes the citywide set as approximately 400 potential locations. It additionally discusses around 2,500 existing bus stops as possible sites for modification; those are not included in the table above.

## Data sources

- [OpenStreetMap](https://www.openstreetmap.org/) and [Overpass API](https://overpass-api.de/)
- [Open Charge Map](https://www.openchargemap.org/develop/)
- [PlugMap Bengaluru directory](https://plugmap.in/ev-charging-stations/bengaluru.html) — snapshot 6 Nov 2026
- [CSTEP, Bengaluru 2030: EV charging demand and infrastructure (November 2024)](https://web.cstep.in/drupal/sites/default/files/2024-11/Bengaluru%202030_EV%20charging%20demand%20and%20infrastructure.pdf)
- [Smart One Bengaluru historical BESCOM/Bengaluru list](https://www.smartoneblr.com/static_content/EVSations.jsp) — page states final as of Dec 2021; historical cross-check only

## Important limitations

- The map is a public-data explorer, not a live charger-availability service.
- Connector, power, access and opening-hour details display only where a provider has tagged them.
- The South RTO marker is a research reference, not a verified spatial service-gap polygon.
- Proposed priority weights shown in the methodology are starter assumptions, not a validated model.

## Attribution

Map tiles and map features are © OpenStreetMap contributors. Open Charge Map data is provided by Open Charge Map and its contributors. CSTEP figures are reproduced with citation to the 2024 report.
