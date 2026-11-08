import { existsSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

/**
 * E2E-6: the `chaca/locale/*` subpath resolves in the three built artifacts
 * that `package.json`'s `exports["./locale/*"]` can route to. Runs against
 * `dist/`, so it needs `npm run build:lib` beforehand (the standard
 * verification for packaging tasks already includes it).
 */
describe("locale subpath build artifacts (E2E-6)", () => {
  it("dist/locale/es.mjs (Node ESM) exports the Spanish locale", async () => {
    const mod = await import("../../dist/locale/es.mjs");

    expect(mod.es.code).toBe("es");
  });

  it("dist/locale/es.js (Node CJS) exports the Spanish locale", async () => {
    const mod = await import("../../dist/locale/es.js");

    expect(mod.es.code).toBe("es");
  });

  it("dist/browser/locale/es.mjs (browser ESM) exports the Spanish locale", async () => {
    const mod = await import("../../dist/browser/locale/es.mjs");

    expect(mod.es.code).toBe("es");
  });

  it("every build target ships the locale's type declarations", () => {
    const declarationFiles = [
      "dist/locale/es.d.ts",
      "dist/locale/en.d.ts",
      "dist/browser/locale/es.d.ts",
      "dist/browser/locale/en.d.ts",
    ];

    for (const file of declarationFiles) {
      expect(existsSync(resolve(__dirname, "../../", file))).toBe(true);
    }
  });
});
