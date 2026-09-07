import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "src/tests/mocks/server-only.ts"),
      "@": path.resolve(__dirname, "src")
    }
  }
});
