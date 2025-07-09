// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug para ver qué está llegando
console.log("🔍 Supabase URL:", supabaseUrl);
console.log("🔍 Supabase Key exists:", !!supabaseAnonKey);

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is required");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is required");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ REMOVED: Ya no inicializamos aquí para evitar race conditions
