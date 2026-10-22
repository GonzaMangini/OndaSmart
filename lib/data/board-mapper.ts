// Convierte las filas que devuelve Supabase (snake_case, anidadas, sin orden
// garantizado) en los tipos de la app (lib/types.ts).
//
// Está separado de la consulta (board.ts) porque es lógica pura: se puede
// testear sin base de datos.

import type { Block, BlockKind, Day } from "../types";

// --- Forma de las filas tal como llegan de Supabase -------------------------
// Coinciden con el select de board.ts. Las relaciones "muchos a uno"
// (block_exercises → exercises) llegan como objeto; las "uno a muchos"
// (days → blocks) como array.

export interface BlockExerciseRow {
  position: number;
  reps: string | null;
  note: string | null;
  exercises: { name: string } | null;
}

export interface BlockRow {
  position: number;
  kind: BlockKind;
  rounds: number | null;
  rounds_suffix: string;
  rest: string | null;
  note: string | null;
  prescription_override: string | null;
  block_exercises: BlockExerciseRow[];
}

export interface DayRow {
  id: string;
  position: number;
  label: string | null;
  blocks: BlockRow[];
}

// --- Conversión -------------------------------------------------------------

/** Ordena una copia por `position` (Postgres no garantiza el orden de las filas anidadas). */
function byPosition<T extends { position: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

function toBlock(row: BlockRow): Block {
  return {
    kind: row.kind,
    rounds: row.rounds,
    roundsSuffix: row.rounds_suffix,
    rest: row.rest,
    note: row.note,
    prescriptionOverride: row.prescription_override,
    exercises: byPosition(row.block_exercises).map((exercise) => ({
      name: exercise.exercises?.name ?? "(ejercicio borrado)",
      reps: exercise.reps,
      note: exercise.note,
    })),
  };
}

export function toDays(rows: DayRow[]): Day[] {
  return byPosition(rows).map((day) => ({
    id: day.id,
    position: day.position,
    label: day.label,
    blocks: byPosition(day.blocks).map(toBlock),
  }));
}

// --- Conversión inversa: de la app a la base --------------------------------

/** Un bloque en el formato que espera la función SQL save_day (ver 0002_save_day.sql). */
export interface BlockPayload {
  kind: Block["kind"];
  rounds: number | null;
  rounds_suffix: string;
  rest: string | null;
  note: string | null;
  prescription_override: string | null;
  exercises: { name: string; reps: string | null; note: string | null }[];
}

/**
 * Bloques del editor → JSON para save_day. El orden del array ES el orden
 * en el pizarrón (save_day asigna position 0, 1, 2… según llegan).
 * Los campos de más que tenga el editor (como las `key` de React) se descartan.
 */
export function toSavePayload(blocks: Block[]): BlockPayload[] {
  return blocks.map((block) => ({
    kind: block.kind,
    rounds: block.rounds,
    rounds_suffix: block.roundsSuffix,
    rest: block.rest,
    note: block.note,
    prescription_override: block.prescriptionOverride,
    exercises: block.exercises.map((exercise) => ({
      name: exercise.name,
      reps: exercise.reps,
      note: exercise.note,
    })),
  }));
}
