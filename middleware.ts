import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Middleware de Next.js: corre antes de cada pedido que coincida con `matcher`.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Corre en todas las rutas menos en archivos estáticos e imágenes,
  // que no necesitan sesión.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
