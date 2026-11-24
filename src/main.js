import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import { bengaluruBounds, cstepZones, sources } from "./data.js";

const $ = (s) => document.querySelector(s);
const svg = {
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 10-12h-7l1-8Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  external: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7m-1-6-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3"/></svg>'
};

const html = "<div class=\"app-shell\">\n  <header class=\"topbar\">\n    <a class=\"brand\" href=\"#top\" aria-label=\"ChargeWise home\"><span class=\"brand-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M13 2 4 14h7l-1 8 10-12h-7l1-8Z\"/></svg></span><span>chargewise<span class=\"period\">.</span></span></a>\n    <nav aria-label=\"Main navigation\"><a class=\"active\" href=\"#top\">Overview</a><a href=\"#map-section\">Charging map</a><a href=\"#trip-planner\">Trip planner</a><a href=\"#insights\">EV insights</a></nav>\n    <div class=\"header-actions\"><span class=\"city-chip\"><i></i>Bengaluru, India</span><a class=\"nav-cta\" href=\"#trip-planner\">Plan a trip <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></a><button class=\"mobile-menu\" id=\"mobile-menu\" aria-label=\"Open navigation\">☰</button></div>\n  </header>\n  <main id=\"top\">\n    <section class=\"hero\">\n      <div class=\"hero-copy\"><span class=\"eyebrow-pill\">BENGALURU EV CHARGING, MADE SIMPLE</span><h1>A better way to<br><em>move electric.</em></h1><p>Find charging options, understand your range and plan every ride with confidence.</p><div class=\"hero-actions\"><a class=\"btn btn-primary\" href=\"#trip-planner\">Plan my journey <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></a><a class=\"btn btn-secondary\" href=\"#map-section\">Explore charging map</a></div><div class=\"hero-assurance\"><span>✓</span> No account needed <i></i> Public station data <i></i> Range-aware planning</div></div>\n      <div class=\"hero-visual\"><div class=\"hero-map-shell\"><div id=\"hero-map\" aria-label=\"Preview map of EV charging locations around Bengaluru\"></div><div class=\"hero-map-label label-north\">INDIRANAGAR</div><div class=\"hero-map-label label-east\">WHITEFIELD</div><div class=\"hero-map-label label-south\">JAYANAGAR</div><div class=\"hero-map-tag\"><span></span> Public charging locations</div></div><div class=\"hero-map-caption\"><div class=\"caption-symbol\"><svg viewBox=\"0 0 24 24\"><path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/></svg></div><div><b>Your city, ready to charge</b><small>Explore mapped chargers around Bengaluru</small></div><a href=\"#map-section\">VIEW MAP <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></a></div></div>\n    </section>\n    <section class=\"metrics\" aria-label=\"ChargeWise overview metrics\">\n      <article class=\"metric\"><span class=\"metric-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/></svg></span><div><small>Mapped charging locations</small><strong id=\"station-count\">—</strong><span id=\"station-meta\">Loading public map data…</span></div></article>\n      <article class=\"metric\"><span class=\"metric-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M13 2 4 14h7l-1 8 10-12h-7l1-8Z\"/></svg></span><div><small>Tagged networks</small><strong id=\"network-count\">—</strong><span>Operator or brand tags found</span></div></article>\n      <article class=\"metric\"><span class=\"metric-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M20 7v5h-5M4 17v-5h5\"/><path d=\"M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3\"/></svg></span><div><small>Fast / DC tagged</small><strong id=\"fast-count\">—</strong><span>Based on available public tags</span></div></article>\n      <article class=\"metric\"><span class=\"metric-icon research-icon\">◎</span><div><small>Research zones</small><strong>9</strong><span>Bengaluru RTO zones in the CSTEP study</span></div></article>\n    </section>\n    <section class=\"feature-section\"><div class=\"section-heading\"><span class=\"eyebrow\">BUILT FOR YOUR NEXT RIDE</span><h2>Everything you need before the ride.</h2><p>From finding a nearby plug to planning a long-distance journey.</p></div>\n      <div class=\"feature-grid\">\n        <a class=\"feature-card feature-map\" href=\"#map-section\"><span class=\"feature-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/></svg></span><h3>Explore the charging map</h3><p>Search by area, network, connector and charging type. Open a station to see what is known — and what still needs verifying.</p><b>DISCOVER STATIONS <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></b></a>\n        <a class=\"feature-card feature-trip\" href=\"#trip-planner\"><span class=\"feature-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></span><h3>Plan a smarter journey</h3><p>Choose your EV, enter your battery level and get a route with suggested charging breaks.</p><b>BUILD A TRIP PLAN <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></b></a>\n        <a class=\"feature-card feature-range\" href=\"#range-guard\"><span class=\"feature-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M13 2 4 14h7l-1 8 10-12h-7l1-8Z\"/></svg></span><h3>Know your range</h3><p>See a conservative estimate based on your vehicle profile, battery and riding conditions.</p><b>CHECK YOUR RANGE <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></b></a>\n      </div>\n    </section>\n    <section class=\"research-banner\"><div><span class=\"eyebrow\">BUILT ON OPEN DATA + LOCAL RESEARCH</span><h2>Better infrastructure starts with better information.</h2><p>Separate mapped stations from future candidate locations, with transparent sources.</p></div><a class=\"btn btn-secondary\" href=\"#insights\">Read the research <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></a></section>\n    <section class=\"map-section\" id=\"map-section\">\n      <div class=\"section-heading map-section-heading\"><div><span class=\"eyebrow\">CHARGING NETWORK / BENGALURU</span><h2>Find your next charge.</h2><p>Explore public charging locations and compare station information across the city.</p></div><div class=\"feed-status\"><i></i><span id=\"feed-status\">Connecting to public map data…</span></div></div>\n      <div class=\"map-filterbar\">\n        <label class=\"map-search\"><svg viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m20 20-4-4\"/></svg><span class=\"sr-only\">Search stations</span><input id=\"search\" type=\"search\" placeholder=\"Search area, station, operator or landmark…\"></label>\n        <button class=\"filter-chip active\" type=\"button\" data-filter=\"all\">All stations</button><button class=\"filter-chip\" type=\"button\" data-filter=\"fast\">Fast DC</button><button class=\"filter-chip\" type=\"button\" data-filter=\"ac\">AC charging</button><button class=\"filter-chip\" type=\"button\" data-filter=\"other\">Other / unspecified</button>\n        <select id=\"operator-filter\" aria-label=\"Filter by network\"><option value=\"all\">All networks</option></select>\n        <select id=\"charger-filter\" aria-label=\"Filter by charger type\" class=\"sr-only-select\"><option value=\"all\">All types</option><option value=\"fast\">Fast DC</option><option value=\"ac\">AC charging</option><option value=\"other\">Other / unspecified</option></select>\n      </div>\n      <div class=\"map-layout\">\n        <div class=\"map-main-column\"><div class=\"map-card\">\n          <div class=\"map-toolbar\"><div class=\"map-title\"><span class=\"map-title-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/></svg></span><div><b>Charging station explorer</b><small id=\"map-caption\">Bengaluru city study area</small></div></div>\n            <div class=\"map-toolbar-actions\"><button id=\"coverage-toggle\" class=\"utility-button\" type=\"button\">Coverage scan</button><div class=\"map-switch\"><button id=\"map-osm\" class=\"active\" type=\"button\">OpenStreetMap</button><button id=\"map-ocm\" type=\"button\">Open Charge Map</button></div><button id=\"refresh\" class=\"icon-button\" aria-label=\"Refresh map\"><svg viewBox=\"0 0 24 24\"><path d=\"M20 7v5h-5M4 17v-5h5\"/><path d=\"M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3\"/></svg></button></div>\n          </div>\n          <div id=\"map\" aria-label=\"Interactive charging station map of Bengaluru\"></div>\n          <iframe id=\"ocm-frame\" title=\"Open Charge Map Bengaluru charging locations\" loading=\"lazy\" referrerpolicy=\"strict-origin-when-cross-origin\" src=\"https://map.openchargemap.io/?mode=embedded&latitude=12.9716&longitude=77.5946\"></iframe>\n          <div class=\"legend\"><span><i class=\"teal-dot\"></i> Public charging</span><span><i class=\"amber-dot\"></i> Fast / DC tagged</span><span><i class=\"outline-dot\"></i> Research reference</span><small>© OpenStreetMap contributors</small></div>\n        </div><div class=\"map-footnote\">Public map records can be incomplete or out of date. A map pin does not confirm current uptime, price, access or compatibility.</div></div>\n        <aside class=\"map-aside\">\n          <section class=\"station-list-card\"><div class=\"panel-heading\"><div><span class=\"eyebrow\">EXPLORE THE NETWORK</span><h3>Nearby stations</h3></div><span class=\"result-count\" id=\"result-count\">— listings</span></div><div id=\"station-results\" class=\"station-results\"><div class=\"station-empty\">Loading mapped stations…</div></div></section>\n          <section class=\"station-detail-card\"><div class=\"panel-heading\"><div><span class=\"eyebrow\">STATION DETAILS</span><h3>Station information</h3></div></div><div id=\"station-detail\" class=\"empty\"><b>Choose a charging location</b><p>Available name, operator, connector, power and access details appear here.</p></div></section>\n          <section class=\"research-card\"><span class=\"eyebrow\">RESEARCH SPOTLIGHT · CSTEP 2024</span><strong>64 <small>candidate locations</small></strong><h3>South RTO zone</h3><p>CSTEP identified 64 potential charging locations in the South RTO zone. This is a future planning estimate, not a count of installed chargers.</p><a href=\"https://cstep.in/wp-content/uploads/2025/06/Bengaluru-2030_EV-charging-demand-and-infrastructure.pdf\" target=\"_blank\" rel=\"noreferrer\">Read the CSTEP study <svg viewBox=\"0 0 24 24\"><path d=\"M14 3h7v7m-1-6-9 9\"/><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"/></svg></a></section>\n        </aside>\n      </div>\n    </section>\n    <section class=\"range-guard\" id=\"range-guard\"><div class=\"range-intro\"><span class=\"eyebrow\">QUICK RANGE CHECK</span><h2>Will you make<br>the next charge?</h2><p>Estimate usable battery range and locate the nearest mapped station. Your location is requested only when you press the button.</p></div><div class=\"range-panel\"><div class=\"range-panel-head\"><b>TRIP PARAMETERS</b><span>RANGE ESTIMATOR</span></div><div class=\"range-inputs\"><label>VEHICLE RANGE / KM<input id=\"vehicle-range\" type=\"number\" min=\"20\" max=\"600\" value=\"120\"></label><label>BATTERY / %<input id=\"battery-level\" type=\"number\" min=\"1\" max=\"100\" value=\"55\"></label><label>SAFETY RESERVE / %<input id=\"reserve-level\" type=\"number\" min=\"5\" max=\"50\" value=\"20\"></label></div><button class=\"btn btn-primary range-check-button\" id=\"range-check\">Locate me & check range <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></button><div id=\"range-result\" class=\"range-result\"><b>Ready when you are.</b><small>Straight-line distance is a lower bound. Road distance will be longer.</small></div></div></section>\n    <section class=\"insights\" id=\"insights\"><div class=\"section-heading\"><div><span class=\"eyebrow\">RESEARCH LAYER · 2024</span><h2>Where could the next charger go?</h2><p>Potential future public-charging locations assessed by CSTEP across nine RTO zones.</p></div></div><div class=\"insight-grid\"><div class=\"chart-card\"><div class=\"chart-title\"><b>Candidate locations by RTO zone</b><small>Research-identified potential sites, not existing stations</small></div><div id=\"zone-chart\"></div><small class=\"chart-note\">The report identifies approximately 400 potential locations citywide. Counts below are separate from the live station map.</small></div><div class=\"insight-copy\"><span class=\"eyebrow\">01 / THE PLANNING QUESTION</span><h3>A map tells us where chargers are. <em>Research helps us ask where they are needed.</em></h3><p>ChargeWise keeps current mapped locations separate from demand estimates and proposed candidate zones, so evidence is not confused with prediction.</p><a class=\"btn btn-primary\" href=\"https://cstep.in/wp-content/uploads/2025/06/Bengaluru-2030_EV-charging-demand-and-infrastructure.pdf\" target=\"_blank\" rel=\"noreferrer\">Explore the report <svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14m-6-6 6 6-6 6\"/></svg></a></div></div></section>\n    <section class=\"method-section\" id=\"method\"><span class=\"eyebrow\">THE CHARGEWISE PIPELINE</span><h2>From open data to <em>better decisions.</em></h2><p>A transparent workflow designed for reproducible, city-level infrastructure analysis.</p><div class=\"pipeline\"><div><b>01</b><strong>Collect</strong><small>Stations, EV registrations, population, POIs and road network.</small></div><i>→</i><div><b>02</b><strong>Clean</strong><small>Deduplicate records, validate coordinates and standardise tags.</small></div><i>→</i><div><b>03</b><strong>Analyse</strong><small>Distribution, proximity and potential coverage gaps.</small></div><i>→</i><div><b>04</b><strong>Prioritise</strong><small>Demand, coverage gap and site suitability.</small></div><i>→</i><div><b>05</b><strong>Visualise</strong><small>Maps, evidence and candidate zones with caveats.</small></div></div><div class=\"formula\"><span>PROPOSED PRIORITY SCORE</span><b>40% Demand</b><i>+</i><b>35% Coverage gap</b><i>+</i><b>25% Site suitability</b><small>Initial weights only. Sensitivity testing and local validation are required.</small></div></section>\n    <section class=\"sources-section\" id=\"sources\"><div class=\"section-heading\"><div><span class=\"eyebrow\">OPEN DATA, CLEAR PROVENANCE</span><h2>Know your sources.</h2><p>Different datasets have different coverage rules. We keep them separate instead of adding incompatible totals together.</p></div></div><div id=\"source-list\" class=\"source-list\"></div><div class=\"caveat\"><b>Data quality matters.</b> OpenStreetMap is community maintained and may omit, duplicate or contain outdated station records. Mapped locations do not guarantee that a charger is working, publicly accessible or available now. Verify details with the operator before travel.</div></section>\n  </main>\n  <footer><a class=\"brand\" href=\"#top\"><span class=\"brand-icon\"><svg viewBox=\"0 0 24 24\"><path d=\"M13 2 4 14h7l-1 8 10-12h-7l1-8Z\"/></svg></span><span>chargewise<span class=\"period\">.</span></span></a><small>Charging intelligence for everyday electric journeys.</small><div><a href=\"#map-section\">Charging map</a><a href=\"#trip-planner\">Trip planner</a><a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noreferrer\">OpenStreetMap attribution</a></div></footer>\n  <div id=\"toast\" class=\"toast\" role=\"status\" aria-live=\"polite\"></div>\n</div>";
$('#app').innerHTML = html;

