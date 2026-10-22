import { describe, expect, it } from "vitest";
import {
  blockLabels,
  dayTitle,
  formatBlockHeading,
  formatRest,
  formatRounds,
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

  it("el Día 3 del pizarrón de Performance llega hasta la G", () => {
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
  it("sin título muestra Día N (position arranca en 0)", () => {
    expect(dayTitle({ position: 0, label: null })).toBe("Día 1");
  });

  it("con título muestra el título", () => {
    expect(dayTitle({ position: 0, label: "Pecho + Tríceps" })).toBe("Pecho + Tríceps");
  });

  it("un título en blanco cuenta como vacío", () => {
    expect(dayTitle({ position: 2, label: "  " })).toBe("Día 3");
  });
});

describe("formatRounds", () => {
  it("plural y singular", () => {
    expect(formatRounds(4)).toBe("4 Rounds");
    expect(formatRounds(1)).toBe("1 Round");
  });

  it("sin rondas no muestra nada", () => {
    expect(formatRounds(null)).toBeNull();
    expect(formatRounds(0)).toBeNull();
  });
});

describe("formatRest", () => {
  it.each([
    ["2'", "c/2' P"],
    ["1'30''", "c/1'30'' P"],
    ["30''", "c/30'' P"],
  ])("%s → %s", (rest, expected) => {
    expect(formatRest(rest)).toBe(expected);
  });

  it("'s/P' (sin pausa) va tal cual", () => {
    expect(formatRest("s/P")).toBe("s/P");
  });

  it("vacío o null no muestra nada", () => {
    expect(formatRest(null)).toBeNull();
    expect(formatRest("  ")).toBeNull();
  });
});

describe("formatBlockHeading (casos del pizarrón de referencia)", () => {
  it("bloque A: 4 Rounds c/2' P", () => {
    expect(formatBlockHeading(block({ rounds: 4, rest: "2'" }))).toBe("4 Rounds c/2' P");
  });

  it("E/C: 3 Rounds c/2' P", () => {
    expect(formatBlockHeading(block({ kind: "warmup", rounds: 3, rest: "2'" }))).toBe("3 Rounds c/2' P");
  });

  it("sin pausa: 3 Rounds s/P", () => {
    expect(formatBlockHeading(block({ rounds: 3, rest: "s/P" }))).toBe("3 Rounds s/P");
  });

  it("bloque C con texto libre: O.T.M. / 6R", () => {
    expect(formatBlockHeading(block({ rounds: 3, rest: "1'", prescriptionOverride: "O.T.M. / 6R" }))).toBe(
      "O.T.M. / 6R",
    );
  });

  it("la nota del bloque no va en el encabezado (se escribe aparte, en rojo)", () => {
    expect(formatBlockHeading(block({ rounds: 4, rest: "2'", note: "Muy pesado!!!" }))).toBe("4 Rounds c/2' P");
  });

  it("un bloque sin nada cargado da texto vacío", () => {
    expect(formatBlockHeading(block())).toBe("");
  });
});
