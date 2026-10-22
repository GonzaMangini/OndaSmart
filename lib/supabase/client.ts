import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Cliente de Supabase para usar en el NAVEGADOR, o sea en componentes
// con "use client" (por ejemplo el editor, que autoguarda mientras tipeás).
// La sesión del usuario viaja en cookies, así el servidor también la ve.
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}
