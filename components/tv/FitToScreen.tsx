"use client";

// Escala el contenido para que entre justo en la pantalla de la TV.
//
// El pizarrón de la TV se dibuja siempre sobre un "lienzo" de 1920 px de ancho
// (como una tele Full HD). Después lo agrandamos o achicamos con CSS
// (transform: scale) hasta que entre entero, a lo ancho y a lo alto:
//   · Tele que reporta 960 px de ancho → escala 0.5 (se ve igual, en chico).
//   · Día con muchos bloques, más alto que la pantalla → se achica hasta entrar.
// Así se ve igual en cualquier tele, sin barras de scroll.

import { useLayoutEffect, useRef, useState } from "react";

const DESIGN_WIDTH = 1920;

export function FitToScreen({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  // null = todavía no medimos: el contenido queda invisible para que no "salte".
  const [fit, setFit] = useState<{ scale: number; left: number; minHeight: number } | null>(null);

  // useLayoutEffect corre después de dibujar pero ANTES de que se vea en
  // pantalla: medimos y escalamos sin que se note el cambio.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const update = () => {
      const widthScale = window.innerWidth / DESIGN_WIDTH;
      // Alto de la pantalla medido en "px del lienzo" (1080 en una tele 16:9).
      // El contenido mide como mínimo eso: si hay pocos bloques, la pizarra
      // igual llega hasta abajo en vez de quedar un hueco negro.
      const minHeight = window.innerHeight / widthScale;
      // offsetHeight es la altura real del contenido (no la afecta el transform).
      const height = Math.max(content.offsetHeight, minHeight);
      const scale = Math.min(widthScale, window.innerHeight / height);
      // Si lo que limita es la altura, sobra lugar a los costados: centramos.
      const left = (window.innerWidth - DESIGN_WIDTH * scale) / 2;
      setFit({ scale, left, minHeight });
    };

    update();
    window.addEventListener("resize", update);

    // Si cambia el contenido (por ejemplo, después de una actualización
    // automática con más bloques), volvemos a medir. Algunos navegadores de
    // teles viejas no tienen ResizeObserver: ahí solo se mide al cargar.
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(content);

    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-board-tape">
      <div
        ref={contentRef}
        // flex-col: el hijo puede usar flex-1 para estirarse hasta minHeight.
        className="flex flex-col"
        style={{
          width: DESIGN_WIDTH,
          minHeight: fit?.minHeight,
          transformOrigin: "top left",
          transform: fit ? `translateX(${fit.left}px) scale(${fit.scale})` : undefined,
          visibility: fit ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
