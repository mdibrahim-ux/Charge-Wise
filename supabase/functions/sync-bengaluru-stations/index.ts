import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const bounds = { south: 12.80, west: 77.42, north: 13.18, east: 77.82 };
const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(",");
const query = \`[out:json][timeout:45];(
  node["amenity"="charging_station"](\${bbox});
  way["amenity"="charging_station"](\${bbox});
  relation["amenity"="charging_station"](\${bbox});
);out center tags;\`;

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!url || !anon || !service || !authHeader?.startsWith("Bearer ")) {
    return reply({ error: "Backend configuration or user session is missing." }, 500);
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const token = authHeader.slice("Bearer ".length);
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return reply({ error: "Authentication required." }, 401);

  const adminClient = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: profile, error: profileError } = await adminClient
    .from("profiles").select("role").eq("id", authData.user.id).single();
  if (profileError || profile?.role !== "admin") return reply({ error: "Admin access required." }, 403);

  const startedAt = new Date().toISOString();
  try {
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter"
    ];
    let elements: any[] | null = null;
    let lastError = "No Overpass endpoint responded.";
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: "data=" + encodeURIComponent(query)
        });
        if (!response.ok) throw new Error("Overpass HTTP " + response.status);
        const data = await response.json();
        elements = data.elements ?? [];
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown Overpass error";
      }
    }
    if (!elements) throw new Error(lastError);

    const rows = elements.flatMap((el) => {
      const tags = el.tags ?? {};
      const point = el.center ?? el;
      const lat = Number(point.lat), lon = Number(point.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
      const value = (...keys: string[]) => keys.map((k) => tags[k]).find(Boolean) ?? null;
      return [{
        source: "openstreetmap",
        source_id: String(el.type) + "/" + String(el.id),
        name: value("name", "brand", "operator") ?? "Unnamed charging station",
        operator: value("operator", "brand", "network"),
        city: "Bengaluru",
        latitude: lat,
        longitude: lon,
        connector: value("socket:type2", "socket:ccs", "socket:chademo", "socket:type1"),
        max_power: value("capacity", "socket:output", "charging_station:output", "maxpower", "max power"),
        access: value("access"),
        opening_hours: value("opening_hours"),
        source_url: "https://www.openstreetmap.org/" + el.type + "/" + el.id,
        raw_tags: tags,
        last_seen_at: new Date().toISOString()
      }];
    });

    const batchSize = 400;
    for (let index = 0; index < rows.length; index += batchSize) {
      const batch = rows.slice(index, index + batchSize);
      const { error } = await adminClient.from("charging_stations")
        .upsert(batch, { onConflict: "source,source_id" });
      if (error) throw error;
    }

    const finishedAt = new Date().toISOString();
    const { error: logError } = await adminClient.from("station_sync_runs").insert({
      started_by: authData.user.id,
      result_count: rows.length,
      status: "success",
      message: "Synchronized Bengaluru OpenStreetMap charging features.",
      started_at: startedAt,
      finished_at: finishedAt
    });
    if (logError) console.error("Could not write sync log", logError.message);
    return reply({ ok: true, synced: rows.length, startedAt, finishedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Station sync failed.";
    await adminClient.from("station_sync_runs").insert({
      started_by: authData.user.id,
      result_count: 0,
      status: "failed",
      message: message.slice(0, 500),
      started_at: startedAt,
      finished_at: new Date().toISOString()
    });
    return reply({ error: message }, 502);
  }
});
