import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

// next/font descarga las fuentes en el build y las sirve desde nuestro dominio
// (sin pedidos a Google en cada visita). Cada una queda expuesta como variable
// CSS, que globals.css conecta con las clases de Tailwind `font-sans` y `font-display`.

// Barlow: texto general. Pedimos solo los pesos que usamos para no cargar de más.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Barlow Condensed: títulos y textos del pizarrón, al estilo del "ONDA" del logo.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Metadata: Next.js la convierte en etiquetas <title>, <meta>, etc.
// El link al manifest (app/manifest.ts) lo agrega Next.js solo: hace que la web
// sea instalable (PWA), lo que más adelante permite empaquetar la app de TV.
export const metadata: Metadata = {
  title: "OndaSmart",
  description: "Planificador de rutinas de OndaCrossfit",
  applicationName: "OndaSmart",
};

// El viewport se exporta aparte (requisito de Next.js 15).
// themeColor pinta la barra del navegador en el celular con el fondo de la app.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e1115",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body
        className={`${barlow.variable} ${barlowCondensed.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
