import { loadChaca } from "./load";

export { TARGET } from "./load";

/**
 * Atajo con `await` de primer nivel para los ficheros `*.bench.ts`, que
 * ejecuta vitest como ESM. Los scripts sueltos usan `loadChaca()` directamente.
 */
const lib = await loadChaca();

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
