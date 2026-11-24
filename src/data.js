// CSTEP (2024): potential future charging locations by Bengaluru RTO zone.
// These are research candidate sites, NOT current operational charging stations.
export const cstepZones = [
  { zone: "Central", count: 82 },
  { zone: "South", count: 64, highlight: true },
  { zone: "KR Puram", count: 62 },
  { zone: "West", count: 56 },
  { zone: "Jnanabharathi", count: 45 },
  { zone: "North", count: 40 },
  { zone: "East", count: 32 },
  { zone: "Yelahanka", count: 23 },
  { zone: "E-City", count: 7 }
];

export const sources = [
  {
    name: "OpenStreetMap",
    category: "Live station layer",
    description: "Community-maintained map data. ChargeWise queries public charging-station features when the map loads; missing or outdated entries are possible.",
    url: "https://www.openstreetmap.org/"
  },
  {
    name: "Overpass API",
    category: "Map feature query",
    description: "Queries amenity=charging_station features within the Bengaluru study boundary.",
    url: "https://overpass-api.de/"
  },
  {
    name: "CSTEP · Bengaluru 2030",
    category: "Research report · 2024",
    description: "Demand and infrastructure assessment across nine RTO zones; identifies approximately 400 potential future locations.",
    url: "https://cstep.in/wp-content/uploads/2025/06/Bengaluru-2030_EV-charging-demand-and-infrastructure.pdf"
  },
  {
    name: "Open Charge Map",
    category: "Independent interactive map",
    description: "Second map layer embedded from the Open Charge Map public viewer. Its records are independent from OpenStreetMap and use their own listing and status metadata.",
    url: "https://map.openchargemap.io/?mode=embedded&latitude=12.9716&longitude=77.5946"
  },
  {
    name: "PlugMap Bengaluru",
    category: "Independent directory",
    description: "PlugMap lists 159 public stations around Bengaluru, including 122 working fast DC chargers, from its Open Charge Map snapshot dated 6 Nov 2026. This is a separate regional snapshot, not the OSM/BBMP map count.",
    url: "https://plugmap.in/ev-charging-stations/bengaluru.html"
  },
  {
    name: "evgoo Bengaluru",
    category: "Independent directory",
    description: "Another station directory with its own inclusion and listing rules. Use as an independent cross-check.",
    url: "https://evgoo.io/charging-stations/bengaluru"
  },
  {
    name: "Smart One Bengaluru · BESCOM listing",
    category: "Historical city reference",
    description: "A historical list of charging stations. Its page states the list was final as of December 2021, so it should not be treated as current inventory.",
    url: "https://www.smartoneblr.com/static_content/EVSations.jsp"
  }
];

export const bengaluruBounds = {
  south: 12.80,
  west: 77.42,
  north: 13.18,
  east: 77.82
};