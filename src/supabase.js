import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "[Impulso] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
      "Crea un archivo .env en la raíz del proyecto (usa .env.example como plantilla)."
  );
}

export const supabase = createClient(url || "", anonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});