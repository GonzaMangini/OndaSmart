"use client";

// Tarjeta para editar UN bloque: sus ejercicios y su prescripción.
//
// No guarda los datos del bloque: los recibe y avisa los cambios con callbacks
// (onChange, onExerciseChange…). El estado vive en DayEditor, que es quien
// autoguarda. Este patrón se llama "componente controlado".
// Lo único que guarda es estado de la interfaz (si el menú está abierto, qué
// campo de reps tiene el foco).

import { useEffect, useRef, useState } from "react";
import {
  REPS_SYMBOLS,
  REST_PRESETS,
  formatBlockPrescription,
  formatSingleLine,
  isSingleLineBlock,
  normalizeQuotes,
} from "@/lib/notation";
import type { Direction, EditorBlock, EditorExercise } from "@/lib/editor/blocks";
import { ArrowDownIcon, ArrowUpIcon, MoreIcon } from "./icons";

interface BlockCardProps {
  block: EditorBlock;
  /** "E/C", "A", "B"… (calculada por DayEditor según el orden). */
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: Direction) => void;
  onChange: (patch: Partial<Omit<EditorBlock, "key" | "exercises">>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onAddExercise: () => void;
  onExerciseChange: (exerciseKey: string, patch: Partial<Omit<EditorExercise, "key">>) => void;
  onMoveExercise: (exerciseKey: string, direction: Direction) => void;
  onRemoveExercise: (exerciseKey: string) => void;
}

// Estilo base de los campos (sin ancho: cada uso agrega el suyo).
// text-base (16px) evita que el iPhone haga zoom al tocar un input.
const fieldClass =
  "min-w-0 rounded-md border border-line bg-surface-2 px-3 py-2 text-base outline-none placeholder:text-muted/60 focus:border-brand";
const inputClass = `w-full ${fieldClass}`;

const iconButtonClass =
  "flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-25 disabled:hover:bg-transparent";

// Botón "chip" (pausas y símbolos). `active` lo pinta de verde.
const chipClass = (active = false) =>
  `rounded-md border px-2.5 py-1.5 text-sm font-semibold tabular-nums ${
    active ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface-2 hover:border-brand"
  }`;

