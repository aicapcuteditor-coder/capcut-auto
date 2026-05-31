// ============================================
// Supabase Client Setup
// ============================================

const SUPABASE_URL = "https://mfqirmysvhntvvrqwimg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kmqb26GeoreZ2VXv5cOJyw_m_GSc_TU";

// Load Supabase from CDN
const supabaseScript = document.createElement("script");
supabaseScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
supabaseScript.onload = () => {
  window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.dispatchEvent(new Event("supabaseReady"));
};
document.head.appendChild(supabaseScript);

function getSupabase() {
  return window._supabase;
}
