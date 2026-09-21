import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "lib/",
      "data/",
      "test/cli/",
      "test-report/",
      "coverage/",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,

  // Must stay last so it turns off every formatting rule that would fight
  // Prettier, and reports Prettier differences as ESLint errors.
  prettierRecommended,

  // This config file itself is ESM/JS, so the TypeScript import resolver below
  // does not apply to it and would report false "unresolved" errors.
  {
    files: ["**/*.mjs", "**/*.js", "**/*.mts", "**/*.cts"],
    rules: {
      "import/no-unresolved": "off",
    },
  },

  {
    files: ["**/*.ts"],
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      "no-duplicate-imports": "error",
      "import/no-unresolved": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "require-yield": "error",
      "no-console": "error",
      "require-await": "error",
      eqeqeq: "error",
    },
  },

  // El reporte de benchmarks es una herramienta de consola: imprimir es su
  // trabajo, no un olvido de depuración.
  {
    files: ["bench/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
);
