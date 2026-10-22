import { describe, expect, it } from "vitest";
import {
  addBlock,
  addExercise,
  canMoveBlock,
  duplicateBlock,
  moveBlock,
  moveExercise,
  removeBlock,
  removeExercise,
  toEditorBlocks,
  updateBlock,
  updateExercise,
  type EditorBlock,
} from "./blocks";

// Un día con E/C y un bloque A con un ejercicio.
function sampleDay(): EditorBlock[] {
  return toEditorBlocks([
    {
      kind: "warmup",
      rounds: 3,
      roundsSuffix: "R",
      rest: "s/P",
      note: null,
      prescriptionOverride: null,
      exercises: [{ name: "Superman", reps: "30''", note: null }],
    },
    {
      kind: "main",
      rounds: 3,
      roundsSuffix: "R",
      rest: "1'",
      note: null,
      prescriptionOverride: null,
      exercises: [{ name: "H.P. Clean", reps: "4", note: null }],
    },
  ]);
}

describe("toEditorBlocks", () => {
  it("le da una key distinta a cada bloque y ejercicio", () => {
    const blocks = sampleDay();
    const keys = [...blocks.map((b) => b.key), ...blocks.flatMap((b) => b.exercises.map((e) => e.key))];
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("addBlock", () => {
  it("un bloque normal va al final, con 3 rondas y un renglón vacío", () => {
    const blocks = addBlock(sampleDay(), "main");
    expect(blocks).toHaveLength(3);
    expect(blocks[2]).toMatchObject({ kind: "main", rounds: 3, roundsSuffix: "R" });
    expect(blocks[2].exercises).toHaveLength(1);
  });

  it("el E/C va primero", () => {
    const withoutWarmup = sampleDay().slice(1);
    const blocks = addBlock(withoutWarmup, "warmup");
    expect(blocks.map((b) => b.kind)).toEqual(["warmup", "main"]);
  });

  it("no agrega un segundo E/C", () => {
    const day = sampleDay();
    expect(addBlock(day, "warmup")).toBe(day);
  });

  it("no modifica el array original (inmutable)", () => {
    const day = sampleDay();
    addBlock(day, "main");
    expect(day).toHaveLength(2);
  });
});

describe("removeBlock / updateBlock", () => {
  it("borra solo el bloque indicado", () => {
    const day = sampleDay();
    expect(removeBlock(day, day[0].key).map((b) => b.kind)).toEqual(["main"]);
  });

  it("cambia solo los campos indicados", () => {
    const day = sampleDay();
    const updated = updateBlock(day, day[1].key, { rounds: 4, rest: "2'" });
    expect(updated[1]).toMatchObject({ rounds: 4, rest: "2'", roundsSuffix: "R" });
    expect(updated[0]).toBe(day[0]); // los otros bloques quedan idénticos
  });
});

describe("moveBlock / canMoveBlock", () => {
  // E/C, A (H.P. Clean), B (nuevo)
  function threeBlocks() {
    return addBlock(sampleDay(), "main");
  }

  it("intercambia dos bloques normales", () => {
    const day = threeBlocks();
    const moved = moveBlock(day, day[2].key, "up");
    expect(moved.map((b) => b.key)).toEqual([day[0].key, day[2].key, day[1].key]);
  });

  it("un bloque normal no puede subir por encima del E/C", () => {
    const day = threeBlocks();
    expect(canMoveBlock(day, day[1].key, "up")).toBe(false);
    expect(moveBlock(day, day[1].key, "up")).toBe(day);
  });

  it("el E/C no se mueve", () => {
    const day = threeBlocks();
    expect(canMoveBlock(day, day[0].key, "down")).toBe(false);
  });

  it("el último no puede bajar", () => {
    const day = threeBlocks();
    expect(canMoveBlock(day, day[2].key, "down")).toBe(false);
  });
});

describe("duplicateBlock", () => {
  it("pone la copia justo debajo, con keys nuevas", () => {
    const day = sampleDay();
    const duplicated = duplicateBlock(day, day[1].key);
    expect(duplicated).toHaveLength(3);
    expect(duplicated[2].exercises[0].name).toBe("H.P. Clean");
    expect(duplicated[2].key).not.toBe(day[1].key);
    expect(duplicated[2].exercises[0].key).not.toBe(day[1].exercises[0].key);
  });

  it("duplicar el E/C crea un bloque normal (no puede haber dos E/C)", () => {
    const day = sampleDay();
    const duplicated = duplicateBlock(day, day[0].key);
    expect(duplicated.map((b) => b.kind)).toEqual(["warmup", "main", "main"]);
  });
});

describe("moveExercise", () => {
  it("intercambia ejercicios dentro del bloque y no se pasa de los bordes", () => {
    const day = sampleDay();
    const block = day[0]; // Superman
    const withTwo = addExercise(day, block.key);
    const [first, second] = withTwo[0].exercises;

    const moved = moveExercise(withTwo, block.key, second.key, "up");
    expect(moved[0].exercises.map((e) => e.key)).toEqual([second.key, first.key]);

    const unchanged = moveExercise(withTwo, block.key, first.key, "up");
    expect(unchanged[0].exercises.map((e) => e.key)).toEqual([first.key, second.key]);
  });
});

describe("ejercicios", () => {
  it("agrega un renglón vacío al bloque indicado", () => {
    const day = sampleDay();
    const updated = addExercise(day, day[1].key);
    expect(updated[1].exercises.map((e) => e.name)).toEqual(["H.P. Clean", ""]);
    expect(updated[0].exercises).toHaveLength(1);
  });

  it("edita y borra un renglón", () => {
    const day = sampleDay();
    const block = day[1];
    const exercise = block.exercises[0];

    const edited = updateExercise(day, block.key, exercise.key, { reps: "4-2-1" });
    expect(edited[1].exercises[0]).toMatchObject({ name: "H.P. Clean", reps: "4-2-1" });

    const removed = removeExercise(edited, block.key, exercise.key);
    expect(removed[1].exercises).toHaveLength(0);
  });
});
