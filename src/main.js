import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import { bengaluruBounds, cstepZones, sources } from "./data.js";
import { supabase, backendConfigured, getCurrentUser, sendMagicLink, saveStation, listSavedStations, listMyReports, submitStationReport, listAdminReports, reviewReport, syncStationInventory } from "./backend.js";

const $ = (s) => document.querySelector(s);
const svg = {
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 10-12h-7l1-8Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  external: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7m-1-6-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3"/></svg>'
};

const html = [
'<div class="app-shell">',
'<header class="topbar"><a class="brand" href="#top"><span class="brand-icon">', svg.bolt, '</span><span>chargewise<span class="period">.</span></span></a>',
'<nav><a class="active" href="#map-section">Explore map</a><a href="#insights">City insights</a><a href="#method">Methodology</a><a href="#sources">Sources</a></nav><div class="city-chip"><i></i>Bengaluru, India</div><button id="account-button" class="account-button">SIGN IN ↗</button></header>',
'<main id="top">',
'<section class="hero"><div class="hero-copy"><div class="eyebrow">CITY CHARGING INTELLIGENCE</div><h1>Charge ahead.<br><em>See the city differently.</em></h1><p>Explore publicly mapped EV charging locations across Bengaluru, understand where stations are concentrated, and discover research-backed areas for future infrastructure.</p><div class="actions"><a class="btn primary" href="#map-section">Explore the map ',svg.arrow,'</a><a class="btn tonal" href="#insights">View city insights</a></div><div class="subnote"><i></i> Public map data loads when you open the explorer</div></div>',
'<div class="hero-art"><div class="art-orbit"></div><div class="art-orbit small"></div><div class="art-line"></div><div class="art-node n1"></div><div class="art-node n2"></div><div class="art-node n3"></div><div class="art-node n4"></div><div class="art-copy"><small>ONE CITY</small><b>Many routes<br>to a cleaner drive.</b><span>12.9716° N&nbsp;&nbsp; 77.5946° E</span></div></div></section>',
'<section class="metrics"><article class="metric featured"><small>Mapped charging locations</small><strong id="station-count">—</strong><span id="station-meta">Loading OpenStreetMap data…</span></article><article class="metric"><small>Tagged networks</small><strong id="network-count">—</strong><span>Operator or brand tags found</span></article><article class="metric"><small>Fast / DC tagged</small><strong id="fast-count">—</strong><span>Where connector or power tags allow classification</span></article><article class="metric research-metric"><small>Research zones</small><strong>9</strong><span>Bengaluru RTO zones in the CSTEP study</span></article></section>',
'<section class="section-head" id="map-section"><div><div class="eyebrow">INTERACTIVE CITY MAP</div><h2>Every pin has a story.</h2><p>Public charging stations currently mapped in OpenStreetMap within the Bengaluru study boundary.</p></div><div class="feed-status"><i></i><span id="feed-status">Connecting to public map data…</span></div></section>',
'<section class="map-layout"><div class="map-card"><div class="map-toolbar"><div class="map-title"><span>',svg.pin,'</span><div><b>Charging station explorer</b><small id="map-caption">Bengaluru city study area</small></div></div><label class="search">',svg.search,'<input id="search" type="search" placeholder="Search station, operator or area…"></label><select id="operator-filter"><option value="all">All operators</option></select><select id="charger-filter"><option value="all">All types</option><option value="fast">Fast / DC tagged</option><option value="other">Other / unspecified</option></select><button id="coverage-toggle" class="coverage-toggle" type="button">GAP SCAN</button><div class="map-switch"><button id="map-osm" class="active" type="button">OSM</button><button id="map-ocm" type="button">Open Charge Map</button></div><button id="refresh" class="refresh" aria-label="Refresh map">',svg.refresh,'</button></div><div id="map"></div><iframe id="ocm-frame" title="Open Charge Map Bengaluru charging locations" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" src="https://map.openchargemap.io/?mode=embedded&latitude=12.9716&longitude=77.5946"></iframe><div class="legend"><span><i class="teal-dot"></i> OSM charging location</span><span><i class="coral-dot"></i> South RTO research reference</span><small>© OpenStreetMap contributors</small></div></div>',
'<aside class="map-aside"><div class="detail-card"><div class="card-label">STATION INFORMATION <span>SELECT A PIN</span></div><div id="station-detail" class="empty"><b>Choose a charging location</b><p>Available name, operator, connector, power and access tags will appear here.</p></div></div><div class="research-card"><div class="card-label">RESEARCH SPOTLIGHT <span>CSTEP · 2024</span></div><strong>64 <small>candidate locations</small></strong><h3>South RTO zone</h3><p>CSTEP identified 64 potential charging locations in the South RTO zone. This is a future planning estimate, not a count of installed chargers or a verified coverage gap.</p><a href="https://cstep.in/wp-content/uploads/2025/06/Bengaluru-2030_EV-charging-demand-and-infrastructure.pdf" target="_blank" rel="noreferrer">Read the CSTEP study ',svg.external,'</a></div></aside></section>',
'<section class="range-guard" id="range-guard"><div class="range-intro"><span class="section-no">02 / RANGE GUARD</span><h2>WILL YOU<br>MAKE THE<br>NEXT CHARGE?</h2><p>Estimate usable battery range and locate the nearest mapped station. Location is requested only after you press the button.</p></div><div class="range-panel"><div class="range-panel-head"><b>TRIP PARAMETERS</b><span>RANGE ESTIMATOR / BETA</span></div><div class="range-inputs"><label>VEHICLE RANGE / KM<input id="vehicle-range" type="number" min="20" max="600" value="120"></label><label>BATTERY / %<input id="battery-level" type="number" min="1" max="100" value="55"></label><label>SAFETY RESERVE / %<input id="reserve-level" type="number" min="5" max="50" value="20"></label></div><button class="brutal-button" id="range-check">LOCATE ME & CHECK RANGE ↗</button><div id="range-result" class="range-result"><b>READY WHEN YOU ARE.</b><small>Straight-line distance is a lower bound. Road distance will be longer.</small></div></div></section><section class="community" id="community"><div><span class="section-no">03 / COMMUNITY INTELLIGENCE</span><h2>YOU KNOW<br>THE STREETS.</h2><p>Flag a closed charger, incorrect connector, access issue or suggest a missing public location.</p><button id="community-report" class="brutal-button">SUBMIT A FIELD REPORT ↗</button></div><div class="community-board"><div class="board-head"><b>YOUR CONTRIBUTIONS</b><span id="community-state">BACKEND / CHECKING</span></div><div id="my-reports"><p>Sign in to track your reports.</p></div><div class="board-head saved-head"><b>YOUR SAVED CHARGERS</b><span>PERSONAL LIST</span></div><div id="saved-list"><p>Sign in to save charging locations.</p></div></div></section><section class="admin-panel" id="admin-panel" hidden><div class="admin-head"><span class="section-no">ADMIN CONSOLE</span><h2>FIELD OPS.</h2><button id="sync-stations" class="brutal-button lime-button">SYNC OSM INVENTORY ↻</button></div><div id="admin-reports"></div></section><section class="insights" id="insights"><div class="section-head"><div><div class="eyebrow">RESEARCH LAYER · 2024</div><h2>Where could the next charger go?</h2><p>Potential future public-charging locations assessed by CSTEP across nine RTO zones.</p></div></div><div class="insight-grid"><div class="chart-card"><div class="chart-title"><b>Candidate locations by RTO zone</b><small>Research-identified potential sites, not existing stations</small></div><div id="zone-chart"></div><small class="chart-note">The report identifies approximately 400 potential locations citywide. Counts below are separate from the live station map.</small></div><div class="insight-copy"><small>01 / THE PLANNING QUESTION</small><h3>A map tells us where chargers are. <em>Research helps us ask where they are needed.</em></h3><p>ChargeWise keeps current mapped locations separate from demand estimates and proposed candidate zones, so evidence is not confused with prediction.</p><a class="btn dark" href="https://cstep.in/wp-content/uploads/2025/06/Bengaluru-2030_EV-charging-demand-and-infrastructure.pdf" target="_blank" rel="noreferrer">Explore the report ',svg.arrow,'</a></div></div></section>',
'<section class="method" id="method"><div class="eyebrow">THE CHARGEWISE PIPELINE</div><h2>From open data to <em>better decisions.</em></h2><p>A transparent workflow designed for reproducible, city-level infrastructure analysis.</p><div class="pipeline">',
'<div><b>01</b><strong>Collect</strong><small>Stations, EV registrations, population, POIs and road network.</small></div><i>→</i><div><b>02</b><strong>Clean</strong><small>Deduplicate records, validate coordinates and standardise tags.</small></div><i>→</i><div><b>03</b><strong>Analyse</strong><small>Distribution, proximity and potential coverage gaps.</small></div><i>→</i><div><b>04</b><strong>Prioritise</strong><small>Demand, coverage gap and site suitability.</small></div><i>→</i><div><b>05</b><strong>Visualise</strong><small>Maps, evidence and candidate zones with caveats.</small></div></div>',
'<div class="formula"><span>PROPOSED PRIORITY SCORE</span><b>40% Demand</b><i>+</i><b>35% Coverage gap</b><i>+</i><b>25% Site suitability</b><small>Initial weights only. Sensitivity testing and local validation are required.</small></div></section>',
'<section class="sources" id="sources"><div class="section-head"><div><div class="eyebrow">OPEN DATA, CLEAR PROVENANCE</div><h2>Know your sources.</h2><p>Different datasets have different coverage rules. We keep them separate instead of adding incompatible totals together.</p></div></div><div id="source-list" class="source-list"></div><div class="caveat"><b>Data quality matters.</b> OpenStreetMap is community maintained and may omit, duplicate or contain outdated station records. Mapped locations do not guarantee that a charger is working, publicly accessible or available now. Verify details with the operator before travel.</div></section>',
'</main><dialog id="auth-dialog" class="brutal-dialog"><form id="auth-form"><div class="dialog-top"><b>CHARGEWISE ACCOUNT</b><button type="button" data-close="auth-dialog">×</button></div><h2>GET IN.<br>STAY CHARGED.</h2><p>Sign in by email magic link to save stations and submit field reports.</p><label>EMAIL ADDRESS<input id="auth-email" type="email" required placeholder="you@example.com"></label><button class="brutal-button" type="submit">SEND MAGIC LINK ↗</button><small id="auth-message">No password needed. Your sign-in link opens in this browser.</small></form></dialog><dialog id="report-dialog" class="brutal-dialog"><form id="report-form"><div class="dialog-top"><b>COMMUNITY FIELD REPORT</b><button type="button" data-close="report-dialog">×</button></div><h2>FLAG IT.<br>FIX THE MAP.</h2><label>REPORT TYPE<select id="report-type"><option value="station_closed">Station appears closed</option><option value="wrong_location">Incorrect location</option><option value="connector_incorrect">Connector information wrong</option><option value="power_incorrect">Power information wrong</option><option value="access_issue">Access issue</option><option value="hours_incorrect">Opening hours wrong</option><option value="suggest_new_station">Suggest a missing station</option><option value="other">Other</option></select></label><label>WHAT DID YOU FIND?<textarea id="report-description" minlength="12" maxlength="2000" required placeholder="Describe what needs to be checked…"></textarea></label><button class="brutal-button" type="submit">SUBMIT FOR REVIEW ↗</button><small id="report-message">Reports are private to you and authorised moderators until reviewed.</small></form></dialog><div id="toast" class="brutal-toast" role="status"></div><footer><a class="brand" href="#top"><span class="brand-icon">',svg.bolt,'</span><span>chargewise<span class="period">.</span></span></a><small>Built for clearer EV infrastructure decisions in Bengaluru.</small><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap attribution</a></footer></div>'
].join("");
$("#app").innerHTML = html;

