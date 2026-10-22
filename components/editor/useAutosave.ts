"use client";

// Hook de autoguardado: guarda `value` un rato después de que deja de cambiar.
//
// Cómo funciona ("debounce"):
//   el coach tipea → arranca un timer de `delay` ms
//   tipea de nuevo antes de que termine → el timer se cancela y arranca otro
//   deja de tipear → el timer termina → se guarda
// Así no mandamos un pedido por cada tecla.

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "pending" | "saving" | "error";

export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<boolean>,
  delay = 800,
) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  // Para "reintentar": cambiar este número vuelve a disparar el efecto.
  const [retryCount, setRetryCount] = useState(0);

  // useRef guarda un valor entre renders SIN provocar un re-render al cambiarlo.
  // lastSent = lo último que mandamos al servidor (como texto JSON, para comparar).
  // Arranca con el valor inicial: lo que vino de la base ya está guardado.
  const lastSent = useRef<string | null>(JSON.stringify(value));
  // Número de la última versión: si llega la respuesta de un guardado viejo
  // después de que hubo cambios nuevos, la ignoramos.
  const latestVersion = useRef(0);

  useEffect(() => {
    const serialized = JSON.stringify(value);
    if (serialized === lastSent.current) return; // nada nuevo para guardar

    setStatus("pending");
    const version = ++latestVersion.current;

    const timer = setTimeout(async () => {
      setStatus("saving");
      lastSent.current = serialized;
      const ok = await save(value);

      if (version !== latestVersion.current) return; // hubo cambios mientras guardaba
      if (ok) {
        setStatus("saved");
      } else {
        lastSent.current = null; // así el próximo intento vuelve a mandar
        setStatus("error");
      }
    }, delay);

    // Si `value` cambia antes de que termine el timer, React corre esta
    // limpieza: cancela el timer viejo (y el efecto arranca uno nuevo).
    return () => clearTimeout(timer);
  }, [value, save, delay, retryCount]);

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);

  // Avisa antes de cerrar la pestaña si quedan cambios sin guardar.
  useEffect(() => {
    if (status === "saved") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  return { status, retry };
}
