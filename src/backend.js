import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && publishableKey
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const backendConfigured = Boolean(supabase);

export async function getCurrentUser() {
  if (!supabase) return { user: null, profile: null };
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,display_name,role")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile };
}

export async function sendMagicLink(email) {
  if (!supabase) throw new Error("Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY values to .env.local.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function saveStation(userId, station) {
  if (!supabase) throw new Error("Backend is not configured yet.");
  const { error } = await supabase.from("saved_stations").upsert({
    user_id: userId,
    source: "openstreetmap",
    source_id: station.id,
    station_name: station.name,
    latitude: station.lat,
    longitude: station.lon,
    operator: station.operator === "Not tagged" ? null : station.operator
  }, { onConflict: "user_id,source,source_id" });
  if (error) throw error;
}

export async function removeSavedStation(userId, station) {
  if (!supabase) throw new Error("Backend is not configured yet.");
  const { error } = await supabase.from("saved_stations")
    .delete()
    .eq("user_id", userId)
    .eq("source", "openstreetmap")
    .eq("source_id", station.id);
  if (error) throw error;
}

export async function submitStationReport(userId, report) {
  if (!supabase) throw new Error("Backend is not configured yet.");
  const { error } = await supabase.from("station_reports").insert({
    reporter_id: userId,
    report_type: report.type,
    station_source: report.source || "openstreetmap",
    station_source_id: report.sourceId || null,
    station_name: report.name,
    latitude: report.lat ?? null,
    longitude: report.lon ?? null,
    description: report.description
  });
  if (error) throw error;
}

export async function listSavedStations(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("saved_stations")
    .select("id,source_id,station_name,latitude,longitude,operator,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listMyReports(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("station_reports")
    .select("id,report_type,station_name,status,created_at,admin_note")
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function listAdminReports() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("station_reports")
    .select("id,report_type,station_name,description,status,created_at,reporter_id")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function reviewReport(id, status, note = "") {
  if (!supabase) throw new Error("Backend is not configured yet.");
  const { error } = await supabase.from("station_reports")
    .update({ status, admin_note: note, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function syncStationInventory() {
  if (!supabase) throw new Error("Backend is not configured yet.");
  const { data, error } = await supabase.functions.invoke("sync-bengaluru-stations", { body: {} });
  if (error) throw error;
  return data;
}
