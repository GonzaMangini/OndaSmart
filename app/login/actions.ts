"use server";

// Server Actions de login y logout.
//
// "use server" marca estas funciones como Server Actions: el formulario las
// llama desde el navegador, pero se ejecutan en el servidor. Así la contraseña
// viaja directo al servidor y de ahí a Supabase.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

/**
 * Valida a dónde volver después del login. Solo se aceptan rutas internas
 * ("/plan/..."): si aceptáramos cualquier URL, alguien podría mandar un link
 * a /login?next=https://sitio-falso.com y redirigir al coach a otro sitio.
 */
function safeNextPath(next: FormDataEntryValue | null): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/plan";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá el email y la contraseña." };
  }

  const supabase = await createClient();
  // Si sale bien, Supabase guarda la sesión en cookies (vía lib/supabase/server.ts).
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje genérico a propósito: no revelamos si el email existe o no.
    if (error.code === "invalid_credentials") {
      return { error: "Email o contraseña incorrectos." };
    }
    if (error.code === "email_not_confirmed") {
      return { error: "Tu email todavía no está confirmado. Avisale al administrador." };
    }
    return { error: "No se pudo iniciar sesión. Probá de nuevo en un rato." };
  }

  // redirect() corta la ejecución acá: no devuelve nada.
  redirect(safeNextPath(formData.get("next")));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
