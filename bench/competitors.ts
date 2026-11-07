import { do_not_optimize, measure } from "mitata";
import { commitSha, isTreeClean, packageVersion } from "./shared/git";
import type { HistoryCase } from "./shared/history";
import { loadChaca, TARGET } from "./shared/load";
import { barTable, color, head, time, type Row } from "./shared/render";
import {
  snapshotExists,
  validateSnapshotName,
  writeSnapshot,
} from "./shared/snapshot";
import { competitorVersions, loadCompetitors } from "./competitors/load";
import {
  buildDocumentArrayCalls,
  buildOperations,
  buildRelationalDatasetCall,
  DOCUMENT_ARRAY_SIZES,
  Library,
  type Operation,
  type OperationCall,
} from "./competitors/operations";
import { relativeMarginOfError } from "./competitors/rme";
import type { CompetitorsSnapshot } from "./competitors/snapshot";

/**
 * Chaca contra `@faker-js/faker`, `chance` y `@ngneat/falso`, en las 17
 * operaciones de `bench/competitors/operations.ts`. No es un `*.bench.ts`:
 * ese glob lo recoge `vitest bench` y metería a tres librerías ajenas en el
 * baseline y el histórico de Chaca (`vitest.config.mts:10-12`). Se corre con
 * `pnpm bench:competitors`, igual que `bench/scaling.ts` no se llama
 * `scaling.bench.ts` por el mismo motivo.
 *
 * Mide con `measure()` de mitata en vez de `vitest bench`, caso por caso, y
 * guarda el resultado como un snapshot normal (`writeSnapshot`), con las
 * versiones exactas de los tres competidores.
 *
 * Uso:
 *   tsx bench/competitors.ts <nombre>
 *   tsx bench/competitors.ts <nombre> --force
 *
 * Las cifras que se publican se miden con `CHACA_BENCH_TARGET=dist`: ver
 * `bench/shared/load.ts` y design.md § «Cómo se cargan los competidores».
 */

function usage(): never {
  console.error(
    [
      "Uso: tsx bench/competitors.ts <nombre> [--force]",
      "",
      "  <nombre>    con qué se guarda el snapshot (letras, números, '.', '_', '-')",
      "  --force     sobrescribe si el nombre ya existe",
    ].join("\n"),
  );

  process.exit(1);
}

/** Mide una llamada con mitata, protegida contra la eliminación de código muerto. */
async function measureCall(call: OperationCall): Promise<HistoryCase> {
  const stats = await measure(async () => {
    do_not_optimize(await call());
  });

  return {
    mean: stats.avg / 1e6,
    hz: 1e9 / stats.avg,
    rme: relativeMarginOfError(stats.samples),
  };
}

/** Las entradas con llamada, listas para `barTable`; las que no tienen equivalente se avisan aparte. */
function toRows(entries: [Library, HistoryCase][]): Row[] {
  return entries.map(([library, measured]) => {
    return { name: library, value: measured.mean, text: time(measured.mean) };
  });
}

interface ReportMissingProps {
  label: string;
  missing: Library[];
}

function reportMissing({ label, missing }: ReportMissingProps): void {
  for (const library of missing) {
    console.log(color.dim(`   sin equivalente: ${library} (${label})`));
  }
}

async function measureOperation(
  operation: Operation,
): Promise<Record<string, HistoryCase>> {
  const calls: [Library, OperationCall | null][] = [
    [Library.Chaca, operation.chaca],
    [Library.Faker, operation.competitors.faker],
    [Library.Chance, operation.competitors.chance],
    [Library.Falso, operation.competitors.falso],
  ];

  const measured: [Library, HistoryCase][] = [];
  const missing: Library[] = [];

  for (const [library, call] of calls) {
    if (call === null) {
      missing.push(library);
      continue;
    }

    measured.push([library, await measureCall(call)]);
  }

  head(operation.label.es);
  barTable(toRows(measured));
  reportMissing({ label: operation.label.es, missing });

  const cases: Record<string, HistoryCase> = {};

  for (const [library, value] of measured) {
    cases[`bench/competitors.ts > competitors · ${operation.key}::${library}`] =
      value;
  }

  return cases;
}

async function measureDocumentArray(
  calls: ReturnType<typeof buildDocumentArrayCalls>,
): Promise<Record<string, HistoryCase>> {
  const cases: Record<string, HistoryCase> = {};

  for (const size of DOCUMENT_ARRAY_SIZES) {
    const callsByLibrary: [Library, OperationCall][] = [
      [Library.Chaca, () => calls.chaca(size)],
      [Library.Faker, () => calls.faker(size)],
      [Library.Chance, () => calls.chance(size)],
      [Library.Falso, () => calls.falso(size)],
    ];

    const perLibrary: [Library, HistoryCase][] = [];

    for (const [library, call] of callsByLibrary) {
      perLibrary.push([library, await measureCall(call)]);
    }

    head(`document-array · ${size} documentos`);
    barTable(toRows(perLibrary));

    for (const [library, value] of perLibrary) {
      cases[
        `bench/competitors.ts > competitors · document-array · ${size}::${library}`
      ] = value;
    }
  }

  return cases;
}

async function measureRelationalDataset(
  call: ReturnType<typeof buildRelationalDatasetCall>,
): Promise<Record<string, HistoryCase>> {
  const measured = await measureCall(call.chaca);

  head("relational-dataset (sin equivalente en faker, chance ni falso)");
  console.log(`   ${Library.Chaca} ${time(measured.mean)}`);

  return {
    [`bench/competitors.ts > competitors · relational-dataset::${Library.Chaca}`]:
      measured,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const name = args[0];

  if (!name || name.startsWith("--")) {
    usage();
  }

  validateSnapshotName(name);

  const force = args.includes("--force");

  if (snapshotExists(name) && !force) {
    console.error(
      `Ya existe bench/snapshots/${name}.json. Usa --force para sobrescribirlo, o elige otro nombre.`,
    );
    process.exit(1);
  }

  console.log(
    color.dim(
      ` midiendo chaca contra faker, chance y falso (target=${TARGET})...\n`,
    ),
  );

  const chacaLib = await loadChaca();
  const competitors = await loadCompetitors();
  const operations = buildOperations({ chacaLib, competitors });
  const documentArrayCalls = buildDocumentArrayCalls({ chacaLib, competitors });
  const relationalDatasetCall = buildRelationalDatasetCall({
    chacaLib,
    competitors,
  });

  let cases: Record<string, HistoryCase> = {};

  for (const operation of operations) {
    cases = { ...cases, ...(await measureOperation(operation)) };
  }

  cases = { ...cases, ...(await measureDocumentArray(documentArrayCalls)) };
  cases = {
    ...cases,
    ...(await measureRelationalDataset(relationalDatasetCall)),
  };

  const snapshot: CompetitorsSnapshot = {
    name,
    at: new Date().toISOString(),
    target: TARGET,
    node: process.version,
    platform: process.platform,
    version: packageVersion(),
    commit: commitSha(),
    dirty: !isTreeClean(),
    cases,
    competitors: competitorVersions(),
  };

  const file = writeSnapshot(snapshot);
  const caseCount = Object.keys(snapshot.cases).length;

  console.log(color.green(`\n Snapshot guardado: ${file}`));
  console.log(
    color.dim(
      ` ${caseCount} casos · chaca v${snapshot.version} · ${snapshot.commit}` +
        (snapshot.dirty ? " · árbol con cambios sin commitear" : "") +
        ` · faker ${snapshot.competitors.faker} · chance ${snapshot.competitors.chance} · falso ${snapshot.competitors.falso}\n`,
    ),
  );
}

main();
