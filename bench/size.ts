import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";
import { gzipSync } from "node:zlib";
import type { Extensions } from "../src/core/export/interfaces/export";
import { loadChaca, TARGET } from "./shared/load";
import { barTable, bytes, color, head } from "./shared/render";

/**
 * Lo que pesa chaca, en tres preguntas que el benchmark de tiempo no responde:
 * cuánta memoria cuesta un documento, cuánto ocupa cada formato de salida y
 * cuánto pesa lo que se publica.
 *
 * Se corre con `pnpm bench:size`.
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

/**
 * Sin recolector forzado, el delta de `heapUsed` mezcla la basura de la
 * medición anterior y da cifras que cambian según el orden de los casos. En vez
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

/** Heap que queda ocupado por los documentos, ya recogida la basura del camino. */
async function heapOf(generate: () => Promise<unknown>): Promise<number> {
  gc();
  const before = process.memoryUsage().heapUsed;
  const data = await generate();
  gc();
  const after = process.memoryUsage().heapUsed;

  // El `void data` de más abajo evita que V8 libere los documentos antes de
  // que se haya leído el heap.
  void data;

  return after - before;
}

async function main() {
  const { chaca, modules } = await loadChaca();

  const simple = chaca.schema({
    id: chaca.key(() => modules.id.uuid()),
    name: () => modules.person.fullName(),
    likes: () => modules.datatype.int({ min: 0, max: 500000 }),
    category: chaca.enum(["Horror", "War", "History", "Comedy"]),
  });

  const nested = chaca.schema({
    id: chaca.key(() => modules.id.uuid()),
    authors: {
      type: () => modules.person.fullName(),
      isArray: { min: 1, max: 3 },
    },
    address: {
      type: chaca.schema({
        country: () => modules.address.country(),
        zip: () => modules.address.zipCode(),
      }),
    },
  });

  console.log(
    `\n ${color.bold("SIZE")}  ·  chaca · ${color.cyan(TARGET)}  ·  node ${process.version}\n`,
  );

  head(`memoria · ${DOCUMENTS} documentos`);

  const memory = [
    { name: "schema plano", heap: await heapOf(() => simple.array(DOCUMENTS)) },
    {
      name: "schema anidado",
      heap: await heapOf(() => nested.array(DOCUMENTS)),
    },
  ];

  barTable(
    memory.map((m) => ({
      name: m.name,
      value: m.heap,
      text: bytes(m.heap),
      extra: [`${bytes(m.heap / DOCUMENTS)}/doc`],
    })),
  );

  head(`salida · ${DOCUMENTS} documentos`);

  const data = await simple.array(DOCUMENTS);

  const output = FORMATS.map((format) => {
    const files = chaca.transform(data, { filename: "bench", format });
    const size = files.reduce(
      (total, file) => total + Buffer.byteLength(file.content, "utf-8"),
      0,
    );

    return { name: format, size };
  });

  barTable(
    output.map((o) => ({
      name: o.name,
      value: o.size,
      text: bytes(o.size),
      extra: [`${bytes(o.size / DOCUMENTS)}/doc`],
    })),
  );

  head("bundles · dist/");

  const dist = resolve(__dirname, "..", "dist");

  const bundles = [
    { name: "node · cjs", file: "index.js" },
    { name: "node · esm", file: "index.mjs" },
    { name: "browser · cjs", file: join("browser", "index.js") },
    { name: "browser · esm", file: join("browser", "index.mjs") },
    { name: "cli", file: join("bin", "chaca.js") },
  ]
    .map((bundle) => {
      const path = join(dist, bundle.file);

      if (!existsSync(path)) {
        return undefined;
      }

      const content = readFileSync(path);

      return {
        name: bundle.name,
        size: content.byteLength,
        gzip: gzipSync(content).byteLength,
      };
    })
    .filter((b) => b !== undefined);

  if (bundles.length === 0) {
    console.log(
      color.yellow("  no hay dist/: corre 'pnpm build:lib' para medir esto\n"),
    );
  } else {
    barTable(
      bundles.map((b) => ({
        name: b.name,
        value: b.size,
        text: bytes(b.size),
        extra: [`${bytes(b.gzip)} gzip`],
      })),
    );

    console.log(
      color.dim(
        "\n el gzip es lo que descarga un navegador; el crudo es lo que ocupa en node_modules",
      ),
    );
  }

  console.log("");
}

main();
