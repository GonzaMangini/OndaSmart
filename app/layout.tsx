import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font descarga la fuente en el build y la sirve desde nuestro dominio
// (sin pedidos a Google en cada visita). La exponemos como variable CSS
// para usarla desde Tailwind (ver globals.css).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
// themeColor pinta la barra del navegador en el celular.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d72638",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