export function BlockCard({
  block,
  label,
  canMoveUp,
  canMoveDown,
  onMove,
  onChange,
  onDuplicate,
  onRemove,
  onAddExercise,
  onExerciseChange,
  onMoveExercise,
  onRemoveExercise,
}: BlockCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Ejercicio cuyo campo de reps tiene el foco: debajo de él se muestran los símbolos.
  const [focusedReps, setFocusedReps] = useState<string | null>(null);

  // Referencias a los inputs (por "key:campo"), para mover el foco con Enter
  // y para insertar símbolos donde está el cursor.
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const registerInput = (id: string) => (element: HTMLInputElement | null) => {
    if (element) inputs.current.set(id, element);
    else inputs.current.delete(id);
  };

  // Al apretar Enter en las reps del último renglón se agrega uno nuevo; cuando
  // React lo dibuja, este efecto le pone el foco al nombre.
  const focusNewRow = useRef(false);
  useEffect(() => {
    if (!focusNewRow.current) return;
    focusNewRow.current = false;
    const last = block.exercises.at(-1);
    if (last) inputs.current.get(`${last.key}:name`)?.focus();
  }, [block.exercises]);

  // Lo mismo que se va a ver en el pizarrón, calculado con lib/notation.ts.
  const preview = isSingleLineBlock(block) ? formatSingleLine(block) : formatBlockPrescription(block);
  const isWarmup = block.kind === "warmup";
  const freeText = block.prescriptionOverride !== null;

  function handleRemove() {
    setMenuOpen(false);
    const hasContent = block.exercises.some((exercise) => exercise.name.trim());
    // confirm() muestra el cuadro nativo del navegador; solo preguntamos si hay algo para perder.
    if (!hasContent || window.confirm(`¿Borrar el bloque ${label}?`)) onRemove();
  }

  /** Enter en el nombre → va a las reps. Enter en las reps → siguiente renglón (o uno nuevo). */
  function handleEnter(event: React.KeyboardEvent<HTMLInputElement>, index: number, field: "name" | "reps") {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const exercise = block.exercises[index];

    if (field === "name") {
      inputs.current.get(`${exercise.key}:reps`)?.focus();
      return;
    }
    const next = block.exercises[index + 1];
    if (next) {
      inputs.current.get(`${next.key}:name`)?.focus();
    } else {
      focusNewRow.current = true;
      onAddExercise();
    }
  }

  /** Inserta un símbolo en el campo de reps, donde está el cursor. */
  function insertSymbol(exercise: EditorExercise, symbol: string) {
    const input = inputs.current.get(`${exercise.key}:reps`);
    const value = exercise.reps ?? "";
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;

    onExerciseChange(exercise.key, { reps: value.slice(0, start) + symbol + value.slice(end) });

    // Después de que React actualice el valor, dejamos el cursor después del símbolo.
    const caret = start + symbol.length;
    requestAnimationFrame(() => input?.setSelectionRange(caret, caret));
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
      {/* Encabezado: letra, cómo se ve, mover y menú */}
      <div className="flex items-center gap-2">
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
        {!isWarmup && (
          <>
            <button type="button" className={iconButtonClass} disabled={!canMoveUp} onClick={() => onMove("up")} aria-label={`Subir bloque ${label}`}>
              <ArrowUpIcon />
            </button>
            <button type="button" className={iconButtonClass} disabled={!canMoveDown} onClick={() => onMove("down")} aria-label={`Bajar bloque ${label}`}>
              <ArrowDownIcon />
            </button>
          </>
        )}
        <button
          type="button"
          className={iconButtonClass}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={`Más opciones del bloque ${label}`}
        >
          <MoreIcon />
        </button>
      </div>

      {/* Menú del bloque (se despliega debajo del encabezado) */}
      {menuOpen && (
        <div className="flex flex-wrap gap-2 rounded-lg bg-surface-2 p-2">
          <button
            type="button"
            className={chipClass()}
            onClick={() => {
              onDuplicate();
              setMenuOpen(false);
            }}
          >
            Duplicar bloque
          </button>
          <button
            type="button"
            className={chipClass(freeText)}
            onClick={() => {
              // Al activar el texto libre arrancamos con lo que se ve hoy, para editar desde ahí.
              onChange({ prescriptionOverride: freeText ? null : formatBlockPrescription(block) });
              setMenuOpen(false);
            }}
          >
            {freeText ? "Usar rondas y pausa" : "Texto libre"}
          </button>
          <button
            type="button"
            className="rounded-md border border-danger/40 px-2.5 py-1.5 text-sm font-semibold text-danger hover:bg-danger/15"
            onClick={handleRemove}
          >
            Borrar bloque
          </button>
        </div>
      )}

      {/* Ejercicios: nombre | reps | quitar; debajo, nota y "subir" */}
      <ul className="flex flex-col gap-2">
        {block.exercises.map((exercise, index) => (
          <li key={exercise.key} className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.25rem] gap-1.5">
            <input
              ref={registerInput(`${exercise.key}:name`)}
              className={inputClass}
              value={exercise.name}
              onChange={(e) => onExerciseChange(exercise.key, { name: e.target.value })}
              onKeyDown={(e) => handleEnter(e, index, "name")}
              placeholder="Ejercicio"
              aria-label={`Ejercicio ${index + 1}`}
              autoCapitalize="words"
              enterKeyHint="next"
            />
            <input
              ref={registerInput(`${exercise.key}:reps`)}
              className={`${inputClass} text-center`}
              value={exercise.reps ?? ""}
              onChange={(e) => onExerciseChange(exercise.key, { reps: normalizeQuotes(e.target.value) })}
              onKeyDown={(e) => handleEnter(e, index, "reps")}
              onFocus={() => setFocusedReps(exercise.key)}
              onBlur={() => setFocusedReps((current) => (current === exercise.key ? null : current))}
              placeholder="Reps"
              aria-label={`Reps del ejercicio ${index + 1}`}
              autoComplete="off"
              enterKeyHint="next"
            />
            <button
              type="button"
              onClick={() => onRemoveExercise(exercise.key)}
              className="rounded-md text-xl leading-none text-muted hover:bg-danger/15 hover:text-danger"
              aria-label={`Quitar ejercicio ${index + 1}`}
            >
              ×
            </button>

            {/* Símbolos rápidos: solo mientras se escriben las reps de este renglón. */}
            {focusedReps === exercise.key && (
              <div className="col-span-3 flex flex-wrap justify-end gap-1.5">
                {REPS_SYMBOLS.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    className={chipClass()}
                    // preventDefault en pointerdown: el input NO pierde el foco (ni se cierra el teclado).
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => insertSymbol(exercise, symbol)}
                  >
                    {symbol.trim()}
                  </button>
                ))}
              </div>
            )}

            <input
              className="col-span-2 min-w-0 rounded-md border border-dashed border-line bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted/50 focus:border-brand"
              value={exercise.note ?? ""}
              onChange={(e) => onExerciseChange(exercise.key, { note: normalizeQuotes(e.target.value) })}
              placeholder="Nota (opcional): alter, (3:1)…"
              aria-label={`Nota del ejercicio ${index + 1}`}
            />
            {/* Solo "subir": alcanza para ordenar cualquier lista y ocupa menos lugar. */}
            {index > 0 ? (
              <button
                type="button"
                onClick={() => onMoveExercise(exercise.key, "up")}
                className="flex items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground"
                aria-label={`Subir ejercicio ${index + 1}`}
              >
                <ArrowUpIcon className="size-4" />
              </button>
            ) : (
              <span />
            )}
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
      <div className="flex flex-col gap-3 border-t border-line pt-3">
        {freeText ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">Texto libre (se muestra tal cual)</span>
            <input
              className={inputClass}
              value={block.prescriptionOverride ?? ""}
              onChange={(e) => onChange({ prescriptionOverride: normalizeQuotes(e.target.value) })}
              placeholder="ej. AMRAP 12'"
            />
          </label>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <RoundsStepper value={block.rounds} onChange={(rounds) => onChange({ rounds })} />
              {/* La "R" de "x 3R". Apagada → "x 3", como en 4-2-1 x 3. */}
              <button
                type="button"
                aria-pressed={block.roundsSuffix === "R"}
                onClick={() => onChange({ roundsSuffix: block.roundsSuffix === "R" ? "" : "R" })}
                className={`h-10 ${chipClass(block.roundsSuffix === "R")}`}
                title='Mostrar la "R" de rondas'
              >
                R
              </button>

              <label className="flex min-w-32 flex-1 flex-col gap-1">
                <span className="text-xs font-semibold text-muted">Nota del bloque</span>
                <input
                  className={inputClass}
                  value={block.note ?? ""}
                  onChange={(e) => onChange({ note: normalizeQuotes(e.target.value) })}
                  placeholder="ej. (liviano)"
                />
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Pausa</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {REST_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={chipClass(block.rest === preset)}
                    // Tocar la pausa elegida la quita.
                    onClick={() => onChange({ rest: block.rest === preset ? "" : preset })}
                  >
                    {preset}
                  </button>
                ))}
                <input
                  className={`${fieldClass} w-20 py-1.5 text-center`}
                  value={block.rest ?? ""}
                  onChange={(e) => onChange({ rest: normalizeQuotes(e.target.value) })}
                  placeholder="otra"
                  aria-label="Otra pausa"
                />
              </div>
            </div>
          </>
        )}
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
