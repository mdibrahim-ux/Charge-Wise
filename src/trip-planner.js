import L from "leaflet";
import "./trip-planner.css";

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const vehicles = {
  ather450x: {
    label: "Ather 450X · 3.7 kWh", brand: "Ather", idc: 161,
    notes: "Ather Grid uses the LECCS charging standard. Confirm the exact location and charger status in the Ather app before riding there.",
    terms: ["ather", "leccs"],
    source: "https://www.atherenergy.com/450/specifications"
  },
  atherapex: {
    label: "Ather 450 Apex · 3.7 kWh", brand: "Ather", idc: 165,
    notes: "Ather Grid uses the LECCS charging standard. Confirm the exact location and charger status in the Ather app before riding there.",
    terms: ["ather", "leccs"],
    source: "https://www.atherenergy.com/450/specifications"
  },
  tvsiqube35: {
    label: "TVS iQube · 3.5 kWh", brand: "TVS", idc: 145,
    notes: "Use the TVS-supplied/recommended charger. A mapped EV charging pin does not prove that your portable charger can connect there.",
    terms: ["tvs", "iqube"],
    source: "https://www.tvsmotor.com/electric-scooters/tvs-iqube"
  },
  tvsiqubest: {
    label: "TVS iQube ST · 5.3 kWh", brand: "TVS", idc: 212,
    notes: "Use the TVS-supplied/recommended charger. A mapped EV charging pin does not prove that your portable charger can connect there.",
    terms: ["tvs", "iqube"],
    source: "https://www.tvsmotor.com/electric-scooters/tvs-iqube"
  },
  chetak3501: {
    label: "Bajaj Chetak 3501 / 3502 · 3.5 kWh", brand: "Bajaj", idc: 153,
    notes: "Chetak 3501 uses a 15A earthed socket with its supplied cable; 3502 uses an off-board charger. Verify the variant and socket before relying on a stop.",
    terms: ["chetak", "bajaj"],
    source: "https://www.chetak.com/faqs"
  },
  chetak3503: {
    label: "Bajaj Chetak 3503 · 3.5 kWh", brand: "Bajaj", idc: 151,
    notes: "Use the supplied off-board charger with a suitable earthed AC socket. Confirm socket access with the location before travel.",
    terms: ["chetak", "bajaj"],
    source: "https://www.chetak.com/faqs"
  },
  chetak3001: {
    label: "Bajaj Chetak 3001 · 3.0 kWh", brand: "Bajaj", idc: 127,
    notes: "Use the supplied off-board charger with a suitable earthed AC socket. Confirm socket access with the location before travel.",
    terms: ["chetak", "bajaj"],
    source: "https://www.chetak.com/faqs"
  },
  vidav2pro: {
    label: "VIDA V2 Pro · 3.9 kWh", brand: "VIDA", idc: 165,
    notes: "The V2 Pro has removable batteries. Check the current VIDA app/network listing and your charging setup before relying on a public pin.",
    terms: ["vida", "hero"],
    source: "https://www.vidaworld.com/vida-v2-pro.html"
  },
  vidav2plus: {
    label: "VIDA V2 Plus · 3.44 kWh", brand: "VIDA", idc: 143,
    notes: "The V2 Plus has removable batteries. Check the current VIDA app/network listing and your charging setup before relying on a public pin.",
    terms: ["vida", "hero"],
    source: "https://www.vidaworld.com/vida-v2-pro.html"
  },
  custom: {
    label: "Other EV / Ola / River / custom", brand: "Other", idc: null,
    notes: "Enter the IDC range from your exact model's owner manual or manufacturer page. Connector compatibility will remain unverified unless the station publishes matching details.",
    terms: [], source: ""
  }
};

