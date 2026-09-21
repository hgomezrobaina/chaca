import type { Chaca } from "../../src/Chaca";
import type { ChacaModules } from "../../src/modules";

/**
 * De dónde se carga la librería que se mide.
 *
 * `src` (por defecto) es lo cómodo para iterar: no hace falta construir antes
 * de medir un cambio. `dist` es lo que realmente instala el usuario —pasado por
 * el treeshake de tsup y bajado a `es2020`—, así que es el que vale para dar
 * cifras públicas. `CHACA_BENCH_TARGET=dist pnpm bench` lo cambia.
 */
export const TARGET =
  process.env.CHACA_BENCH_TARGET === "dist" ? "dist" : "src";

const ENTRY = TARGET === "dist" ? "../../dist/index.mjs" : "../../src/index";

export interface ChacaLib {
  chaca: Chaca;
  modules: ChacaModules;
}

/**
 * La carga es dinámica y no un `import` normal por dos razones: la entrada
 * depende del objetivo, y los scripts sueltos de esta carpeta (`size`,
 * `scaling`, `tests-report`) los ejecuta tsx como CommonJS, donde un
 * `await` de primer nivel no existe. Un `import()` dinámico sí funciona en
 * los dos mundos.
 */
export function loadChaca(): Promise<ChacaLib> {
  return import(/* @vite-ignore */ ENTRY) as Promise<ChacaLib>;
}
