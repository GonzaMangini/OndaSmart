import { describe, expect, it } from "vitest";
import {
  addDays,
  currentMonday,
  formatWeekRange,
  isMonday,
  isValidIsoDate,
  mondayOf,
  todayInGym,
} from "./dates";

describe("isValidIsoDate", () => {
  it("acepta fechas reales", () => {
    expect(isValidIsoDate("2026-10-19")).toBe(true);
  });

  it("rechaza formatos raros y fechas que no existen", () => {
    expect(isValidIsoDate("19-10-2026")).toBe(false);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("hola")).toBe(false);
  });
});

describe("addDays", () => {
  it("cruza fin de mes y de año", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
    expect(addDays("2026-10-19", -7)).toBe("2026-10-12");
  });
});

describe("mondayOf / isMonday", () => {
  it("cualquier día de la semana da el lunes de esa semana", () => {
    expect(mondayOf("2026-10-19")).toBe("2026-10-19"); // lunes
    expect(mondayOf("2026-10-22")).toBe("2026-10-19"); // jueves
    expect(mondayOf("2026-10-25")).toBe("2026-10-19"); // domingo: sigue siendo la misma semana
  });

  it("isMonday", () => {
    expect(isMonday("2026-10-19")).toBe(true);
    expect(isMonday("2026-10-20")).toBe(false);
  });
});

describe("todayInGym / currentMonday (zona horaria Argentina)", () => {
  it("domingo 23:30 en Argentina ya es lunes en UTC, pero para el gimnasio sigue siendo domingo", () => {
    // 2026-10-26 02:30 UTC = domingo 25/10 23:30 en Argentina (UTC-3).
    const now = new Date("2026-10-26T02:30:00Z");
    expect(todayInGym(now)).toBe("2026-10-25");
    expect(currentMonday(now)).toBe("2026-10-19");
  });
});

describe("formatWeekRange", () => {
  it("semana dentro del mismo mes", () => {
    expect(formatWeekRange("2026-10-19")).toBe("19 – 25 oct 2026");
  });

  it("semana que cruza de mes", () => {
    expect(formatWeekRange("2026-09-28")).toBe("28 sep – 4 oct 2026");
  });
});
