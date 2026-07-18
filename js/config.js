// FearLess Travel 360 - Supabase Cloud Configuration
// Replace these placeholders with your actual Supabase URL and Anonymous Public Key!

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

let supabaseClient = null;

// Prevent initialization crashes if values are left default
if (SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY") {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase Client initialized successfully!");
  } catch (err) {
    console.error("Supabase Client failed to initialize:", err);
  }
} else {
  console.warn("Supabase credentials not configured. Falling back to local storage simulation.");
}
