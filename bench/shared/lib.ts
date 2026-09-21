import type { Chaca } from "../../src/Chaca";
import type { ChacaModules } from "../../src/modules";

/**
 * De dónde se carga la librería que se mide.
 *
 * `src` (por defecto) es lo cómodo para iterar: no hace falta construir antes
 * de medir un cambio. `dist` es lo que realmente instala el usuario —pasado por
 * el treeshake de tsup y bajado a `es2020`—, así que es el que vale para dar
 * cifras públicas. `CHACA_BENCH_TARGET=dist npm run bench` lo cambia.
 */
export const TARGET =
  process.env.CHACA_BENCH_TARGET === "dist" ? "dist" : "src";

const entry = TARGET === "dist" ? "../../dist/index.mjs" : "../../src/index";

const lib = (await import(/* @vite-ignore */ entry)) as {
  chaca: Chaca;
  modules: ChacaModules;
};

export const chaca = lib.chaca;
export const modules = lib.modules;

/**
 * V8 elimina el código cuyo resultado nadie usa: sin esto, medir
 * `modules.id.uuid()` puede acabar midiendo una función vacía. Guardar el valor
 * en un objeto exportado y mutable impide esa optimización.
 */
export const sink: { value: unknown } = { value: undefined };

export function keep<T>(value: T): T {
  sink.value = value;
  return value;
}