const maxZone = Math.max(...cstepZones.map((x) => x.count));
$("#zone-chart").innerHTML = cstepZones.map((x) =>
  '<div class="zone-row ' + (x.highlight ? "highlight" : "") + '"><div><span>' + x.zone + '</span><b>' + x.count + '</b></div><i><span style="width:' + (x.count / maxZone * 100) + '%"></span></i>' + (x.highlight ? "<small>South RTO</small>" : "") + "</div>"
).join("");
$("#source-list").innerHTML = sources.map((x, i) =>
  '<a class="source-row" href="' + x.url + '" target="_blank" rel="noreferrer"><span>' + String(i + 1).padStart(2, "0") + '</span><div><b>' + x.name + '</b><small>' + x.category + '</small><p>' + x.description + '</p></div>' + svg.external + "</a>"
).join("");

const map = L.map("map", { zoomControl: false, preferCanvas: true }).setView([12.9716, 77.5946], 11);
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
const markers = L.layerGroup().addTo(map);
L.circle([12.895, 77.60], { radius: 2200, color: "#be655a", weight: 2, dashArray: "6 7", fillColor: "#df927e", fillOpacity: .09 }).addTo(map).bindTooltip("South RTO research reference · not a verified coverage gap");

let stations = [], boundary = null, selectedStation = null, currentUser = null, currentProfile = null;
const esc = (v) => String(v || "Not tagged").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
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
    address:[v("addr:housenumber"),v("addr:street"),v("addr:suburb"),v("addr:city")].filter(Boolean).join(", "),
    power:power||"Not listed", connector:v("socket:type2","socket:ccs","socket:chademo","socket:type1")||"Not listed",
    access:v("access")||"Not specified", opening:v("opening_hours")||"Not listed",
    fast:/dc|ccs|chademo/i.test(JSON.stringify(t))||watts>=22,
    url:"https://www.openstreetmap.org/"+el.type+"/"+el.id
  };
}
function showStation(s) {
  selectedStation = s;
  $("#station-detail").className="station-content";
  $("#station-detail").innerHTML='<h3>'+esc(s.name)+'</h3><small class="operator">'+esc(s.operator)+'</small><dl>'+
    '<div><dt>Address</dt><dd>'+esc(s.address)+'</dd></div><div><dt>Power</dt><dd>'+esc(s.power)+'</dd></div>'+
    '<div><dt>Connector</dt><dd>'+esc(s.connector)+'</dd></div><div><dt>Access</dt><dd>'+esc(s.access)+'</dd></div>'+
    '<div><dt>Opening hours</dt><dd>'+esc(s.opening)+'</dd></div></dl>'+
    '<div class="metadata-meter"><div><span>TAG COMPLETENESS</span><b>'+completenessScore(s)+'%</b></div><i><span style="width:'+completenessScore(s)+'%"></span></i><small>Metadata completeness only. Not an uptime or reliability rating.</small></div>'+
    '<div class="detail-actions"><button class="mini-action" id="save-selected">SAVE STATION</button><button class="mini-action" id="report-selected">REPORT ISSUE</button></div>'+
    '<a href="'+s.url+'" target="_blank" rel="noreferrer">Open OSM record '+svg.external+'</a>'+
    '<a href="https://www.google.com/maps/search/?api=1&query='+s.lat+','+s.lon+'" target="_blank" rel="noreferrer">Directions '+svg.arrow+'</a>';
  $("#save-selected")?.addEventListener("click", saveSelectedStation);
  $("#report-selected")?.addEventListener("click", () => openReportDialog(s));
  $("#save-selected").addEventListener("click", saveSelectedStation);
  $("#report-selected").addEventListener("click", () => openReportDialog(s));
}
function update() {
  const term=$("#search").value.trim().toLowerCase(), op=$("#operator-filter").value, kind=$("#charger-filter").value;
  const list=stations.filter((s)=>{
    const hay=[s.name,s.operator,s.address].join(" ").toLowerCase();
    return (!term||hay.includes(term))&&(op==="all"||op===s.operator)&&(kind==="all"||(kind==="fast"?s.fast:!s.fast));
  });
  markers.clearLayers();
  list.forEach((s)=>{
    L.circleMarker([s.lat,s.lon],{radius:7,color:"#fffefa",weight:2,fillColor:s.fast?"#c28a3b":"#397a73",fillOpacity:.96})
      .addTo(markers).bindTooltip(esc(s.name),{direction:"top"}).on("click",()=>showStation(s));
  });
  $("#map-caption").textContent=list.length.toLocaleString("en-IN")+" of "+stations.length.toLocaleString("en-IN")+" mapped locations";
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
    if(coverageEnabled) drawCoverageScan();
    if(!stations.length) $("#station-detail").innerHTML="<b>No charging features returned by this query.</b><p>OSM coverage may be incomplete. Check the independent directories below.</p>";
  } catch(e) {
    console.error(e); $("#station-count").textContent="—"; $("#network-count").textContent="—"; $("#fast-count").textContent="—";
    $("#station-meta").textContent="Map service unavailable. No sample locations have been fabricated.";
    $("#feed-status").textContent="Live station query unavailable";
    $("#station-detail").innerHTML='<b>Could not load map records.</b><p>Overpass may be busy or rate-limited. Please refresh later or use an independent station directory.</p><a href="https://plugmap.in/ev-charging-stations/bengaluru.html" target="_blank" rel="noreferrer">Open PlugMap directory '+svg.external+'</a>';
  }
}
$("#search").addEventListener("input",update);
$("#operator-filter").addEventListener("change",update);
$("#charger-filter").addEventListener("change",update);
$("#map-osm").addEventListener("click",()=>{ $("#map").classList.remove("hidden"); $("#ocm-frame").classList.remove("active"); $("#map-osm").classList.add("active"); $("#map-ocm").classList.remove("active"); map.invalidateSize(); });
$("#map-ocm").addEventListener("click",()=>{ $("#map").classList.add("hidden"); $("#ocm-frame").classList.add("active"); $("#map-ocm").classList.add("active"); $("#map-osm").classList.remove("active"); });
$("#refresh").addEventListener("click",async()=>{ $("#refresh").classList.add("spinning"); await load(); $("#refresh").classList.remove("spinning"); });

