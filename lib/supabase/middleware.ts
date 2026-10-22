import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

// Se ejecuta en cada pedido (lo llama middleware.ts en la raíz).
// Su trabajo: si el token de sesión del coach está por vencer, lo renueva
// y guarda las cookies nuevas en la respuesta. Así nadie queda deslogueado
// en medio de la carga de una rutina.
//
// En la etapa 4 acá también vamos a redirigir a /login a quien entre a /plan
// sin sesión.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Si Supabase todavía no está configurado (por ejemplo, un deploy sin las
  // variables cargadas), dejamos pasar el pedido en vez de romper todo el sitio.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return response;
  }
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Las cookies nuevas se escriben en el pedido (para que las vea el
        // resto de esta request) y en la respuesta (para que las guarde el navegador).
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Importante: esta llamada es la que dispara la renovación del token.
  // No poner código entre createServerClient y getUser().
  await supabase.auth.getUser();

  return response;
}
