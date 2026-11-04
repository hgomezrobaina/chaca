import { readFileSync } from "node:fs";

/**
 * De dónde se cargan las tres librerías contra las que se compara, y de dónde
 * sale su versión — hermano de `bench/shared/load.ts`, con la misma forma.
 *
 * La carga de cada librería es dinámica por el mismo motivo que `loadChaca()`:
 * este módulo lo usan tanto los scripts sueltos (`bench/competitors.ts`,
 * `bench/uniqueness.ts`, ejecutados por tsx como CommonJS) como las pruebas
 * unitarias (`test/bench/competitor-operations.test.ts`, ejecutadas por
 * vitest como ESM), y un `import()` dinámico funciona en los dos mundos — a
 * diferencia de un `import` estático de primer nivel, que sólo vale en uno.
 *
 * La versión se lee del propio `package.json` instalado, con `require.resolve`
 * más `readFileSync` — el mismo mecanismo que usa `packageVersion()` para la
 * versión de la propia Chaca en `bench/snapshot.ts`, nunca escrita a mano.
 */
import type { Faker } from "@faker-js/faker";
import type Chance from "chance";

type FalsoLib = typeof import("@ngneat/falso");

/**
 * `@types/chance@1.1.8` no declara `hex()`, aunque el runtime instalado
 * (`chance@1.1.13`) lo tiene (`node_modules/chance/chance.js`, método
 * `Chance.prototype.hex`). Es un hueco del paquete de tipos de la comunidad,
 * no de la librería, así que se completa aquí en vez de forzar `any`.
 */
interface ChanceHex {
  hex(options?: {
    min?: number;
    max?: number;
    casing?: "lower" | "upper";
  }): string;
}

export type ChanceLib = InstanceType<typeof Chance> & ChanceHex;

export interface CompetitorLibs {
  faker: Faker;
  chance: ChanceLib;
  falso: FalsoLib;
}

export interface CompetitorVersions {
  faker: string;
  chance: string;
  falso: string;
}

interface PackageJson {
  version: string;
}

function installedVersion(packageName: string): string {
  const entry = require.resolve(`${packageName}/package.json`);
  const pkg = JSON.parse(readFileSync(entry, "utf-8")) as PackageJson;

  return pkg.version;
}

export function competitorVersions(): CompetitorVersions {
  return {
    faker: installedVersion("@faker-js/faker"),
    chance: installedVersion("chance"),
    falso: installedVersion("@ngneat/falso"),
  };
}

export async function loadCompetitors(): Promise<CompetitorLibs> {
  const [fakerModule, chanceModule, falso] = await Promise.all([
    import("@faker-js/faker"),
    import("chance"),
    import("@ngneat/falso"),
  ]);

  // `hex()` existe en el runtime y no en `@types/chance@1.1.8` (ver `ChanceHex`
  // más arriba): el cast completa un tipo real con otro tipo real, no `any`.
  const chance = new chanceModule.Chance() as ChanceLib;

  return {
    faker: fakerModule.faker,
    chance,
    falso,
  };
}
