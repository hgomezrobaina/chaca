import { defineConfig, Options } from "tsup";

const shared: Options = {
  target: "es2020",
  sourcemap: true,
  dts: true,
  treeshake: true,
  splitting: false,
};

export default defineConfig([
  // Node.js library (default entry). Includes the filesystem-based export.
  // Each locale is its own entry, so `chaca/locale/es` builds (and tree-shakes)
  // separately from the rest of the package instead of always shipping inside it.
  {
    ...shared,
    entry: { index: "src/index.ts", "locale/en": "src/locales/en/index.ts" },
    outDir: "dist",
    format: ["cjs", "esm"],
    platform: "node",
    clean: true,
  },

  // Browser library. Resolved through the "browser" export condition. The
  // NodeFileWriter (fs + adm-zip) is unreachable from `src/browser.ts`, so it is
  // tree-shaken away and the bundle is free of any Node built-in.
  {
    ...shared,
    entry: {
      index: "src/browser.ts",
      "locale/en": "src/locales/en/index.ts",
    },
    outDir: "dist/browser",
    format: ["cjs", "esm"],
    platform: "browser",
    clean: false,
  },

  // CLI. Node only, keeps its shebang.
  {
    ...shared,
    entry: { "bin/chaca": "src/bin/chaca.ts" },
    outDir: "dist",
    format: ["cjs"],
    platform: "node",
    dts: false,
    clean: false,
  },
]);
