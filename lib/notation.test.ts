import { describe, expect, it } from "vitest";
import {
  blockLabels,
  dayTitle,
  formatBlockPrescription,
  formatExerciseName,
  formatRest,
  formatRounds,
  formatSingleLine,
  isSingleLineBlock,
  normalizeQuotes,
} from "./notation";
import type { Block } from "./types";

// Arma un bloque con valores por defecto, así cada test solo escribe lo que le importa.
function block(overrides: Partial<Block> = {}): Block {
  return {
    kind: "main",
    rounds: null,
    roundsSuffix: "R",
    rest: null,
    note: null,
    prescriptionOverride: null,
    exercises: [],
    ...overrides,
  };
}

describe("normalizeQuotes", () => {
  it.each([
    ["30”", "30''"], // comilla curva del celular
    ['30"', "30''"], // comilla doble común
    ["1’30”", "1'30''"],
    ["10’’/10’’", "10''/10''"],
    ["1'30''", "1'30''"], // lo que ya está bien no cambia
    ["4-2-1", "4-2-1"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeQuotes(input)).toBe(expected);
  });
});

describe("blockLabels", () => {
  it("el warmup es E/C y los demás van A, B, C… en orden", () => {
    const blocks = [{ kind: "warmup" }, { kind: "main" }, { kind: "main" }, { kind: "main" }] as const;
    expect(blockLabels([...blocks])).toEqual(["E/C", "A", "B", "C"]);
  });

  it("el Día 3 del pizarrón llega hasta la G", () => {
    const blocks = [{ kind: "warmup" as const }, ...Array(7).fill({ kind: "main" as const })];
    expect(blockLabels(blocks).at(-1)).toBe("G");
  });

  it("las letras no dependen del warmup: sin E/C arranca igual en A", () => {
    expect(blockLabels([{ kind: "main" }, { kind: "main" }])).toEqual(["A", "B"]);
  });

  it("pasado la Z sigue con números", () => {
    const labels = blockLabels(Array(27).fill({ kind: "main" }));
    expect(labels[25]).toBe("Z");
    expect(labels[26]).toBe("27");
  });
});

describe("dayTitle", () => {
  it("sin etiqueta muestra Día N (position arranca en 0)", () => {
    expect(dayTitle({ position: 0, label: null })).toBe("Día 1");
  });

  it("con etiqueta muestra la etiqueta", () => {
    expect(dayTitle({ position: 0, label: "Lun/Jue" })).toBe("Lun/Jue");
  });

  it("una etiqueta en blanco cuenta como vacía", () => {
    expect(dayTitle({ position: 2, label: "  " })).toBe("Día 3");
  });
});

describe("formatRest", () => {
  it.each([
    ["1'", "(1' P)"],
    ["2'", "(2' P)"],
    ["1'30''", "(1'30'' P)"],
    ["30''", "(30'' P)"],
  ])("%s → %s", (rest, expected) => {
    expect(formatRest(rest)).toBe(expected);
  });

  it("'s/P' (sin pausa) no lleva una P extra", () => {
    expect(formatRest("s/P")).toBe("(s/P)");
  });

  it("vacío o null no muestra nada", () => {
    expect(formatRest(null)).toBeNull();
    expect(formatRest("  ")).toBeNull();
  });
});

describe("formatRounds", () => {
  it("con sufijo R", () => {
    expect(formatRounds({ rounds: 3, roundsSuffix: "R" })).toBe("x 3R");
  });

  it("sin sufijo, como en 4-2-1 x 3", () => {
    expect(formatRounds({ rounds: 3, roundsSuffix: "" })).toBe("x 3");
  });

  it("sin rondas no muestra nada", () => {
    expect(formatRounds({ rounds: null, roundsSuffix: "R" })).toBeNull();
  });
});

describe("formatBlockPrescription (casos reales del pizarrón)", () => {
  it("Bloque A del Día 1: x 3R (1' P)", () => {
    expect(formatBlockPrescription(block({ rounds: 3, rest: "1'" }))).toBe("x 3R (1' P)");
  });

  it("E/C sin pausa: x 3R (s/P)", () => {
    expect(formatBlockPrescription(block({ rounds: 3, rest: "s/P" }))).toBe("x 3R (s/P)");
  });

  it("E/C del Día 2, sin pausa escrita: x 3R", () => {
    expect(formatBlockPrescription(block({ rounds: 3 }))).toBe("x 3R");
  });

  it("Split Jerk con nota: x 4R (1' P) (liviano)", () => {
    expect(formatBlockPrescription(block({ rounds: 4, rest: "1'", note: "(liviano)" }))).toBe(
      "x 4R (1' P) (liviano)",
    );
  });

  it("el texto libre (override) reemplaza todo lo demás", () => {
    expect(
      formatBlockPrescription(block({ rounds: 3, rest: "1'", prescriptionOverride: "AMRAP 12'" })),
    ).toBe("AMRAP 12'");
  });

  it("un bloque sin nada cargado da texto vacío", () => {
    expect(formatBlockPrescription(block())).toBe("");
  });
});

describe("formatExerciseName", () => {
  it("RDL con tempo: RDL (3:1)", () => {
    expect(formatExerciseName({ name: "RDL", note: "(3:1)" })).toBe("RDL (3:1)");
  });

  it("sin nota queda solo el nombre", () => {
    expect(formatExerciseName({ name: "H.P. Clean", note: null })).toBe("H.P. Clean");
  });
});

describe("bloques de un solo ejercicio (reps y prescripción en la misma línea)", () => {
  it("Bloque C del Día 1: H.P. Clean → 4 x 3R (1'30'' P)", () => {
    const c = block({
      rounds: 3,
      rest: "1'30''",
      exercises: [{ name: "H.P. Clean", reps: "4", note: null }],
    });
    expect(isSingleLineBlock(c)).toBe(true);
    expect(formatSingleLine(c)).toBe("4 x 3R (1'30'' P)");
  });

  it("Bloque D del Día 3: H.P. Snatch → 4-2-1 x 3 (2' P)", () => {
    const d = block({
      rounds: 3,
      roundsSuffix: "",
      rest: "2'",
      exercises: [{ name: "H.P. Snatch", reps: "4-2-1", note: null }],
    });
    expect(formatSingleLine(d)).toBe("4-2-1 x 3 (2' P)");
  });

  it("Bloque D del Día 1: Back Squats → 4 x 4R (2' P)", () => {
    const d = block({
      rounds: 4,
      rest: "2'",
      exercises: [{ name: "Back Squats", reps: "4", note: null }],
    });
    expect(formatSingleLine(d)).toBe("4 x 4R (2' P)");
  });

  it("un bloque con 2 ejercicios NO es de una línea", () => {
    const a = block({
      exercises: [
        { name: "Polos cortos + altos", reps: "20", note: null },
        { name: "Flex c/aplausos", reps: "4", note: null },
      ],
    });
    expect(isSingleLineBlock(a)).toBe(false);
  });
});
