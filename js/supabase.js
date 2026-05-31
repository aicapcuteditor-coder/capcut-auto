// ============================================
// Supabase Client Setup
// ============================================
// SETUP INSTRUCTIONS:
// 1. Go to https://supabase.com and create a free project
// 2. In your project dashboard go to: Settings → API
// 3. Copy your "Project URL" and "anon public" key
// 4. Replace the values below with your own
// ============================================

const SUPABASE_URL = "YOUR_SUPABASE_URL";        // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // starts with "eyJ..."

// Load Supabase from CDN
const supabaseScript = document.createElement("script");
supabaseScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
supabaseScript.onload = () => {
  window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.dispatchEvent(new Event("supabaseReady"));
};
document.head.appendChild(supabaseScript);

// Helper to get the client after it loads
function getSupabase() {
  return window._supabase;
}
