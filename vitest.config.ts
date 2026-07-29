import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "lcov"],
      include: ["packages/*/src/**/*.ts"],
      exclude: [
        "**/dist/**",
        "**/node_modules/**",
        "**/*.d.ts",
        "tests/golden/**"
      ]
    }
  }
});