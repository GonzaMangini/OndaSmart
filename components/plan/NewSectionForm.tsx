"use client";

// Formulario para crear una pantalla nueva (nombre + cantidad de columnas).
// Se usa en dos lugares: el botón "+ Pantalla" de las pestañas (`compact`)
// y la página /plan cuando todavía no hay ninguna pantalla.

import { useActionState, useState } from "react";
import { createSection, type SectionFormState } from "@/app/plan/actions";

const initialState: SectionFormState = { error: null };

interface NewSectionFormProps {
  /** Semana que se estaba mirando: la pantalla nueva abre en esa misma semana. */
  week?: string;
  /** true = arranca como un botón "+ Pantalla" y se despliega al tocarlo. */
  compact?: boolean;
}

export function NewSectionForm({ week, compact = false }: NewSectionFormProps) {
  const [open, setOpen] = useState(!compact);
  const [state, formAction, pending] = useActionState(createSection, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/10"
      >
        + Pantalla
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-3"
    >
      {week && <input type="hidden" name="week" value={week} />}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">Nombre</span>
        <input
          name="name"
          autoFocus
          required
          maxLength={40}
          placeholder="ej. Fuerza"
          className="w-44 rounded-md border border-line bg-surface-2 px-3 py-2 text-base outline-none focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">Columnas (días)</span>
        <select
          name="columns"
          defaultValue="3"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 text-base outline-none focus:border-brand"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 font-bold text-brand-ink hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear"}
      </button>
      {compact && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          Cancelar
        </button>
      )}

      {state.error && (
        <p role="alert" className="w-full text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
