import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// Cliente de Supabase para usar en el SERVIDOR: Server Components,
// Server Actions y Route Handlers.
//
// Se crea uno nuevo en cada pedido (no se reutiliza entre usuarios),
// porque cada pedido trae las cookies de sesión de un usuario distinto.
export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      // Supabase lee las cookies de sesión del pedido…
      getAll() {
        return cookieStore.getAll();
      },
      // …y a veces necesita escribirlas (cuando renueva el token).
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Los Server Components no pueden escribir cookies: Next.js tira
          // un error. Lo ignoramos porque el middleware ya se encarga de
          // renovar la sesión en cada pedido (ver lib/supabase/middleware.ts).
        }
      },
    },
  });
}