const maxZone = Math.max(...cstepZones.map((x) => x.count));
$("#zone-chart").innerHTML = cstepZones.map((x) =>
  '<div class="zone-row ' + (x.highlight ? "highlight" : "") + '"><div><span>' + x.zone + '</span><b>' + x.count + '</b></div><i><span style="width:' + (x.count / maxZone * 100) + '%"></span></i>' + (x.highlight ? "<small>South RTO</small>" : "") + "</div>"
).join("");
$("#source-list").innerHTML = sources.map((x, i) =>
  '<a class="source-row" href="' + x.url + '" target="_blank" rel="noreferrer"><span>' + String(i + 1).padStart(2, "0") + '</span><div><b>' + x.name + '</b><small>' + x.category + '</small><p>' + x.description + '</p></div>' + svg.external + "</a>"
).join("");

const map = L.map("map", { zoomControl: false, preferCanvas: true }).setView([12.9716, 77.5946], 11);
const heroMap = L.map("hero-map", { zoomControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, boxZoom:false, keyboard:false, tap:false }).setView([12.9716,77.5946],11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(heroMap);
const heroMarkers = L.layerGroup().addTo(heroMap);
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
const markers = L.layerGroup().addTo(map);
const coverageLayer = L.layerGroup().addTo(map);
let coverageEnabled = false;
L.circle([12.895, 77.60], { radius: 2200, color: "#be655a", weight: 2, dashArray: "6 7", fillColor: "#df927e", fillOpacity: .09 }).addTo(map).bindTooltip("South RTO research reference · not a verified coverage gap");

let stations = [], boundary = null, selectedStation = null;
const esc = (v) => String(v || "Not tagged").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
function haversine(lat1, lon1, lat2, lon2) {
  const rad = (v) => v * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function insideRing(point, ring) {
  let inside = false; const x = point[1], y = point[0];
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1];
    if (((yi>y)!==(yj>y)) && x < (xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi) inside=!inside;
  }
  return inside;
}
function inCity(s) {
  if (!boundary) return s.lat>=bengaluruBounds.south && s.lat<=bengaluruBounds.north && s.lon>=bengaluruBounds.west && s.lon<=bengaluruBounds.east;
  const g=boundary.geometry, p=[s.lat,s.lon];
  if (g.type==="Polygon") return insideRing(p,g.coordinates[0]);
  if (g.type==="MultiPolygon") return g.coordinates.some((x)=>insideRing(p,x[0]));
  return true;
}
async function getBoundary() {
  try {
    const q=encodeURIComponent("Bruhat Bengaluru Mahanagara Palike, Bengaluru, Karnataka, India");
    const r=await fetch("https://nominatim.openstreetmap.org/search?q="+q+"&format=geojson&polygon_geojson=1&limit=1");
    if(!r.ok) return;
    const d=await r.json();
    if(d.features && d.features[0] && /Polygon/.test(d.features[0].geometry.type)) {
      boundary=d.features[0];
      const outline=L.geoJSON(boundary,{style:{color:"#668d81",weight:2,dashArray:"5 6",fillColor:"#9fc2ad",fillOpacity:.04}}).addTo(map);
      map.fitBounds(outline.getBounds(),{padding:[12,12]});
      $("#map-caption").textContent="BBMP boundary · public OSM charging features";
    }
  } catch(e) { console.info("BBMP outline lookup unavailable; using study bounding box.",e); }
}
const bbox=[bengaluruBounds.south,bengaluruBounds.west,bengaluruBounds.north,bengaluruBounds.east].join(",");
const query='[out:json][timeout:40];(node["amenity"="charging_station"]('+bbox+');way["amenity"="charging_station"]('+bbox+');relation["amenity"="charging_station"]('+bbox+'););out center tags;';
async function fetchStations() {
  const endpoints=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
  let last;
  for(const endpoint of endpoints) {
    try {
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:"data="+encodeURIComponent(query)});
      if(!r.ok) throw new Error("Overpass HTTP "+r.status);
      const d=await r.json(); return d.elements || [];
    } catch(e) { last=e; }
  }
  throw last || new Error("Public Overpass endpoints unavailable");
}
function parseStation(el) {
  const t=el.tags||{}, p=el.center||el;
  const v=(...keys)=>{for(const k of keys) if(t[k]) return t[k]; return "";};
  const power=v("capacity","socket:output","charging_station:output","maxpower","max power");
  const match=String(power).match(/[0-9]+(?:\.[0-9]+)?/), watts=match?Number(match[0]):0;
  return {
    id:el.type+"/"+el.id,lat:Number(p.lat),lon:Number(p.lon),
    name:v("name","brand","operator")||"Unnamed charging station",
    operator:v("operator","brand","network")||"Not tagged",
    tags:t,
    address:[v("addr:housenumber"),v("addr:street"),v("addr:suburb"),v("addr:city")].filter(Boolean).join(", "),
    power:power||"Not listed", connector:v("socket:type2","socket:ccs","socket:chademo","socket:type1")||"Not listed",
    access:v("access")||"Not specified", opening:v("opening_hours")||"Not listed",
    fast:/dc|ccs|chademo/i.test(JSON.stringify(t))||watts>=22,
    url:"https://www.openstreetmap.org/"+el.type+"/"+el.id
  };
}
function showStation(s) {
  selectedStation = s;
  $("#station-detail").className = "station-content";
  $("#station-detail").innerHTML =
    '<div class="selected-station-top"><span class="station-type-icon">'+svg.bolt+'</span><div><h4>'+esc(s.name)+'</h4><small>'+esc(s.operator)+'</small></div></div>' +
    '<dl><div><dt>Address</dt><dd>'+esc(s.address)+'</dd></div><div><dt>Power</dt><dd>'+esc(s.power)+'</dd></div><div><dt>Connector</dt><dd>'+esc(s.connector)+'</dd></div><div><dt>Access</dt><dd>'+esc(s.access)+'</dd></div><div><dt>Opening hours</dt><dd>'+esc(s.opening)+'</dd></div></dl>' +
    '<div class="metadata-meter"><div><span>TAG COMPLETENESS</span><b>'+completenessScore(s)+'%</b></div><i><span style="width:'+completenessScore(s)+'%"></span></i><small>Metadata completeness only. Not an uptime or reliability rating.</small></div>' +
    '<div class="station-actions"><a class="btn btn-primary" href="https://www.google.com/maps/dir/?api=1&destination='+s.lat+','+s.lon+'" target="_blank" rel="noreferrer">Get directions '+svg.arrow+'</a><a class="text-link" href="'+s.url+'" target="_blank" rel="noreferrer">Open OSM record '+svg.external+'</a></div>';
}
function stationMatchesKind(station, kind) {
  if (kind === "fast") return station.fast;
  if (kind === "ac") return /type.?2|type.?1|ac/i.test(String(station.connector)+" "+JSON.stringify(station.tags || {}));
  if (kind === "other") return !station.fast && station.connector === "Not listed";
  return true;
}
function update() {
  const term=$("#search").value.trim().toLowerCase(), op=$("#operator-filter").value, kind=$("#charger-filter").value;
  const list=stations.filter((s)=>{
    const hay=[s.name,s.operator,s.address].join(" ").toLowerCase();
    return (!term||hay.includes(term))&&(op==="all"||op===s.operator)&&stationMatchesKind(s,kind);
  });
  markers.clearLayers();
  list.forEach((s)=>{
    L.circleMarker([s.lat,s.lon],{radius:selectedStation?.id===s.id?9:6,color:"#fff",weight:2,fillColor:s.fast?"#d68d40":"#138c86",fillOpacity:.96})
      .addTo(markers).bindTooltip(esc(s.name),{direction:"top"}).on("click",()=>showStation(s));
  });
  const center=map.getCenter();
  const nearest=[...list].sort((a,b)=>haversine(center.lat,center.lng,a.lat,a.lon)-haversine(center.lat,center.lng,b.lat,b.lon)).slice(0,8);
  $("#result-count").textContent=list.length.toLocaleString("en-IN")+" listings";
  $("#station-results").innerHTML=nearest.length?nearest.map((s)=>
    '<button class="station-result '+(selectedStation?.id===s.id?"selected":"")+'" type="button" data-station="'+esc(s.id)+'"><span class="station-result-icon">'+svg.bolt+'</span><span class="station-result-copy"><b>'+esc(s.name)+'</b><small>'+esc(s.operator)+' · '+esc(s.power)+'</small><em>'+(s.fast?"Fast / DC tagged":"Public charging")+' · '+(s.connector==="Not listed"?"Connector not listed":esc(s.connector))+'</em></span><span class="station-result-arrow">↗</span></button>'
  ).join(""):'<div class="station-empty">No stations match these filters. Try a wider search.</div>';
  $("#station-results").querySelectorAll("[data-station]").forEach((button)=>{
    button.addEventListener("click",()=>{
      const station=list.find((entry)=>entry.id===button.dataset.station);
      if(!station)return;
      showStation(station); map.setView([station.lat,station.lon],15,{animate:true}); update();
    });
  });
  $("#map-caption").textContent=list.length.toLocaleString("en-IN")+" of "+stations.length.toLocaleString("en-IN")+" mapped locations";
  heroMarkers.clearLayers();
  list.slice(0,28).forEach((s)=>L.circleMarker([s.lat,s.lon],{radius:3,color:"#fff",weight:1,fillColor:"#138c86",fillOpacity:.9}).addTo(heroMarkers));
}
async function load() {
  $("#feed-status").textContent="Loading public OpenStreetMap features…"; $("#station-count").textContent="…";
  try {
    const raw=await fetchStations();
    stations=raw.map(parseStation).filter((s)=>Number.isFinite(s.lat)&&Number.isFinite(s.lon)&&inCity(s))
      .filter((s,i,a)=>a.findIndex((x)=>x.lat===s.lat&&x.lon===s.lon)===i);
    const networks=new Set(stations.map((s)=>s.operator).filter((x)=>x!=="Not tagged"));
    $("#station-count").textContent=stations.length.toLocaleString("en-IN");
    $("#network-count").textContent=networks.size.toLocaleString("en-IN");
    $("#fast-count").textContent=stations.filter((s)=>s.fast).length.toLocaleString("en-IN");
    $("#station-meta").textContent="OSM features returned · "+new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
    $("#feed-status").textContent="OpenStreetMap query completed · "+stations.length+" features";
    $("#operator-filter").innerHTML='<option value="all">All operators</option>'+[...networks].sort().map((x)=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
    update();
    window.dispatchEvent(new Event("chargewise:stations-updated"));
    if(coverageEnabled) drawCoverageScan();
    if(!stations.length) { $("#station-results").innerHTML="<div class=\"station-empty\">No public stations returned. OSM coverage may be incomplete.</div>"; $("#station-detail").innerHTML="<b>No charging features returned.</b><p>Try an independent station directory below.</p>"; }
  } catch(e) {
    console.error(e); $("#station-count").textContent="—"; $("#network-count").textContent="—"; $("#fast-count").textContent="—";
    $("#station-meta").textContent="Map service unavailable. No sample locations have been fabricated.";
    $("#feed-status").textContent="Live station query unavailable";
    $("#station-results").innerHTML="<div class=\"station-empty\">Map records are temporarily unavailable. Try refresh or use PlugMap.</div>"; $("#station-detail").innerHTML='<b>Could not load map records.</b><p>Overpass may be busy or rate-limited. Please refresh later.</p><a href="https://plugmap.in/ev-charging-stations/bengaluru.html" target="_blank" rel="noreferrer">Open PlugMap directory '+svg.external+'</a>';
  }
}
$("#search").addEventListener("input",update);
$("#operator-filter").addEventListener("change",update);
$("#charger-filter").addEventListener("change",()=>{
  document.querySelectorAll("[data-filter]").forEach((button)=>button.classList.toggle("active",button.dataset.filter===$("#charger-filter").value));
  update();
});
document.querySelectorAll("[data-filter]").forEach((button)=>button.addEventListener("click",()=>{
  $("#charger-filter").value=button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((item)=>item.classList.toggle("active",item===button));
  update();
}));
$("#map-osm").addEventListener("click",()=>{ $("#map").classList.remove("hidden"); $("#ocm-frame").classList.remove("active"); $("#map-osm").classList.add("active"); $("#map-ocm").classList.remove("active"); map.invalidateSize(); });
$("#map-ocm").addEventListener("click",()=>{ $("#map").classList.add("hidden"); $("#ocm-frame").classList.add("active"); $("#map-ocm").classList.add("active"); $("#map-osm").classList.remove("active"); });
$("#refresh").addEventListener("click",async()=>{ $("#refresh").classList.add("spinning"); await load(); $("#refresh").classList.remove("spinning"); });

function completenessScore(s) {
  const checks = [s.name !== "Unnamed charging station", s.operator !== "Not tagged",
    Boolean(s.address), s.power !== "Not listed", s.connector !== "Not listed",
    s.access !== "Not specified", s.opening !== "Not listed"];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}
function notify(message, kind = "info") {
  const el = $("#toast");
  el.textContent = message;
  el.dataset.kind = kind;
  el.classList.add("visible");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => el.classList.remove("visible"), 4200);
}
function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.showModal) dialog.showModal();
  else dialog?.setAttribute("open", "");
}
document.querySelectorAll("[data-close]").forEach((button) =>
  button.addEventListener("click", () => document.getElementById(button.dataset.close)?.close())
);

