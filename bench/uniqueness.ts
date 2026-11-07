import { loadCompetitors } from "./competitors/load";
import {
  buildOperations,
  Library,
  type GeneratedValue,
  type Operation,
  type OperationCall,
} from "./competitors/operations";
import { loadChaca } from "./shared/load";
import { barTable, color, head, type Row } from "./shared/render";

/**
 * Qué porcentaje de las llamadas da un valor distinto, sobre el mismo número
 * de llamadas para las cuatro librerías. No depende de la máquina —a
 * diferencia del tiempo— así que una cifra congelada hoy sigue siendo cierta
 * mañana (design.md § «Alternativas contrastadas», la fila de unicidad).
 *
 * Mide `full-name`, `email`, `word` y `country`: las operaciones de
 * `bench/competitors/operations.ts` con un catálogo detrás de verdad. Un
 * `uuid` o un `boolean` no tienen catálogo que medir, así que no entran aquí.
 *
 * No es un `*.bench.ts`: no mide tiempo, así que no tiene nada que hacer en
 * el glob de `vitest bench`. Se corre con `pnpm bench:uniqueness [n]`
 * (10 000 llamadas por defecto).
 */

const OPERATION_KEYS = ["full-name", "email", "word", "country"];

const DEFAULT_CALLS = 10000;

function usage(): never {
  console.error(
    [
      "Uso: tsx bench/uniqueness.ts [n]",
      "",
      "  n   número de llamadas por librería (10000 por defecto)",
    ].join("\n"),
  );

  process.exit(1);
}

/** El porcentaje de valores distintos entre `calls` llamadas. */
async function uniquenessOf(
  call: OperationCall,
  calls: number,
): Promise<number> {
  const seen = new Set<GeneratedValue>();

  for (let i = 0; i < calls; i++) {
    seen.add(await call());
  }

  return (seen.size / calls) * 100;
}

interface CallsByLibrary {
  library: Library;
  call: OperationCall | null;
}

function callsOf(operation: Operation): CallsByLibrary[] {
  return [
    { library: Library.Chaca, call: operation.chaca },
    { library: Library.Faker, call: operation.competitors.faker },
    { library: Library.Chance, call: operation.competitors.chance },
    { library: Library.Falso, call: operation.competitors.falso },
  ];
}

async function measureOperation(
  operation: Operation,
  calls: number,
): Promise<void> {
  const rows: Row[] = [];
  const missing: Library[] = [];

  for (const { library, call } of callsOf(operation)) {
    if (call === null) {
      missing.push(library);
      continue;
    }

    const percent = await uniquenessOf(call, calls);

    rows.push({
      name: library,
      value: percent,
      text: `${percent.toFixed(2)} %`,
    });
  }

  head(`${operation.label.es} · ${calls.toLocaleString("es-ES")} llamadas`);
  barTable(rows);

  for (const library of missing) {
    console.log(color.dim(`   sin equivalente: ${library}`));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const raw = args[0];

  if (raw && raw.startsWith("--")) {
    usage();
  }

  const calls = raw ? Number(raw) : DEFAULT_CALLS;

  if (!Number.isInteger(calls) || calls < 2) {
    usage();
  }

  console.log(
    color.dim(
      ` midiendo unicidad sobre ${calls.toLocaleString("es-ES")} llamadas...\n`,
    ),
  );

  const chacaLib = await loadChaca();
  const competitors = await loadCompetitors();
  const operations = buildOperations({ chacaLib, competitors });

  for (const key of OPERATION_KEYS) {
    const operation = operations.find((candidate) => {
      return candidate.key === key;
    });

    if (!operation) {
      throw new Error(
        `No se encontró la operación '${key}' en buildOperations() — ¿cambió su clave?`,
      );
    }

    await measureOperation(operation, calls);
  }

  console.log("");
}

main();
