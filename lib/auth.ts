// ¿Quién está usando la app? (solo en el servidor)

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  user: User | null;
  /** Fila de la tabla coaches; null si el usuario no está habilitado para editar. */
  coach: { name: string } | null;
}

/**
 * Devuelve el usuario logueado y, si es coach, su ficha.
 *
 * `cache` (de React) guarda el resultado durante UN pedido: si el layout y
 * la página la llaman los dos, se consulta a Supabase una sola vez.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();

  // getUser() valida la sesión contra Supabase (no confía solo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, coach: null };

  // La policy de coaches deja que cada usuario vea solo su propia fila.
  const { data: coach } = await supabase
    .from("coaches")
    .select("name")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, coach };
});
