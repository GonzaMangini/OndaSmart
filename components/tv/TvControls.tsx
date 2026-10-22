"use client";

// Comportamiento de la pantalla de TV (no dibuja nada):
//   · Se actualiza sola cada minuto, para mostrar lo que el coach editó.
//   · Las flechas ◀ ▶ del control remoto cambian de pantalla (Performance, Fuerza…).
//     El navegador de la tele recibe esas flechas como las teclas de un teclado.

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_EVERY_MS = 60_000;

interface TvControlsProps {
  /** Slugs de todas las pantallas, en orden. */
  slugs: string[];
  currentSlug: string;
}

export function TvControls({ slugs, currentSlug }: TvControlsProps) {
  const router = useRouter();

  // router.refresh() le pide al servidor la página de nuevo (con los datos
  // actuales de la base) y la actualiza sin recargar todo ni parpadear.
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (slugs.length < 2) return;

      const index = slugs.indexOf(currentSlug);
      const step = event.key === "ArrowRight" ? 1 : -1;
      // El % hace que dé la vuelta: después de la última vuelve a la primera.
      const next = slugs[(index + step + slugs.length) % slugs.length];
      router.push(`/tv/${next}`);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, slugs, currentSlug]);

  return null;
}
