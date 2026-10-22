"use client";

// Tarjeta para editar UN bloque: sus ejercicios y su prescripción.
//
// No guarda estado propio: recibe el bloque y avisa los cambios con callbacks
// (onChange, onExerciseChange…). El estado vive en DayEditor, que es quien
// autoguarda. Este patrón se llama "componente controlado".

import { formatBlockPrescription, formatSingleLine, isSingleLineBlock } from "@/lib/notation";
import type { EditorBlock, EditorExercise } from "@/lib/editor/blocks";

interface BlockCardProps {
  block: EditorBlock;
  /** "E/C", "A", "B"… (calculada por DayEditor según el orden). */
  label: string;
  onChange: (patch: Partial<Omit<EditorBlock, "key" | "exercises">>) => void;
  onRemove: () => void;
  onAddExercise: () => void;
  onExerciseChange: (exerciseKey: string, patch: Partial<Omit<EditorExercise, "key">>) => void;
  onRemoveExercise: (exerciseKey: string) => void;
}

// Estilo base de los campos. text-base (16px) evita que el iPhone haga zoom al tocar un input.
const inputClass =
  "w-full min-w-0 rounded-md border border-line bg-surface-2 px-3 py-2 text-base outline-none placeholder:text-muted/60 focus:border-brand";

export function BlockCard({
  block,
  label,
  onChange,
  onRemove,
  onAddExercise,
  onExerciseChange,
  onRemoveExercise,
}: BlockCardProps) {
  // Lo mismo que se va a ver en el pizarrón, calculado con lib/notation.ts.
  const preview = isSingleLineBlock(block) ? formatSingleLine(block) : formatBlockPrescription(block);
  const isWarmup = block.kind === "warmup";

  function handleRemove() {
    const hasContent = block.exercises.some((exercise) => exercise.name.trim());
    // confirm() muestra el cuadro nativo del navegador; solo preguntamos si hay algo para perder.
    if (!hasContent || window.confirm(`¿Borrar el bloque ${label}?`)) onRemove();
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
      {/* Encabezado: letra, cómo se ve y borrar */}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 shrink-0 items-center justify-center font-display text-lg font-extrabold text-brand ${
            isWarmup ? "px-1" : "w-9 rounded-full border-2 border-brand"
          }`}
        >
          {label}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-muted">
          {preview ? (
            <>
              Así se ve: <span className="font-semibold text-foreground">{preview}</span>
            </>
          ) : (
            "Completá rondas y pausa"
          )}
        </p>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-md px-2 py-1 text-sm font-semibold text-muted hover:bg-danger/15 hover:text-danger"
          aria-label={`Borrar bloque ${label}`}
        >
          Borrar
        </button>
      </div>

      {/* Ejercicios: nombre | reps | quitar, y debajo la nota opcional */}
      <ul className="flex flex-col gap-2">
        {block.exercises.map((exercise, index) => (
          <li key={exercise.key} className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.25rem] gap-1.5">
            <input
              className={inputClass}
              value={exercise.name}
              onChange={(e) => onExerciseChange(exercise.key, { name: e.target.value })}
              placeholder="Ejercicio"
              aria-label={`Ejercicio ${index + 1}`}
              autoCapitalize="words"
            />
            <input
              className={`${inputClass} text-center`}
              value={exercise.reps ?? ""}
              onChange={(e) => onExerciseChange(exercise.key, { reps: e.target.value })}
              placeholder="Reps"
              aria-label={`Reps del ejercicio ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => onRemoveExercise(exercise.key)}
              className="rounded-md text-xl leading-none text-muted hover:bg-danger/15 hover:text-danger"
              aria-label={`Quitar ejercicio ${index + 1}`}
            >
              ×
            </button>
            <input
              className="col-span-2 min-w-0 rounded-md border border-dashed border-line bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted/50 focus:border-brand"
              value={exercise.note ?? ""}
              onChange={(e) => onExerciseChange(exercise.key, { note: e.target.value })}
              placeholder="Nota (opcional): alter, (3:1)…"
              aria-label={`Nota del ejercicio ${index + 1}`}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAddExercise}
        className="self-start rounded-md px-2 py-1 text-sm font-semibold text-brand hover:bg-brand/10"
      >
        + Ejercicio
      </button>

      {/* Prescripción del bloque */}
      <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
        <RoundsStepper value={block.rounds} onChange={(rounds) => onChange({ rounds })} />

        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Pausa</span>
          <input
            className={inputClass}
            value={block.rest ?? ""}
            onChange={(e) => onChange({ rest: e.target.value })}
            placeholder="ej. 1'"
          />
        </label>

        <label className="flex min-w-32 flex-1 flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Nota del bloque</span>
          <input
            className={inputClass}
            value={block.note ?? ""}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="ej. (liviano)"
          />
        </label>
      </div>
    </article>
  );
}

/** Rondas con botones − y +. Bajar de 1 deja el campo vacío (sin rondas). */
function RoundsStepper({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const buttonClass =
    "flex size-10 items-center justify-center rounded-md bg-surface-2 text-xl font-bold hover:bg-line";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">Rondas</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(value && value > 1 ? value - 1 : null)}
          aria-label="Menos rondas"
        >
          −
        </button>
        <span className="w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">
          {value ?? "–"}
        </span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange((value ?? 0) + 1)}
          aria-label="Más rondas"
        >
          +
        </button>
      </div>
    </div>
  );
}
