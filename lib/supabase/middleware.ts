import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/** Rutas que requieren estar logueado. */
const PROTECTED_PREFIXES = ["/plan", "/ejercicios"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Se ejecuta en cada pedido (lo llama middleware.ts en la raíz). Hace dos cosas:
//  1. Si el token de sesión del coach está por vencer, lo renueva y guarda las
//     cookies nuevas en la respuesta. Así nadie queda deslogueado en medio de
//     la carga de una rutina.
//  2. Manda a /login a quien entra a una ruta protegida sin sesión, y a /plan
//     a quien abre /login ya estando logueado.
//
// Ojo: esto es la "puerta de entrada" para la experiencia de uso. La seguridad
// real de los datos está en las policies RLS de la base.
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // Al redirigir creamos una respuesta nueva: le copiamos las cookies de
  // sesión que Supabase pudo haber renovado arriba, para no perderlas.
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && isProtected(pathname)) {
    // Guardamos a dónde quería ir, para volver ahí después del login.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return redirectTo(loginUrl);
  }

  if (user && pathname === "/login") {
    return redirectTo(new URL("/plan", request.url));
  }

  return response;
}
