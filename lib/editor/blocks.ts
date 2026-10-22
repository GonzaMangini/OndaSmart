// Operaciones del editor sobre la lista de bloques de un día.
//
// Todas son funciones puras e INMUTABLES: nunca modifican el array que reciben,
// devuelven uno nuevo. React necesita eso para darse cuenta de que algo cambió
// (compara referencias: si devolvés el mismo array modificado, no re-renderiza).

import type { Block, BlockExercise, BlockKind } from "@/lib/types";

// --- Tipos del editor -------------------------------------------------------
// Iguales a los de la app, más una `key`: un identificador estable que React
// usa para saber qué fila es cuál al agregar, borrar o reordenar.
// No se guarda en la base (toSavePayload la descarta).

export interface EditorExercise extends BlockExercise {
  key: string;
}

export interface EditorBlock extends Omit<Block, "exercises"> {
  key: string;
  exercises: EditorExercise[];
}

let keyCounter = 0;
/** Genera una key única dentro de la sesión del navegador. */
function newKey(): string {
  keyCounter += 1;
  return `k${keyCounter}`;
}

/** Bloques que llegan de la base → bloques del editor (con keys). */
export function toEditorBlocks(blocks: Block[]): EditorBlock[] {
  return blocks.map((block) => ({
    ...block,
    key: newKey(),
    exercises: block.exercises.map((exercise) => ({ ...exercise, key: newKey() })),
  }));
}

export function emptyExercise(): EditorExercise {
  return { key: newKey(), name: "", reps: "", note: "" };
}

/** Bloque nuevo: 3 rondas (lo más común en el pizarrón) y un renglón vacío para empezar a tipear. */
export function emptyBlock(kind: BlockKind): EditorBlock {
  return {
    key: newKey(),
    kind,
    rounds: 3,
    roundsSuffix: "R",
    rest: "",
    note: "",
    prescriptionOverride: null,
    exercises: [emptyExercise()],
  };
}

// --- Bloques ----------------------------------------------------------------

export function hasWarmup(blocks: EditorBlock[]): boolean {
  return blocks.some((block) => block.kind === "warmup");
}

/**
 * Agrega un bloque. El E/C va siempre primero (y solo puede haber uno);
 * los demás se agregan al final.
 */
export function addBlock(blocks: EditorBlock[], kind: BlockKind): EditorBlock[] {
  if (kind === "warmup") {
    if (hasWarmup(blocks)) return blocks;
    return [emptyBlock("warmup"), ...blocks];
  }
  return [...blocks, emptyBlock("main")];
}

export function removeBlock(blocks: EditorBlock[], blockKey: string): EditorBlock[] {
  return blocks.filter((block) => block.key !== blockKey);
}

/** Devuelve una copia del array con los elementos `from` y `to` intercambiados. */
function swap<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  [copy[from], copy[to]] = [copy[to], copy[from]];
  return copy;
}

export type Direction = "up" | "down";

/**
 * ¿Se puede mover este bloque? El E/C queda fijo arriba, y los bloques
 * normales no pueden pasar por encima del E/C.
 */
export function canMoveBlock(blocks: EditorBlock[], blockKey: string, direction: Direction): boolean {
  const index = blocks.findIndex((block) => block.key === blockKey);
  if (index === -1 || blocks[index].kind === "warmup") return false;

  const target = direction === "up" ? index - 1 : index + 1;
  return target >= 0 && target < blocks.length && blocks[target].kind !== "warmup";
}

/** Mueve un bloque un lugar arriba o abajo (las letras se recalculan solas). */
export function moveBlock(blocks: EditorBlock[], blockKey: string, direction: Direction): EditorBlock[] {
  if (!canMoveBlock(blocks, blockKey, direction)) return blocks;
  const index = blocks.findIndex((block) => block.key === blockKey);
  return swap(blocks, index, direction === "up" ? index - 1 : index + 1);
}

/**
 * Duplica un bloque y pone la copia justo debajo. La copia es siempre un
 * bloque normal (no puede haber dos E/C). Lleva keys nuevas para que React
 * la trate como filas distintas.
 */
export function duplicateBlock(blocks: EditorBlock[], blockKey: string): EditorBlock[] {
  const index = blocks.findIndex((block) => block.key === blockKey);
  if (index === -1) return blocks;

  const original = blocks[index];
  const copy: EditorBlock = {
    ...original,
    key: newKey(),
    kind: "main",
    exercises: original.exercises.map((exercise) => ({ ...exercise, key: newKey() })),
  };
  return [...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)];
}

/** Cambia algunos campos de un bloque (`patch` = solo los campos que cambian). */
export function updateBlock(
  blocks: EditorBlock[],
  blockKey: string,
  patch: Partial<Omit<EditorBlock, "key" | "exercises">>,
): EditorBlock[] {
  return blocks.map((block) => (block.key === blockKey ? { ...block, ...patch } : block));
}

// --- Ejercicios dentro de un bloque -----------------------------------------

/** Aplica `change` solo a los ejercicios del bloque indicado. */
function mapExercises(
  blocks: EditorBlock[],
  blockKey: string,
  change: (exercises: EditorExercise[]) => EditorExercise[],
): EditorBlock[] {
  return blocks.map((block) =>
    block.key === blockKey ? { ...block, exercises: change(block.exercises) } : block,
  );
}

export function addExercise(blocks: EditorBlock[], blockKey: string): EditorBlock[] {
  return mapExercises(blocks, blockKey, (exercises) => [...exercises, emptyExercise()]);
}

export function removeExercise(blocks: EditorBlock[], blockKey: string, exerciseKey: string): EditorBlock[] {
  return mapExercises(blocks, blockKey, (exercises) =>
    exercises.filter((exercise) => exercise.key !== exerciseKey),
  );
}

/** Mueve un ejercicio un lugar arriba o abajo dentro de su bloque. */
export function moveExercise(
  blocks: EditorBlock[],
  blockKey: string,
  exerciseKey: string,
  direction: Direction,
): EditorBlock[] {
  return mapExercises(blocks, blockKey, (exercises) => {
    const index = exercises.findIndex((exercise) => exercise.key === exerciseKey);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= exercises.length) return exercises;
    return swap(exercises, index, target);
  });
}

export function updateExercise(
  blocks: EditorBlock[],
  blockKey: string,
  exerciseKey: string,
  patch: Partial<Omit<EditorExercise, "key">>,
): EditorBlock[] {
  return mapExercises(blocks, blockKey, (exercises) =>
    exercises.map((exercise) => (exercise.key === exerciseKey ? { ...exercise, ...patch } : exercise)),
  );
}
