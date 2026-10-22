import { describe, expect, it } from "vitest";

// Test mínimo para comprobar que Vitest está bien configurado.
// Lo borramos en la etapa 2, cuando lleguen los tests de lib/notation.ts.
describe("setup", () => {
  it("vitest funciona", () => {
    expect(1 + 1).toBe(2);
  });
});