function completenessScore(s) {
  const checks = [s.name !== "Unnamed charging location", s.operator !== "Not tagged",
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

function setAccountButton() {
  $("#account-button").textContent = !backendConfigured ? "BACKEND NOT CONNECTED ↗" : (currentUser ? "ACCOUNT / SIGN OUT ↗" : "SIGN IN ↗");
  $("#community-state").textContent = !backendConfigured ? "SUPABASE CONFIG NEEDED" : (currentUser ? "SIGNED IN / " + currentUser.email : "AUTH READY");
}
function renderSavedRows(rows) {
  $("#saved-list").innerHTML = rows.length ? rows.map((row) =>
    '<div class="saved-row"><span>'+esc(row.station_name)+'</span><a target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query='+row.latitude+','+row.longitude+'">OPEN ↗</a></div>'
  ).join("") : "<p>No saved chargers yet. Use SAVE STATION in the map details.</p>";
}
function renderMyReportRows(rows) {
  $("#my-reports").innerHTML = rows.length ? rows.map((row) =>
    '<div class="report-row"><span>'+esc(row.station_name)+'</span><b class="status-'+row.status+'">'+row.status.toUpperCase()+'</b><small>'+esc(row.report_type.replaceAll("_"," "))+'</small></div>'
  ).join("") : "<p>No field reports submitted yet.</p>";
}
async function refreshAccount() {
  if (!backendConfigured) { setAccountButton(); return; }
  const state = await getCurrentUser();
  currentUser = state.user; currentProfile = state.profile;
  setAccountButton();
  if (!currentUser) {
    $("#saved-list").innerHTML = "<p>Sign in to save charging locations.</p>";
    $("#my-reports").innerHTML = "<p>Sign in to submit and track reports.</p>";
    $("#admin-panel").hidden = true;
    return;
  }
  try {
    const [saved, reports] = await Promise.all([listSavedStations(currentUser.id), listMyReports(currentUser.id)]);
    renderSavedRows(saved); renderMyReportRows(reports);
  } catch (error) { notify("Could not load account data: " + error.message, "error"); }
  if (currentProfile?.role === "admin") {
    $("#admin-panel").hidden = false;
    await refreshAdminReports();
  } else $("#admin-panel").hidden = true;
}
async function saveSelectedStation() {
  if (!currentUser) { openDialog("auth-dialog"); notify("Sign in to save this charger."); return; }
  try {
    await saveStation(currentUser.id, selectedStation);
    notify("Station saved to your personal list.", "success");
    renderSavedRows(await listSavedStations(currentUser.id));
  } catch (error) { notify(error.message, "error"); }
}
let reportTarget = null;
function openReportDialog(station = null) {
  reportTarget = station;
  $("#report-type").value = station ? "wrong_location" : "suggest_new_station";
  $("#report-description").value = "";
  $("#report-message").textContent = station ? "Report an issue with " + station.name : "Describe a missing charging location or an on-ground issue.";
  if (!currentUser) { openDialog("auth-dialog"); notify("Sign in before sending a field report."); return; }
  openDialog("report-dialog");
}
$("#account-button").addEventListener("click", async () => {
  if (!backendConfigured) { notify("Supabase project is not connected yet. Add the ChargeWise environment keys to .env.local.", "error"); return; }
  if (currentUser) {
    await supabase.auth.signOut();
    currentUser = null; currentProfile = null;
    await refreshAccount();
    notify("Signed out.");
  } else openDialog("auth-dialog");
});
$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!backendConfigured) { $("#auth-message").textContent = "Backend not connected. Configure .env.local first."; return; }
  $("#auth-message").textContent = "Sending sign-in link…";
  try {
    await sendMagicLink($("#auth-email").value.trim());
    $("#auth-message").textContent = "Magic link sent. Check your inbox and open it in this browser.";
  } catch (error) { $("#auth-message").textContent = error.message; }
});
$("#community-report").addEventListener("click", () => openReportDialog(null));
$("#report-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !backendConfigured) { notify("Sign in with the connected backend to submit reports.", "error"); return; }
  $("#report-message").textContent = "Submitting…";
  try {
    await submitStationReport(currentUser.id, {
      type: $("#report-type").value,
      name: reportTarget?.name || "Community suggested location",
      sourceId: reportTarget?.id || null,
      lat: reportTarget?.lat ?? null,
      lon: reportTarget?.lon ?? null,
      description: $("#report-description").value.trim()
    });
    $("#report-dialog").close();
    notify("Report submitted for moderator review.", "success");
    await refreshAccount();
  } catch (error) { $("#report-message").textContent = error.message; }
});
async function refreshAdminReports() {
  if (currentProfile?.role !== "admin") return;
  try {
    const rows = await listAdminReports();
    $("#admin-reports").innerHTML = rows.map((row) =>
      '<article class="admin-row"><div><b>'+esc(row.station_name)+'</b><p>'+esc(row.description)+'</p><small>'+row.status.toUpperCase()+'</small></div>'+
      (row.status === "pending" || row.status === "reviewing" ? '<div><button data-review="'+row.id+'" data-state="accepted">ACCEPT</button><button data-review="'+row.id+'" data-state="rejected">REJECT</button></div>' : "")+
      '</article>'
    ).join("") || "<p>No community reports yet.</p>";
    document.querySelectorAll("[data-review]").forEach((button) => button.addEventListener("click", async () => {
      try { await reviewReport(button.dataset.review, button.dataset.state); notify("Report reviewed.", "success"); await refreshAdminReports(); }
      catch (error) { notify(error.message, "error"); }
    }));
  } catch (error) { $("#admin-reports").textContent = "Admin data error: " + error.message; }
}
$("#sync-stations").addEventListener("click", async () => {
  const button = $("#sync-stations");
  button.disabled = true; button.textContent = "SYNCING…";
  try {
    const result = await syncStationInventory();
    notify("Synced " + result.synced + " station features into ChargeWise.", "success");
    await load();
  } catch (error) { notify(error.message, "error"); }
  finally { button.disabled = false; button.textContent = "SYNC OSM INVENTORY ↻"; }
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

if(supabase) supabase.auth.onAuthStateChange(() => { void refreshAccount(); });
void (async () => { await getBoundary(); await load(); await refreshAccount(); })();