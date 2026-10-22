import type { MetadataRoute } from "next";

// Web App Manifest: Next.js lo publica en /manifest.webmanifest.
// Permite "instalar" la web en el celular o en la TV con nombre e ícono propios.
// TODO (etapa TV): reemplazar el favicon por íconos PNG de 192px y 512px.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OndaSmart",
    short_name: "OndaSmart",
    description: "Planificador de rutinas de OndaCrossfit",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1115",
    theme_color: "#0e1115",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
