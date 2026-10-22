import { describe, expect, it } from "vitest";
import { toDays, type DayRow } from "./board-mapper";

describe("toDays", () => {
  it("ordena días, bloques y ejercicios por position y pasa a camelCase", () => {
    // Filas desordenadas a propósito, como pueden llegar de Postgres.
    const rows: DayRow[] = [
      { position: 1, label: null, blocks: [] },
      {
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

    expect(days.map((d) => d.position)).toEqual([0, 1]);
    expect(days[0].blocks.map((b) => b.kind)).toEqual(["warmup", "main"]);
    expect(days[0].blocks[0].exercises.map((e) => e.name)).toEqual(["Bicho DBSO", "Superman"]);
    expect(days[0].blocks[1]).toMatchObject({ roundsSuffix: "R", rest: "1'30''", prescriptionOverride: null });
  });
});
