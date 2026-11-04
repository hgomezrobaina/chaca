import type { Extensions } from "../src/core/export/interfaces/export";
import { loadCompetitors } from "./competitors/load";
import { buildDocumentArrayCalls, Library } from "./competitors/operations";
import { loadChaca, TARGET } from "./shared/load";
import { heapOf } from "./shared/memory";
import { barTable, bytes, color, head, type Row } from "./shared/render";

/**
 * Cuánta memoria cuesta el mismo documento en las cuatro librerías, y cuánto
 * pesa exportarlo en cada formato — algo que sólo Chaca sabe hacer, porque
 * ninguno de los tres competidores tiene el concepto de exportar un dataset
 * (design.md § «Memoria y peso de la salida»).
 *
 * Reutiliza `document-array` de `bench/competitors/operations.ts`: el mismo
 * documento de cuatro campos que mide `bench/size.ts` para Chaca sola, aquí
 * repetido en las cuatro librerías.
 *
 * No es un `*.bench.ts`: no corre bajo `vitest bench`. Se corre con
 * `pnpm bench:competitors:size`.
 */

const DOCUMENTS = 5000;

const FORMATS: Extensions[] = [
  "json",
  "csv",
  "yaml",
  "typescript",
  "javascript",
  "java",
  "python",
  "postgresql",
  "mysql",
  "sqlite",
];

async function main(): Promise<void> {
  console.log(
    `\n ${color.bold("COMPETITORS SIZE")}  ·  chaca · ${color.cyan(TARGET)}  ·  node ${process.version}\n`,
  );

  const chacaLib = await loadChaca();
  const competitors = await loadCompetitors();
  const calls = buildDocumentArrayCalls({ chacaLib, competitors });

  head(`memoria · ${DOCUMENTS} documentos`);

  const heaps: Row[] = [
    {
      name: Library.Chaca,
      value: await heapOf(() => {
        return calls.chaca(DOCUMENTS);
      }),
    },
    {
      name: Library.Faker,
      value: await heapOf(() => {
        return calls.faker(DOCUMENTS);
      }),
    },
    {
      name: Library.Chance,
      value: await heapOf(() => {
        return calls.chance(DOCUMENTS);
      }),
    },
    {
      name: Library.Falso,
      value: await heapOf(() => {
        return calls.falso(DOCUMENTS);
      }),
    },
  ].map((row) => {
    return {
      ...row,
      text: bytes(row.value),
      extra: [`${bytes(row.value / DOCUMENTS)}/doc`],
    };
  });

  barTable(heaps);

  head(`salida · ${DOCUMENTS} documentos · sólo chaca`);
  console.log(
    color.dim(
      "   faker, chance y falso no tienen el concepto de exportar un dataset: generan valores, no archivos\n",
    ),
  );

  const { chaca } = chacaLib;
  const data = await calls.chaca(DOCUMENTS);

  const output: Row[] = FORMATS.map((format) => {
    const files = chaca.transform(data, { filename: "bench", format });
    const size = files.reduce((total, file) => {
      return total + Buffer.byteLength(file.content, "utf-8");
    }, 0);

    return {
      name: format,
      value: size,
      text: bytes(size),
      extra: [`${bytes(size / DOCUMENTS)}/doc`],
    };
  });

  barTable(output);

  console.log("");
}

main();
