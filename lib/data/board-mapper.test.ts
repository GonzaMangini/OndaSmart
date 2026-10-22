import { describe, expect, it } from "vitest";
import { toDays, toSavePayload, type DayRow } from "./board-mapper";

describe("toDays", () => {
  it("ordena días, bloques y ejercicios por position y pasa a camelCase", () => {
    // Filas desordenadas a propósito, como pueden llegar de Postgres.
    const rows: DayRow[] = [
      { id: "dia-2", position: 1, label: null, blocks: [] },
      {
        id: "dia-1",
        position: 0,
        label: null,
        blocks: [
          {
            position: 1,
            kind: "main",
            rounds: 3,
            rounds_suffix: "R",
            rest: "1'30''",
            note: null,
            prescription_override: null,
            block_exercises: [{ position: 0, reps: "4", note: null, exercises: { name: "H.P. Clean" } }],
          },
          {
            position: 0,
            kind: "warmup",
            rounds: 3,
            rounds_suffix: "R",
            rest: "s/P",
            note: null,
            prescription_override: null,
            block_exercises: [
              { position: 1, reps: "30''", note: null, exercises: { name: "Superman" } },
              { position: 0, reps: "10", note: null, exercises: { name: "Bicho DBSO" } },
            ],
          },
        ],
      },
    ];

    const days = toDays(rows);

    expect(days.map((d) => d.id)).toEqual(["dia-1", "dia-2"]);
    expect(days[0].blocks.map((b) => b.kind)).toEqual(["warmup", "main"]);
    expect(days[0].blocks[0].exercises.map((e) => e.name)).toEqual(["Bicho DBSO", "Superman"]);
    expect(days[0].blocks[1]).toMatchObject({ roundsSuffix: "R", rest: "1'30''", prescriptionOverride: null });
  });
});

describe("toSavePayload", () => {
  it("pasa a snake_case y descarta campos extra (como las key de React)", () => {
    const blockFromEditor = {
      key: "abc",
      kind: "main" as const,
      rounds: 3,
      roundsSuffix: "",
      rest: "2'",
      note: null,
      prescriptionOverride: null,
      exercises: [{ key: "x", name: "H.P. Snatch", reps: "4-2-1", note: null }],
    };

    expect(toSavePayload([blockFromEditor])).toEqual([
      {
        kind: "main",
        rounds: 3,
        rounds_suffix: "",
        rest: "2'",
        note: null,
        prescription_override: null,
        exercises: [{ name: "H.P. Snatch", reps: "4-2-1", note: null }],
      },
    ]);
  });
});