const section = document.createElement("section");
section.id = "trip-planner";
section.className = "trip-planner";
section.innerHTML = [
  '<div class="trip-heading"><div><span class="trip-kicker">04 / ROUTE INTELLIGENCE</span><h2>DON’T GUESS.<br><em>PLAN THE CHARGE.</em></h2><p>Build an EV-scooter journey around your exact model, present battery level and a conservative range estimate. ChargeWise finds mapped stops along the route and estimates when you may need them.</p></div><div class="trip-stamp"><b>CHARGEWISE</b><span>TRIP PLANNER / 01</span><strong>↗</strong></div></div>',
  '<form id="trip-form" class="trip-form">',
    '<div class="trip-form-top"><b>YOUR JOURNEY</b><span>START → DESTINATION → VEHICLE → BATTERY</span></div>',
    '<div class="trip-locations">',
      '<label class="trip-field"><span><i class="trip-dot start-dot"></i>STARTING POINT</span><input id="trip-start" name="start" required placeholder="e.g. Bengaluru, Indiranagar" autocomplete="street-address"></label>',
      '<label class="trip-field"><span><i class="trip-dot end-dot"></i>DESTINATION</span><input id="trip-end" name="end" required placeholder="e.g. Mysuru Palace, Mysuru" autocomplete="street-address"></label>',
    '</div>',
    '<div class="trip-vehicle-row">',
      '<label class="trip-field vehicle-field"><span>YOUR EV MODEL</span><select id="trip-vehicle" name="vehicle"></select><small id="vehicle-notes"></small></label>',
      '<label class="trip-field"><span>BATTERY RIGHT NOW / %</span><input id="trip-battery" type="number" min="1" max="100" value="80" required></label>',
      '<label class="trip-field"><span>SAFETY RESERVE / %</span><input id="trip-reserve" type="number" min="5" max="40" value="15" required></label>',
      '<label class="trip-field"><span>RANGE FACTOR / % OF IDC</span><input id="trip-factor" type="number" min="50" max="95" value="75" required><small>Conservative planning adjustment. Tune it to your own riding history.</small></label>',
      '<label class="trip-field custom-range-field" id="custom-range-wrap" hidden><span>YOUR MODEL’S IDC RANGE / KM</span><input id="trip-custom-range" type="number" min="20" max="500" value="140"></label>',
      '<label class="trip-field"><span>CHARGE TARGET AT STOPS / %</span><input id="trip-target" type="number" min="50" max="100" value="85"></label>',
    '</div>',
    '<div class="trip-submit-row"><button class="trip-submit" id="trip-submit" type="submit">BUILD MY CHARGING PLAN <b>↗</b></button><span>Uses public road routing and OpenStreetMap station records. Your location is not requested.</span></div>',
  '</form>',
  '<div class="trip-output" id="trip-output" aria-live="polite"><div class="trip-empty"><b>READY FOR YOUR NEXT RIDE?</b><p>Enter your start, destination, EV model and battery percentage. The planner will calculate a road route, estimate the usable range and suggest charging stops.</p><span>NO ROUTE HAS BEEN CALCULATED YET</span></div></div>',
  '<div class="trip-footnote"><b>IMPORTANT:</b> Range is an estimate based on the manufacturer-published IDC figure multiplied by your selected range factor. Actual range changes with speed, rider/passenger load, gradients, temperature, tyres and traffic. Mapped stations are not live-confirmed for uptime, pricing, access or vehicle compatibility. Check your OEM app and the station operator before departure. Road routing uses a general driving profile; verify that each road is legal and suitable for your scooter.</div>',
  '<div class="trip-sources"><span>MODEL DATA</span><a href="https://www.atherenergy.com/450/specifications" target="_blank" rel="noreferrer">ATHER ↗</a><a href="https://www.tvsmotor.com/electric-scooters/tvs-iqube" target="_blank" rel="noreferrer">TVS ↗</a><a href="https://www.chetak.com/faqs" target="_blank" rel="noreferrer">CHETAK ↗</a><a href="https://www.vidaworld.com/vida-v2-pro.html" target="_blank" rel="noreferrer">VIDA ↗</a></div>'
].join("");

const mapLayout = document.querySelector(".map-layout");
if (mapLayout) mapLayout.insertAdjacentElement("afterend", section);
else document.querySelector("main")?.append(section);

