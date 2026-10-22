// Notación del pizarrón: convierte los datos de un bloque en el texto que se
// escribe a la derecha del corchete ("x 3R (1' P)").
//
// Es el ÚNICO lugar donde vive el formato: lo usan la vista previa, el editor
// y (más adelante) la TV. Si mañana el pizarrón cambia de formato, se toca acá.
//
// Son funciones puras (mismo input → mismo output, sin efectos), por eso se
// testean fácil: ver notation.test.ts.

import type { Block, BlockExercise, Day } from "./types";

/** Limpia espacios y convierte "" en null, para tratar igual "vacío" y "no cargado". */
function clean(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  return trimmed ? trimmed : null;
}

/** Une las partes que tienen texto con un espacio, salteando las vacías. */
function joinParts(parts: (string | null)[]): string {
  return parts.filter((part): part is string => part !== null).join(" ");
}

/**
 * Etiqueta de cada bloque de un día, en el mismo orden que `blocks`.
 * Los warmup son "E/C"; el resto recibe letras según su orden: A, B, C…
 * Las letras no se guardan en la base: si se reordena o borra un bloque,
 * se recalculan solas.
 *
 * blockLabels([warmup, main, main]) → ["E/C", "A", "B"]
 */
export function blockLabels(blocks: Pick<Block, "kind">[]): string[] {
  let mainIndex = 0;
  return blocks.map((block) => {
    if (block.kind === "warmup") return "E/C";
    const index = mainIndex++;
    // 0 → "A" … 25 → "Z". Más de 26 bloques no pasa en la práctica,
    // pero por las dudas seguimos con números en vez de símbolos raros.
    return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
  });
}

/** Título de la columna: la etiqueta propia o "Día N". */
export function dayTitle(day: Pick<Day, "position" | "label">): string {
  return clean(day.label) ?? `Día ${day.position + 1}`;
}

/**
 * Pausa entre paréntesis: "1'" → "(1' P)".
 * Si ya termina en P (como "s/P", sin pausa) no se agrega otra: "s/P" → "(s/P)".
 */
export function formatRest(rest: string | null): string | null {
  const value = clean(rest);
  if (!value) return null;
  return value.toUpperCase().endsWith("P") ? `(${value})` : `(${value} P)`;
}

/** Rondas: 3 + "R" → "x 3R"; 3 + "" → "x 3". */
export function formatRounds(block: Pick<Block, "rounds" | "roundsSuffix">): string | null {
  if (block.rounds === null || block.rounds <= 0) return null;
  return `x ${block.rounds}${block.roundsSuffix.trim()}`;
}

/**
 * Prescripción completa del bloque (lo que va a la derecha del corchete):
 *   rounds=3, rest="1'"                      → "x 3R (1' P)"
 *   rounds=4, rest="1'", note="(liviano)"    → "x 4R (1' P) (liviano)"
 *   prescriptionOverride="AMRAP 12'"         → "AMRAP 12'"
 */
export function formatBlockPrescription(
  block: Pick<Block, "rounds" | "roundsSuffix" | "rest" | "note" | "prescriptionOverride">,
): string {
  const override = clean(block.prescriptionOverride);
  if (override) return override;

  return joinParts([formatRounds(block), formatRest(block.rest), clean(block.note)]);
}

/** Nombre del ejercicio con su nota: "RDL" + "(3:1)" → "RDL (3:1)". */
export function formatExerciseName(exercise: Pick<BlockExercise, "name" | "note">): string {
  return joinParts([clean(exercise.name), clean(exercise.note)]);
}

/**
 * ¿El bloque se escribe en una sola línea?
 * En el pizarrón, cuando un bloque tiene UN solo ejercicio, las reps y la
 * prescripción van juntas: "H.P. Clean ] 4 x 3R (1'30'' P)".
 */
export function isSingleLineBlock(block: Pick<Block, "exercises">): boolean {
  return block.exercises.length === 1;
}

/**
 * Texto a la derecha del corchete para un bloque de un solo ejercicio:
 * reps + prescripción.
 *   reps="4",     rounds=3, rest="1'30''"          → "4 x 3R (1'30'' P)"
 *   reps="4-2-1", rounds=3, suffix="", rest="2'"   → "4-2-1 x 3 (2' P)"
 */
export function formatSingleLine(block: Block): string {
  const reps = clean(block.exercises[0]?.reps);
  return joinParts([reps, clean(formatBlockPrescription(block))]);
}
