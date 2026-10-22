"use client";

// Botón "Transmitir": manda la pizarra (/tv/<pantalla>) a una tele de la red.
//
// Cómo funciona: usamos la Presentation API del navegador. Al llamar a
// request.start(), el navegador abre SU lista de teles disponibles en la red
// (la misma del menú "Transmitir" de Chrome: Chromecast, Google TV y teles con
// Chromecast integrado). Una página web no puede escanear la red por su cuenta:
// los navegadores no lo permiten por seguridad.
//
// Si el navegador no tiene esta función (Safari, Firefox…) o no hay teles
// compatibles, mostramos una ayuda con las otras formas de llevarla a la tele.

import { useEffect, useRef, useState } from "react";
import { CastIcon } from "@/components/editor/icons";

// TypeScript no trae los tipos de la Presentation API: declaramos lo que usamos.
interface PresentationConnection extends EventTarget {
  state: "connecting" | "connected" | "closed" | "terminated";
  terminate(): void;
}
interface PresentationRequest {
  start(): Promise<PresentationConnection>;
}
type PresentationRequestConstructor = new (urls: string[]) => PresentationRequest;

/** Devuelve la Presentation API si el navegador la tiene, o null. */
function getPresentationRequest(): PresentationRequestConstructor | null {
  const api = (window as unknown as { PresentationRequest?: PresentationRequestConstructor }).PresentationRequest;
  return api ?? null;
}

type CastState = "idle" | "connecting" | "connected";

export function CastButton({ sectionSlug }: { sectionSlug: string }) {
  const [state, setState] = useState<CastState>("idle");
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // La conexión activa con la tele (para poder cortarla con "Detener").
  const connection = useRef<PresentationConnection | null>(null);

  // window solo existe en el navegador, así que la URL completa se calcula
  // después de montar (en el servidor no hay window).
  const [tvUrl, setTvUrl] = useState(`/tv/${sectionSlug}`);
  useEffect(() => setTvUrl(`${window.location.origin}/tv/${sectionSlug}`), [sectionSlug]);

  async function startCasting() {
    const Request = getPresentationRequest();
    if (!Request) {
      setHelpOpen(true);
      return;
    }

    setState("connecting");
    try {
      // Abre la lista de teles del navegador. Espera a que el usuario elija una.
      const conn = await new Request([tvUrl]).start();
      connection.current = conn;
      setState("connected");

      // Si la transmisión se corta (desde la tele, o se apagó), volvemos al estado inicial.
      const onEnd = () => {
        connection.current = null;
        setState("idle");
      };
      conn.addEventListener("close", onEnd);
      conn.addEventListener("terminate", onEnd);
    } catch (error) {
      setState("idle");
      // "AbortError" = el usuario cerró la lista sin elegir: no es un problema.
      // Cualquier otro error (por ejemplo "no se encontraron teles") → mostramos la ayuda.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setHelpOpen(true);
      }
    }
  }

  function stopCasting() {
    connection.current?.terminate();
    connection.current = null;
    setState("idle");
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso para el portapapeles: la URL igual está a la vista para copiarla a mano.
    }
  }

  return (
    <div className="relative">
      {state === "connected" ? (
        <button
          type="button"
          onClick={stopCasting}
          className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-bold text-brand-ink hover:bg-brand-strong"
        >
          <CastIcon className="size-4" />
          Transmitiendo · Detener
        </button>
      ) : (
        <button
          type="button"
          onClick={startCasting}
          disabled={state === "connecting"}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/10 disabled:opacity-60"
          title="Transmitir la pizarra a una tele de la red"
        >
          <CastIcon className="size-4" />
          {state === "connecting" ? "Buscando teles…" : "Transmitir"}
        </button>
      )}

      {helpOpen && (
        <div
          role="dialog"
          aria-label="Cómo llevar la pizarra a la tele"
          className="absolute right-0 z-20 mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-sm shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-bold uppercase">Llevar la pizarra a la tele</h3>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="rounded-md px-2 text-lg text-muted hover:bg-surface-2"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <p className="text-muted">
            Desde este navegador no se pudo transmitir directo. Probá alguna de estas opciones:
          </p>

          <ol className="flex list-decimal flex-col gap-2 pl-5">
            <li>
              <strong>Navegador de la tele</strong> (lo más estable): abrí esta dirección en la TV.
              <div className="mt-1.5 flex gap-1.5">
                <code className="min-w-0 flex-1 truncate rounded-md bg-surface-2 px-2 py-1.5">{tvUrl}</code>
                <button
                  type="button"
                  onClick={copyUrl}
                  className="rounded-md border border-line px-2 font-semibold hover:bg-surface-2"
                >
                  {copied ? "¡Copiada!" : "Copiar"}
                </button>
              </div>
            </li>
            <li>
              <strong>Chromecast / Google TV:</strong> abrí la dirección en Chrome, menú ⋮ →{" "}
              <em>Transmitir…</em> → elegí la tele.
            </li>
            <li>
              <strong>Samsung, LG u otras (desde Windows):</strong> apretá <kbd>Win</kbd> + <kbd>K</kbd>,
              elegí la tele y abrí la dirección en pantalla completa (F11).
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