const vehicleSelect = $("#trip-vehicle", section);
vehicleSelect.innerHTML = Object.entries(vehicles).map(([key, item]) =>
  '<option value="' + key + '">' + esc(item.label) + (item.idc ? " · " + item.idc + " km IDC" : "") + "</option>"
).join("");
function currentVehicle() {
  return vehicles[vehicleSelect.value] || vehicles.custom;
}
function updateVehicleNotes() {
  const model = currentVehicle();
  $("#vehicle-notes", section).textContent = model.notes;
  $("#custom-range-wrap", section).hidden = vehicleSelect.value !== "custom";
}
vehicleSelect.addEventListener("change", updateVehicleNotes);
updateVehicleNotes();

let routeLayer = null;
let stopLayer = null;
let lastPlan = null;

function kmBetween(a, b) {
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const t = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(t), Math.sqrt(1 - t));
}
let lastGeocodeAt = 0;
async function geocode(place) {
  const delay = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
  if (delay) await wait(delay);
  lastGeocodeAt = Date.now();
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=" + encodeURIComponent(place);
  const response = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!response.ok) throw new Error("Place search is temporarily unavailable (HTTP " + response.status + ").");
  const data = await response.json();
  if (!data.length) throw new Error('Could not find "' + place + '". Try adding the city or a nearby landmark.');
  return { lat: Number(data[0].lat), lon: Number(data[0].lon), label: data[0].display_name };
}
async function getRoadRoute(start, end) {
  const url = "https://router.project-osrm.org/route/v1/driving/" +
    start.lon + "," + start.lat + ";" + end.lon + "," + end.lat +
    "?overview=full&geometries=geojson&steps=false&alternatives=false";
  const response = await fetch(url);
  if (!response.ok) throw new Error("The public road-routing service is unavailable (HTTP " + response.status + ").");
  const data = await response.json();
  if (data.code !== "Ok" || !data.routes || !data.routes[0]) throw new Error("No routable road path was returned for these places.");
  return data.routes[0];
}
function cumulativeRoute(coords) {
  const cumulative = [0];
  for (let i = 1; i < coords.length; i++) {
    cumulative.push(cumulative[i - 1] + kmBetween(
      { lat: coords[i - 1][1], lon: coords[i - 1][0] },
      { lat: coords[i][1], lon: coords[i][0] }
    ));
  }
  return cumulative;
}
function coordinateAt(coords, cumulative, targetKm) {
  if (targetKm <= 0) return coords[0];
  if (targetKm >= cumulative[cumulative.length - 1]) return coords[coords.length - 1];
  let index = 1;
  while (index < cumulative.length && cumulative[index] < targetKm) index++;
  const segment = cumulative[index] - cumulative[index - 1];
  const fraction = segment ? (targetKm - cumulative[index - 1]) / segment : 0;
  return [
    coords[index - 1][0] + (coords[index][0] - coords[index - 1][0]) * fraction,
    coords[index - 1][1] + (coords[index][1] - coords[index - 1][1]) * fraction
  ];
}
function sampleRoute(coords, cumulative) {
  const total = cumulative[cumulative.length - 1];
  const count = Math.max(2, Math.min(32, Math.ceil(total / 14) + 1));
  const points = [];
  for (let i = 0; i < count; i++) {
    const at = total * i / (count - 1);
    points.push(coordinateAt(coords, cumulative, at));
  }
  return points;
}
async function fetchRouteStations(coords, cumulative) {
  const samples = sampleRoute(coords, cumulative);
  const around = samples.map(([lon, lat]) => {
    const point = lat.toFixed(5) + "," + lon.toFixed(5);
    return 'node["amenity"="charging_station"](around:9000,' + point + ');' +
      'way["amenity"="charging_station"](around:9000,' + point + ');' +
      'relation["amenity"="charging_station"](around:9000,' + point + ');';
  }).join("");
  const query = "[out:json][timeout:50];(" + around + ");out center tags;";
  const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: "data=" + encodeURIComponent(query)
      });
      if (!response.ok) throw new Error("Overpass HTTP " + response.status);
      const data = await response.json();
      const routeStations = (data.elements || []).map(parseStation).filter((station) =>
        Number.isFinite(station.lat) && Number.isFinite(station.lon)
      );
      const localStations = window.chargeWiseApp?.stations || [];
      const merged = new Map();
      routeStations.concat(localStations).forEach((station) => {
        if (station && station.id && !merged.has(station.id)) merged.set(station.id, station);
      });
      return Array.from(merged.values());
    } catch (error) {
      console.info("Route station query failed at " + endpoint, error);
    }
  }
  const appStations = window.chargeWiseApp?.stations || [];
  if (appStations.length) return appStations;
  throw new Error("Could not load charging locations along this route. Please retry in a moment.");
}
function parseStation(element) {
  if (element.id && element.lat != null && element.lon != null && !element.tags) return element;
  const tags = element.tags || {};
  const point = element.center || element;
  const read = (...keys) => {
    for (const key of keys) if (tags[key]) return tags[key];
    return "";
  };
  const connectorKeys = Object.keys(tags).filter((key) => key.startsWith("socket:") || key.includes("connector"));
  const connectors = connectorKeys.map((key) => key + "=" + tags[key]).join(", ");
  const power = read("capacity", "socket:output", "charging_station:output", "maxpower", "max power");
  const op = read("operator", "brand", "network");
  return {
    id: (element.type || "node") + "/" + element.id,
    lat: Number(point.lat), lon: Number(point.lon),
    name: read("name", "brand", "operator") || "Unnamed charging station",
    operator: op || "Not tagged",
    address: [read("addr:housenumber"), read("addr:street"), read("addr:suburb"), read("addr:city")].filter(Boolean).join(", "),
    power: power || "Not listed",
    connector: connectors || "Not listed",
    access: read("access") || "Not specified",
    opening: read("opening_hours") || "Not listed",
    tags,
    fast: /dc|ccs|chademo/i.test(JSON.stringify(tags)),
    url: "https://www.openstreetmap.org/" + (element.type || "node") + "/" + element.id
  };
}
function stationAlongRoute(station, coords, cumulative) {
  let best = { offRouteKm: Infinity, alongKm: 0 };
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1], b = coords[i];
    const meanLat = (a[1] + b[1] + station.lat) / 3;
    const scaleX = 111.32 * Math.cos(meanLat * Math.PI / 180);
    const scaleY = 111.32;
    const px = (station.lon - a[0]) * scaleX, py = (station.lat - a[1]) * scaleY;
    const vx = (b[0] - a[0]) * scaleX, vy = (b[1] - a[1]) * scaleY;
    const lengthSquared = vx * vx + vy * vy;
    const t = lengthSquared ? Math.max(0, Math.min(1, (px * vx + py * vy) / lengthSquared)) : 0;
    const dx = px - t * vx, dy = py - t * vy;
    const offRouteKm = Math.sqrt(dx * dx + dy * dy);
    if (offRouteKm < best.offRouteKm) {
      const segmentKm = cumulative[i] - cumulative[i - 1];
      best = { offRouteKm, alongKm: cumulative[i - 1] + segmentKm * t };
    }
  }
  return best;
}
function compatibility(station, vehicle) {
  const raw = station.tags || {};
  const haystack = [
    station.name, station.operator, station.connector, raw.network, raw.brand, raw.operator
  ].join(" ").toLowerCase();
  const networkMatch = (vehicle.terms || []).some((term) => haystack.includes(term));
  if (networkMatch) return { kind: "network", label: "Brand / network text match · verify in OEM app", rank: 3 };
  if (station.connector && station.connector !== "Not listed") {
    return { kind: "verify", label: "Connector tagged · verify vehicle fit", rank: 2 };
  }
  return { kind: "unknown", label: "Connector not published", rank: 1 };
}
function getRouteCandidates(stations, coords, cumulative, vehicle) {
  const seen = new Set();
  return stations.filter((station) => {
    if (seen.has(station.id)) return false;
    seen.add(station.id);
    const access = String(station.access || "").toLowerCase();
    return access !== "private" && access !== "no";
  }).map((station) => {
    const position = stationAlongRoute(station, coords, cumulative);
    const fit = compatibility(station, vehicle);
    return { station, ...position, fit };
  }).filter((entry) => entry.offRouteKm <= 9 && entry.alongKm > 1 && entry.alongKm < cumulative[cumulative.length - 1] - 1)
    .sort((a, b) => a.alongKm - b.alongKm);
}
function buildChargingStops(candidates, totalKm, planningRange, startSoc, reserve, targetSoc) {
  const stops = [];
  let progress = 0;
  let soc = startSoc;
  let guard = 0;
  while (totalKm - progress > planningRange * Math.max(0, soc - reserve) / 100 && guard++ < 10) {
    const reach = planningRange * Math.max(0, soc - reserve) / 100;
    const reachable = candidates.filter((entry) => {
      if (entry.alongKm <= progress + 1 || entry.alongKm - progress > reach) return false;
      const distanceWithDetour = entry.alongKm - progress + entry.offRouteKm * 2;
      return distanceWithDetour <= reach;
    });
    if (!reachable.length) {
      return { stops, complete: false, gapAtKm: progress, rangeLeftKm: reach };
    }
    const highestCompatibility = Math.max(...reachable.map((entry) => entry.fit.rank));
    const preferred = reachable.filter((entry) => entry.fit.rank === highestCompatibility);
    const chosen = preferred[preferred.length - 1];
    const legKm = chosen.alongKm - progress + chosen.offRouteKm * 2;
    const arrivalSoc = Math.max(0, soc - legKm / planningRange * 100);
    stops.push({ ...chosen, arrivalSoc, chargeTo: targetSoc, legKm });
    progress = chosen.alongKm;
    soc = targetSoc;
  }
  const complete = totalKm - progress <= planningRange * Math.max(0, soc - reserve) / 100;
  return { stops, complete, gapAtKm: complete ? null : progress, rangeLeftKm: planningRange * Math.max(0, soc - reserve) / 100 };
}
function renderResult(plan) {
  const result = $("#trip-output", section);
  const routeKm = plan.routeKm.toFixed(1);
  const stats = [
    ["ROAD ROUTE", routeKm + " km"],
    ["PLANNING RANGE", Math.round(plan.planningRange) + " km"],
    ["MAPPED STOPS", String(plan.candidates.length)],
    ["CHARGE STOPS", String(plan.stops.stops.length)]
  ];
  const statsHtml = stats.map((item) => '<article class="trip-stat"><span>' + item[0] + '</span><b>' + item[1] + '</b></article>').join("");
  const statusHtml = plan.stops.complete
    ? '<div class="trip-status trip-status-good"><b>ROUTE COVERED BY THE ESTIMATE</b><span>Your starting charge and suggested stops provide enough estimated range with the chosen reserve.</span></div>'
    : '<div class="trip-status trip-status-bad"><b>NO COMPLETE SAFE-STOP PLAN FOUND</b><span>At about ' + (plan.stops.gapAtKm || 0).toFixed(1) + ' km into the route, no mapped candidate was found inside the estimated safe range. Charge before departure, raise your starting battery or choose another route.</span></div>';
  let itinerary = '<div class="trip-itinerary-head"><b>CHARGING ITINERARY</b><span>' + (plan.stops.stops.length ? plan.stops.stops.length + " SUGGESTED STOP(S)" : "NO STOP NEEDED BY THIS ESTIMATE") + '</span></div>';
  itinerary += '<article class="trip-leg"><div class="trip-leg-no">01</div><div><b>' + esc(plan.start.label.split(",").slice(0, 2).join(",")) + '</b><small>START · ' + plan.startSoc + '% BATTERY</small></div><span class="trip-leg-tag">DEPART</span></article>';
  plan.stops.stops.forEach((entry, index) => {
    const station = entry.station;
    const maps = "https://www.google.com/maps/dir/?api=1&destination=" + station.lat + "," + station.lon;
    itinerary += '<article class="trip-stop"><div class="trip-leg-no">' + String(index + 2).padStart(2, "0") + '</div><div class="trip-stop-main"><b>' + esc(station.name) + '</b><small>' + esc(station.operator) + ' · approx. ' + entry.alongKm.toFixed(1) + ' km from start · access: ' + esc(station.access || "unknown") + '</small><div class="trip-stop-meta"><span>ARRIVE ≈ ' + Math.round(entry.arrivalSoc) + '%</span><span>CHARGE TO ' + entry.chargeTo + '%</span><span>DETOUR ≈ ' + entry.offRouteKm.toFixed(1) + ' km</span></div><em class="trip-fit fit-' + entry.fit.kind + '">' + esc(entry.fit.label) + '</em><p>' + esc(plan.vehicle.notes) + '</p></div><a href="' + maps + '" target="_blank" rel="noreferrer">NAVIGATE ↗</a></article>';
  });
  if (!plan.stops.complete) {
    itinerary += '<div class="trip-gap-warning"><b>CHARGING GAP / CHECK REQUIRED</b><span>There is no mapped stop within the estimated remaining range at this point. Do not attempt this leg without a verified charging alternative.</span></div>';
  }
  itinerary += '<article class="trip-leg trip-destination"><div class="trip-leg-no">FIN</div><div><b>' + esc(plan.end.label.split(",").slice(0, 2).join(",")) + '</b><small>DESTINATION · ' + routeKm + ' KM ESTIMATED ROAD DISTANCE</small></div><span class="trip-leg-tag">ARRIVE</span></article>';
  result.innerHTML = '<div class="trip-results-top"><div><span>TRIP ANALYSIS / ' + esc(plan.vehicle.label.toUpperCase()) + '</span><h3>' + (plan.stops.complete ? "YOUR ROUTE.<br>YOUR CHARGE PLAN." : "ROUTE NEEDS<br>ANOTHER OPTION.") + '</h3><p>From ' + esc(plan.start.label.split(",").slice(0, 2).join(",")) + ' to ' + esc(plan.end.label.split(",").slice(0, 2).join(",")) + '</p></div><a href="https://www.google.com/maps/dir/?api=1&origin=' + plan.start.lat + ',' + plan.start.lon + '&destination=' + plan.end.lat + ',' + plan.end.lon + '&travelmode=driving" target="_blank" rel="noreferrer">OPEN FULL ROUTE IN MAPS ↗</a></div>' +
    '<div class="trip-stats">' + statsHtml + '</div>' + statusHtml +
    '<div class="trip-results-grid"><div class="trip-itinerary">' + itinerary + '</div><aside class="trip-model-card"><span>VEHICLE RANGE MODEL</span><b>' + Math.round(plan.vehicle.idc || plan.customRange) + ' km</b><small>Manufacturer IDC figure</small><hr><div><span>Range factor</span><b>' + plan.factor + '%</b></div><div><span>Estimated full-charge range</span><b>' + Math.round(plan.planningRange) + ' km</b></div><div><span>Starting battery</span><b>' + plan.startSoc + '%</b></div><div><span>Safety reserve</span><b>' + plan.reserve + '%</b></div><div><span>Target at each stop</span><b>' + plan.targetSoc + '%</b></div><p>' + esc(plan.vehicle.notes) + '</p><small>Estimate only. Adjust the range factor to reflect your own vehicle, riding style and conditions.</small></aside></div>' +
    '<div class="trip-data-note">The route line is a general road-network estimate, not a scooter-specific legal route. The listed stops are OpenStreetMap charging-station records near the route (within 9 km straight-line corridor). No live status, price, opening time, socket access or vehicle compatibility has been confirmed.</div>';
}
function showBusy(message) {
  $("#trip-output", section).innerHTML = '<div class="trip-loading"><span class="trip-loader"></span><b>' + esc(message) + '</b><small>Checking public route and charging-station data…</small></div>';
}
function drawPlanOnMap(plan) {
  const app = window.chargeWiseApp;
  if (!app || !app.map) return;
  const map = app.map;
  if (routeLayer) map.removeLayer(routeLayer);
  if (stopLayer) map.removeLayer(stopLayer);
  routeLayer = L.geoJSON(plan.geometry, {
    style: { color: "#ff614d", weight: 6, opacity: 0.9, lineCap: "square", lineJoin: "round" }
  }).addTo(map);
  stopLayer = L.layerGroup().addTo(map);
  L.circleMarker([plan.start.lat, plan.start.lon], {
    radius: 9, color: "#111310", weight: 3, fillColor: "#caff3d", fillOpacity: 1
  }).addTo(stopLayer).bindTooltip("TRIP START");
  L.circleMarker([plan.end.lat, plan.end.lon], {
    radius: 9, color: "#111310", weight: 3, fillColor: "#ff614d", fillOpacity: 1
  }).addTo(stopLayer).bindTooltip("DESTINATION");
  const stopIds = new Set(plan.stops.stops.map((entry) => entry.station.id));
  plan.candidates.forEach((entry) => {
    const selected = stopIds.has(entry.station.id);
    L.circleMarker([entry.station.lat, entry.station.lon], {
      radius: selected ? 9 : 5,
      color: "#111310",
      weight: selected ? 3 : 1.5,
      fillColor: selected ? "#ff614d" : "#caff3d",
      fillOpacity: selected ? 1 : 0.72
    }).addTo(stopLayer).bindTooltip((selected ? "SUGGESTED STOP · " : "MAPPED STATION · ") + entry.station.name);
  });
  map.fitBounds(routeLayer.getBounds(), { padding: [26, 26], maxZoom: 13 });
  setTimeout(() => map.invalidateSize(), 150);
}
async function buildPlan(event) {
  event.preventDefault();
  const startText = $("#trip-start", section).value.trim();
  const endText = $("#trip-end", section).value.trim();
  const vehicle = currentVehicle();
  const customRange = Number($("#trip-custom-range", section).value);
  const idcRange = vehicle.idc || customRange;
  const startSoc = Number($("#trip-battery", section).value);
  const reserve = Number($("#trip-reserve", section).value);
  const factor = Number($("#trip-factor", section).value);
  const targetSoc = Number($("#trip-target", section).value);
  if (!startText || !endText) return;
  if (!(idcRange >= 20 && startSoc > reserve && startSoc <= 100 && reserve >= 5 && reserve < 40 && factor >= 50 && factor <= 95 && targetSoc > reserve && targetSoc <= 100)) {
    window.chargeWiseApp?.notify("Check the IDC range, battery, safety reserve, range factor and charge target values.", "error");
    return;
  }
  const button = $("#trip-submit", section);
  button.disabled = true;
  button.innerHTML = 'ANALYSING ROUTE <b>…</b>';
  try {
    showBusy("Finding your starting point…");
    const start = await geocode(startText);
    await wait(1100);
    showBusy("Finding your destination…");
    const end = await geocode(endText);
    showBusy("Calculating the road route…");
    const route = await getRoadRoute(start, end);
    const coords = route.geometry.coordinates;
    const cumulative = cumulativeRoute(coords);
    const routeKm = route.distance / 1000;
    showBusy("Scanning mapped chargers along the route…");
    const stations = await fetchRouteStations(coords, cumulative);
    const candidates = getRouteCandidates(stations, coords, cumulative, vehicle);
    const planningRange = idcRange * factor / 100;
    const stops = buildChargingStops(candidates, routeKm, planningRange, startSoc, reserve, targetSoc);
    const plan = {
      start, end, geometry: route.geometry, routeKm,
      vehicle, customRange: idcRange, startSoc, reserve, factor, targetSoc,
      planningRange, candidates, stops
    };
    lastPlan = plan;
    renderResult(plan);
    drawPlanOnMap(plan);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("ChargeWise trip planner:", error);
    $("#trip-output", section).innerHTML = '<div class="trip-error"><b>COULD NOT COMPLETE THE PLAN</b><p>' + esc(error.message || "The route service could not complete this request.") + '</p><small>Try a more specific place name or retry after the public map services recover.</small></div>';
  } finally {
    button.disabled = false;
    button.innerHTML = 'BUILD MY CHARGING PLAN <b>↗</b>';
  }
}
$("#trip-form", section).addEventListener("submit", buildPlan);

window.addEventListener("chargewise:stations-updated", () => {
  if (lastPlan) return;
});
