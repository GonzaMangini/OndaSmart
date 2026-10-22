// Notación del pizarrón: convierte los datos de un bloque en el encabezado que
// se escribe junto a la letra ("Ⓐ 4 Rounds c/2' P").
//
// Es el ÚNICO lugar donde vive el formato: lo usan la vista previa, el editor
// y (más adelante) la TV. Si mañana el pizarrón cambia de formato, se toca acá.
//
// Son funciones puras (mismo input → mismo output, sin efectos), por eso se
// testean fácil: ver notation.test.ts.

import type { Block, Day } from "./types";

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
 * Normaliza las comillas de tiempo mientras el coach escribe.
 * Los teclados del celular cambian solos ' por ’ y " por ”; el pizarrón usa
 * siempre ' para minutos y '' para segundos:
 *   "30”"  → "30''"      "1’30”" → "1'30''"      'a"b' → "a''b"
 */
export function normalizeQuotes(text: string): string {
  return text.replace(/[’‘´`]/g, "'").replace(/[”“"]/g, "''");
}

/** Pausas más usadas: aparecen como botones rápidos en el editor. */
export const REST_PRESETS = ["s/P", "30''", "45''", "1'", "1'30''", "2'", "3'"] as const;

/** Símbolos difíciles de tipear en el celular: botones rápidos para el campo de reps. */
export const REPS_SYMBOLS = ["''", "'", "/", "-", "x", " c/l"] as const;

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

/** Título de la columna: la etiqueta propia ("Pecho + Tríceps") o "Día N". */
export function dayTitle(day: Pick<Day, "position" | "label">): string {
  return clean(day.label) ?? `Día ${day.position + 1}`;
}

/** Rondas: 4 → "4 Rounds"; 1 → "1 Round". */
export function formatRounds(rounds: number | null): string | null {
  if (rounds === null || rounds <= 0) return null;
  return rounds === 1 ? "1 Round" : `${rounds} Rounds`;
}

/**
 * Pausa, como se escribe en el pizarrón ("c/" = con):
 *   "2'" → "c/2' P"      "1'30''" → "c/1'30'' P"
 * Si ya termina en P (como "s/P", sin pausa) va tal cual: "s/P" → "s/P".
 */
export function formatRest(rest: string | null): string | null {
  const value = clean(rest);
  if (!value) return null;
  return value.toUpperCase().endsWith("P") ? value : `c/${value} P`;
}

/**
 * Encabezado del bloque (lo que va junto a la letra, subrayado):
 *   rounds=4, rest="2'"                 → "4 Rounds c/2' P"
 *   rounds=3, rest="s/P"                → "3 Rounds s/P"
 *   prescriptionOverride="O.T.M. / 6R"  → "O.T.M. / 6R"
 * La nota del bloque NO va acá: el pizarrón la escribe aparte, en rojo.
 */
export function formatBlockHeading(block: Pick<Block, "rounds" | "rest" | "prescriptionOverride">): string {
  const override = clean(block.prescriptionOverride);
  if (override) return override;

  return joinParts([formatRounds(block.rounds), formatRest(block.rest)]);
}
