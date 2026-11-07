import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";

/**
 * Cuánta memoria cuesta generar algo, con el recolector forzado para que el
 * delta de `heapUsed` no mezcle la basura de la medición anterior. Lo
 * comparten `bench/size.ts` (los documentos de Chaca) y
 * `bench/competitors-size.ts` (los documentos de las cuatro librerías).
 *
 * Sin recolector forzado, el delta cambia según el orden de los casos. En vez
 * de exigir que se arranque node con `--expose-gc`, se enciende la bandera en
 * caliente: así el script funciona con un `tsx` pelado.
 */
function forceGc(): () => void {
  const existing = (globalThis as { gc?: () => void }).gc;

  if (typeof existing === "function") {
    return existing;
  }

  setFlagsFromString("--expose_gc");
  const fn = runInNewContext("gc") as () => void;
  setFlagsFromString("--no-expose_gc");

  return fn;
}

const gc = forceGc();

/** Heap que queda ocupado por lo generado, ya recogida la basura del camino. */
export async function heapOf<T>(
  generate: () => Promise<T> | T,
): Promise<number> {
  gc();
  const before = process.memoryUsage().heapUsed;
  const data = await generate();
  gc();
  const after = process.memoryUsage().heapUsed;

  // El `void data` de más abajo evita que V8 libere lo generado antes de que
  // se haya leído el heap.
  void data;

  return after - before;
}
