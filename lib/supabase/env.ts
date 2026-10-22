// Lee las variables de entorno de Supabase en un solo lugar.
// Si falta alguna, falla con un mensaje claro en vez de un error críptico
// más adelante ("Invalid URL", "fetch failed", etc.).
//
// Ojo: Next.js solo reemplaza las variables NEXT_PUBLIC_* en el navegador si
// están escritas literalmente (process.env.NEXT_PUBLIC_X), por eso no usamos
// algo como process.env[nombre].

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Copiá .env.example como .env.local y completalo (en Vercel: Settings → Environment Variables).",
    );
  }

  return { url, key };
}
