import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    testTimeout: 100000,
    outputFile: {
      html: "./test-report/index.html",
    },
    benchmark: {
      include: ["bench/**/*.bench.ts"],
      outputJson: "./bench/results/last.json",
    },
    coverage: {
      provider: "istanbul",
      reporter: ["json", "html"],
      exclude: ["src/bin/**"],
      include: ["src/**"],
    },
  },
});
