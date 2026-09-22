import { bench, describe } from "vitest";
import type { Extensions } from "../src/core/export/interfaces/export";
import { chaca, keep } from "./shared/lib";
import { EXPORT_DOCUMENTS, SIMPLE_SCHEMA } from "./shared/schemas";

/**
 * Los datos se generan una sola vez, fuera de la medición: `schema.transform()`
 * genera y serializa en la misma llamada, y la generación es tan cara que
 * taparía las diferencias entre formatos. `chaca.transform(data, ...)` recibe
 * los documentos ya hechos, así que lo que se mide aquí es el serializador.
 */
const DATA = await SIMPLE_SCHEMA.array(EXPORT_DOCUMENTS);

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

describe(`export · ${EXPORT_DOCUMENTS} documentos`, () => {
  for (const format of FORMATS) {
    bench(format, () => {
      keep(chaca.transform(DATA, { filename: "bench", format }));
    });
  }
});
