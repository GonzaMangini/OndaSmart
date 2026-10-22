"use client";

// Editor de UN día (una columna del pizarrón).
//
// Acá vive el estado: el título del día y la lista de bloques. Cada cambio en
// una BlockCard actualiza esta lista, y useAutosave la manda a la base sola.

import { useCallback, useState } from "react";
import { saveDay, saveDayLabel } from "@/app/plan/actions";
import { BlockCard } from "./BlockCard";
import { useAutosave, type SaveStatus } from "./useAutosave";
import {
  addBlock,
  addExercise,
  canMoveBlock,
  duplicateBlock,
  hasWarmup,
  moveBlock,
  moveExercise,
  removeBlock,
  removeExercise,
  toEditorBlocks,
  updateBlock,
  updateExercise,
  type EditorBlock,
} from "@/lib/editor/blocks";
import { blockLabels } from "@/lib/notation";
import type { Day } from "@/lib/types";

/** Orden de "gravedad" de los estados: si uno de los dos guardados falla, se muestra el error. */
const STATUS_PRIORITY: SaveStatus[] = ["error", "saving", "pending", "saved"];

export function DayEditor({ day }: { day: Day }) {
  // Título del día ("Pecho + Tríceps"). Se guarda aparte de los bloques.
  const [label, setLabel] = useState(day.label ?? "");
  const saveLabel = useCallback(async (value: string) => (await saveDayLabel(day.id, value)).ok, [day.id]);
  const labelSave = useAutosave(label, saveLabel);

  // La función dentro de useState solo corre en el primer render:
  // convierte los bloques de la base en bloques del editor (con keys).
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => toEditorBlocks(day.blocks));

  // useCallback mantiene la misma función entre renders; si cambiara en cada
  // render, useAutosave lo tomaría como un cambio y reiniciaría el timer.
  const save = useCallback(
    async (value: EditorBlock[]) => (await saveDay(day.id, value)).ok,
    [day.id],
  );
  const blocksSave = useAutosave(blocks, save);

  // Un solo indicador para los dos guardados (título y bloques).
  const status = STATUS_PRIORITY.find((s) => s === labelSave.status || s === blocksSave.status) ?? "saved";
  const retry = () => {
    if (labelSave.status === "error") labelSave.retry();
    if (blocksSave.status === "error") blocksSave.retry();
  };

  const labels = blockLabels(blocks);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted">
          Día {day.position + 1}
        </h2>
        <SaveIndicator status={status} onRetry={retry} />
      </div>

      {/* Título de la columna en el pizarrón (va en rojo, arriba de todo). */}
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={60}
        placeholder="Título del día (ej. Pecho + Tríceps)"
        aria-label={`Título del día ${day.position + 1}`}
        className="rounded-xl border border-line bg-surface px-4 py-3 font-display text-xl font-bold uppercase tracking-wide outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-brand"
      />

      {blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
          Día vacío. Agregá la entrada en calor o el primer bloque.
        </p>
      )}

      {blocks.map((block, index) => (
        <BlockCard
          key={block.key}
          block={block}
          label={labels[index]}
          canMoveUp={canMoveBlock(blocks, block.key, "up")}
          canMoveDown={canMoveBlock(blocks, block.key, "down")}
          // `prev =>` usa siempre el estado más reciente, aunque haya varios cambios seguidos.
          onMove={(direction) => setBlocks((prev) => moveBlock(prev, block.key, direction))}
          onChange={(patch) => setBlocks((prev) => updateBlock(prev, block.key, patch))}
          onDuplicate={() => setBlocks((prev) => duplicateBlock(prev, block.key))}
          onRemove={() => setBlocks((prev) => removeBlock(prev, block.key))}
          onAddExercise={() => setBlocks((prev) => addExercise(prev, block.key))}
          onExerciseChange={(exerciseKey, patch) =>
            setBlocks((prev) => updateExercise(prev, block.key, exerciseKey, patch))
          }
          onMoveExercise={(exerciseKey, direction) =>
            setBlocks((prev) => moveExercise(prev, block.key, exerciseKey, direction))
          }
          onRemoveExercise={(exerciseKey) =>
            setBlocks((prev) => removeExercise(prev, block.key, exerciseKey))
          }
        />
      ))}

      <div className="flex gap-2">
        {!hasWarmup(blocks) && (
          <button
            type="button"
            onClick={() => setBlocks((prev) => addBlock(prev, "warmup"))}
            className="flex-1 rounded-xl border border-dashed border-line py-3 font-semibold text-muted hover:border-brand hover:text-brand"
          >
            + E/C
          </button>
        )}
        <button
          type="button"
          onClick={() => setBlocks((prev) => addBlock(prev, "main"))}
          className="flex-1 rounded-xl border border-dashed border-brand/60 py-3 font-semibold text-brand hover:bg-brand/10"
        >
          + Bloque
        </button>
      </div>
    </section>
  );
}

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-danger/15 px-2 py-1 text-sm font-semibold text-danger"
      >
        Error al guardar · Reintentar
      </button>
    );
  }

  const text = {
    saved: "Guardado ✓",
    pending: "Cambios sin guardar…",
    saving: "Guardando…",
  }[status];

  return (
    // aria-live: los lectores de pantalla anuncian cuando cambia el texto.
    <span className={`text-sm ${status === "saved" ? "text-muted" : "text-foreground"}`} aria-live="polite">
      {text}
    </span>
  );
}
