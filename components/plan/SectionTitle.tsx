"use client";

// Título de la pantalla ("PERFORMANCE"), editable con el lápiz ✎.
// En modo edición también está el botón para eliminar la pantalla.

import { useState, useTransition } from "react";
import { deleteSection, renameSection } from "@/app/plan/actions";

interface SectionTitleProps {
  sectionId: string;
  name: string;
}

export function SectionTitle({ sectionId, name }: SectionTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  // useTransition: `pending` es true mientras corre la Server Action,
  // para deshabilitar los botones y no mandar dos veces.
  const [pending, startTransition] = useTransition();

  function startEditing() {
    setDraft(name);
    setError(null);
    setEditing(true);
  }

  function save() {
    if (draft.trim() === name) {
      setEditing(false); // no cambió nada: no hace falta ir al servidor
      return;
    }
    startTransition(async () => {
      const result = await renameSection(sectionId, draft);
      if (result.ok) setEditing(false);
      else setError(result.error);
    });
  }

  function remove() {
    const confirmed = window.confirm(
      `¿Eliminar la pantalla "${name}"?\n\nSe borran TODAS sus semanas y rutinas. No se puede deshacer.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      // Si sale bien, deleteSection redirige a /plan y este componente desaparece.
      const result = await deleteSection(sectionId);
      if (!result.ok) setError(result.error);
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide lg:text-4xl">{name}</h1>
        <button
          type="button"
          onClick={startEditing}
          className="rounded-md px-2 py-1 text-lg text-muted hover:bg-surface-2 hover:text-foreground"
          aria-label={`Renombrar ${name}`}
          title="Renombrar"
        >
          ✎
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          // autoFocus: el cursor ya queda en el campo al tocar el lápiz.
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          maxLength={40}
          disabled={pending}
          aria-label="Nombre de la pantalla"
          className="w-56 rounded-md border border-brand bg-surface-2 px-3 py-1.5 font-display text-2xl font-extrabold uppercase tracking-wide outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-md bg-brand px-3 py-2 text-sm font-bold text-brand-ink hover:bg-brand-strong disabled:opacity-60"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={pending}
          className="rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-md px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/15"
        >
          Eliminar pantalla
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
