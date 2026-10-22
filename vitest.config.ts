import { defineConfig } from "vitest/config";
import path from "node:path";

// Vitest corre los tests de lógica pura (por ejemplo lib/notation.ts en la etapa 2).
// El alias "@" replica el de tsconfig.json para poder importar "@/lib/...".
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
