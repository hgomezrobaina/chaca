import { barplot, bench, boxplot, do_not_optimize, run, summary } from "mitata";
import { loadChaca, TARGET } from "./shared/load";
import { color } from "./shared/render";

/**
 * Cómo escala la generación, con mitata en vez de `vitest bench`.
 *
 * Tinybench mide bien un caso suelto, pero para un barrido de tamaños hay que
 * escribir un `bench` por tamaño y la comparación que imprime no dice nada.
 * mitata acepta el barrido como argumento (`args`), dibuja la distribución de
 * cada caso (`boxplot`) y mide el coste del recolector de basura, que en algo
 * que crea cientos de miles de objetos es la mitad de la historia.
 *
 * El fichero **no** se llama `*.bench.ts` a propósito: ese glob es el de
 * `vitest bench`, que intentaría ejecutarlo y fallaría al no encontrar sus
 * `describe`. Se corre con `pnpm bench:scaling`.
 */

const SIZES = [100, 1000, 10000];

async function main() {
  const { chaca, modules } = await loadChaca();

  const simple = chaca.schema({
    id: chaca.key(() => modules.id.uuid()),
    name: () => modules.person.fullName(),
    likes: () => modules.datatype.int({ min: 0, max: 500000 }),
    category: chaca.enum(["Horror", "War", "History", "Comedy"]),
  });

  console.log(
    `\n ${color.bold("SCALING")}  ·  chaca · ${color.cyan(TARGET)}  ·  node ${process.version}\n`,
  );

  // Cuánto cuesta cada tamaño, y si la curva es la recta que debería ser.
  summary(() => {
    barplot(() => {
      bench("array($n)", function* (state: { get: (k: string) => number }) {
        const n = state.get("n");

        yield async () => do_not_optimize(await simple.array(n));
      })
        .args("n", SIZES)
        .gc("inner");
    });
  });

  // La forma de la distribución: si la caja es ancha, la media miente.
  boxplot(() => {
    bench("array(1000) · distribución", async () => {
      do_not_optimize(await simple.array(1000));
    }).gc("inner");
  });

  await run();

  console.log(
    color.dim(
      "\n gc('inner') mide con el recolector forzado entre muestras: el tiempo incluye recoger la basura del caso anterior\n",
    ),
  );
}

main();