function drawCoverageScan() {
  coverageLayer.clearLayers();
  if (!stations.length) return;
  for (let lat = 12.835; lat <= 13.12; lat += 0.045) {
    for (let lon = 77.46; lon <= 77.78; lon += 0.045) {
      if (!inCity({lat, lon})) continue;
      let nearest = Infinity;
      stations.forEach((station) => { nearest = Math.min(nearest, haversine(lat, lon, station.lat, station.lon)); });
      if (nearest > 2.7) {
        L.circle([lat, lon], { radius: 650, color: "#ff4e3d", weight: 1.2, dashArray: "5 5", fillColor: "#ff4e3d", fillOpacity: .15 })
          .addTo(coverageLayer)
          .bindTooltip("Nearest mapped OSM station approx. " + nearest.toFixed(1) + " km away. Map-coverage prompt only, not a measured demand gap.");
      }
    }
  }
}
$("#coverage-toggle").addEventListener("click", () => {
  coverageEnabled = !coverageEnabled;
  if (coverageEnabled) drawCoverageScan(); else coverageLayer.clearLayers();
  $("#coverage-toggle").textContent = coverageEnabled ? "HIDE GAP SCAN" : "GAP SCAN";
  notify("Gap scan is based only on mapped OSM points and straight-line distance.");
});

// Range Guard requests location only after an explicit user action.
$("#range-check").addEventListener("click", () => {
  if (!navigator.geolocation) { notify("Location is unavailable in this browser.", "error"); return; }
  if (!stations.length) { notify("Wait for the station map to load.", "error"); return; }
  $("#range-result").innerHTML = "<b>CHECKING LOCATION…</b><small>This calculation runs in your browser.</small>";
  navigator.geolocation.getCurrentPosition((position) => {
    const range = Number($("#vehicle-range").value);
    const battery = Number($("#battery-level").value);
    const reserve = Number($("#reserve-level").value);
    if (!(range > 0 && battery > 0 && battery <= 100 && reserve >= 0 && reserve < 80)) {
      notify("Check the range, battery and reserve values.", "error"); return;
    }
    const lat = position.coords.latitude, lon = position.coords.longitude;
    const nearest = stations.map((station) => ({station, km: haversine(lat, lon, station.lat, station.lon)})).sort((a,b)=>a.km-b.km)[0];
    const usable = range * battery / 100 * (1 - reserve / 100);
    const safe = nearest.km <= usable;
    $("#range-result").innerHTML = '<span class="range-outcome '+(safe?"good":"bad")+'">'+(safe?"WITHIN ESTIMATED RANGE":"RANGE BUFFER NEEDED")+'</span>'+
      '<b>'+nearest.km.toFixed(1)+' KM <small>STRAIGHT-LINE TO NEAREST MAPPED STATION</small></b><p>'+esc(nearest.station.name)+' · '+esc(nearest.station.operator)+'</p>'+
      '<small>Estimated usable range after reserve: '+usable.toFixed(1)+' km. Road distance will be longer; charger availability is not verified.</small>'+
      '<a href="https://www.google.com/maps/dir/?api=1&origin='+lat+','+lon+'&destination='+nearest.station.lat+','+nearest.station.lon+'&travelmode=driving" target="_blank" rel="noreferrer">OPEN DRIVING DIRECTIONS ↗</a>';
    L.circleMarker([lat,lon],{radius:9,color:"#f8f4e9",weight:2,fillColor:"#ff4e3d",fillOpacity:1}).addTo(map).bindTooltip("Your device location").openTooltip();
    map.setView([lat,lon],12);
  }, (error) => {
    notify(error.code===1?"Location permission was denied.":"Could not obtain your location.", "error");
    $("#range-result").innerHTML = "<b>LOCATION NOT AVAILABLE</b><small>Allow browser location access and try again.</small>";
  }, {enableHighAccuracy:true,timeout:12000,maximumAge:60000});
});

window.chargeWiseApp = {
  get map() { return map; },
  get stations() { return stations; },
  notify,
  haversine
};
import("./trip-planner.js").catch((error) => console.error("Could not load the trip planner:", error));

void (async () => { await getBoundary(); await load(); setTimeout(()=>{map.invalidateSize();heroMap.invalidateSize();},250); })();
$("#mobile-menu")?.addEventListener("click",()=>$(".topbar nav").classList.toggle("nav-open"));
$(".topbar nav")?.querySelectorAll("a").forEach((link)=>link.addEventListener("click",()=>$(".topbar nav").classList.remove("nav-open")));