import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { compareMeasured, deltaText } from "./shared/delta";
import type { HistoryCase } from "./shared/history";
import { BAR_WIDTH, bar, color, time } from "./shared/render";
import { parseCaseKey } from "./shared/report";
import { listSnapshots, readSnapshot, type Snapshot } from "./shared/snapshot";

/**
 * Compara dos snapshots congelados por `bench/snapshot.ts` — el "antes" y el
 * "después" de un cambio, con nombre — y opcionalmente deja un JSON
 * normalizado para que lo consuma otra herramienta (hoy, la composición de
 * Remotion que dibuja las imágenes del changelog o de un artículo).
 *
 * Se niega a comparar dos snapshots que no compartan `target` o `platform`:
 * un tiempo medido en `dist` no es comparable con uno medido en `src`, y uno
 * medido en otra máquina tampoco (ver `shared/snapshot.ts`).
 *
 * Uso:
 *   tsx bench/compare.ts <antes> <después>
 *   tsx bench/compare.ts <antes> <después> --json <fichero>
 */

function usage(): never {
  console.error(
    [
      "Uso: tsx bench/compare.ts <antes> <después> [--json <fichero>]",
      "",
      "  <antes>, <después>   nombres de snapshots en bench/snapshots/",
      "  --json <fichero>     además, escribe el resultado normalizado ahí",
    ].join("\n"),
  );

  process.exit(1);
}

function loadOrExit(name: string): Snapshot {
  const snapshot = readSnapshot(name);

  if (snapshot) {
    return snapshot;
  }

  const available = listSnapshots();

  console.error(`No existe el snapshot '${name}'.`);
  console.error(
    available.length > 0
      ? `Snapshots disponibles: ${available.join(", ")}`
      : "No hay ningún snapshot todavía — usa 'pnpm bench:snapshot <nombre>' para crear uno.",
  );

  process.exit(1);
}

interface CaseComparison {
  key: string;
  title: string;
  name: string;
  before: HistoryCase | null;
  after: HistoryCase | null;
  /** `null` cuando el caso sólo existe en uno de los dos snapshots. */
  changePercent: number | null;
  significant: boolean | null;
}

interface CompareSide {
  name: string;
  version: string;
  commit: string;
  ref?: string;
}

interface CompareOutput {
  before: CompareSide;
  after: CompareSide;
  target: string;
  platform: string;
  cases: CaseComparison[];
}

function summarize(snapshot: Snapshot): CompareSide {
  return {
    name: snapshot.name,
    version: snapshot.version,
    commit: snapshot.commit,
    ...(snapshot.ref ? { ref: snapshot.ref } : {}),
  };
}

/**
 * Un caso por clave, en el orden en que aparece en `after` —la corrida más
 * reciente, la que importa— con los que sólo existen en `before` al final.
 */
function compareCases(before: Snapshot, after: Snapshot): CaseComparison[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const key of Object.keys(after.cases)) {
    keys.push(key);
    seen.add(key);
  }

  for (const key of Object.keys(before.cases)) {
    if (!seen.has(key)) {
      keys.push(key);
    }
  }

  return keys.map((key) => {
    const { title, name } = parseCaseKey(key);
    const b = before.cases[key] ?? null;
    const a = after.cases[key] ?? null;

    if (b && a) {
      const { change, significant } = compareMeasured(a, b);

      return {
        key,
        title,
        name,
        before: b,
        after: a,
        changePercent: change,
        significant,
      };
    }

    return {
      key,
      title,
      name,
      before: b,
      after: a,
      changePercent: null,
      significant: null,
    };
  });
}

function groupByTitle(cases: CaseComparison[]): Map<string, CaseComparison[]> {
  const groups = new Map<string, CaseComparison[]>();

  for (const c of cases) {
    const list = groups.get(c.title) ?? [];
    list.push(c);
    groups.set(c.title, list);
  }

  return groups;
}

function draw(
  before: Snapshot,
  after: Snapshot,
  cases: CaseComparison[],
): void {
  const header = [
    color.bold("COMPARE"),
    `${before.name} (v${before.version}, ${before.commit})`,
    color.dim("→"),
    `${after.name} (v${after.version}, ${after.commit})`,
    color.cyan(`${before.target}/${before.platform}`),
  ].join("  ");

  console.log(`\n ${header}\n`);

  let regression: { name: string; change: number } | undefined;
  let improvement: { name: string; change: number } | undefined;

  for (const [title, group] of groupByTitle(cases)) {
    console.log(` ${color.bold(title)}`);

    const width = Math.max(...group.map((c) => c.name.length));
    const slowest = Math.max(
      ...group.map((c) => c.after?.mean ?? c.before?.mean ?? 0),
    );

    for (const c of group) {
      if (!c.before || !c.after) {
        const missingFrom = c.before ? after.name : before.name;

        console.log(
          [
            "  ",
            c.name.padEnd(width),
            color.yellow(`sólo en ${c.before ? before.name : after.name}`),
            color.dim(`(falta en ${missingFrom})`),
          ].join(" "),
        );

        continue;
      }

      console.log(
        [
          "  ",
          c.name.padEnd(width),
          color.cyan(bar(c.after.mean, slowest).padEnd(BAR_WIDTH)),
          time(c.before.mean).padStart(10),
          color.dim("→"),
          time(c.after.mean).padStart(10),
          deltaText(c.after, c.before),
        ].join(" "),
      );

      if (c.changePercent !== null && c.significant) {
        if (
          c.changePercent > 0 &&
          (!regression || c.changePercent > regression.change)
        ) {
          regression = {
            name: `${title} › ${c.name}`,
            change: c.changePercent,
          };
        }

        if (
          c.changePercent < 0 &&
          (!improvement || c.changePercent < improvement.change)
        ) {
          improvement = {
            name: `${title} › ${c.name}`,
            change: c.changePercent,
          };
        }
      }
    }

    console.log("");
  }

  console.log(
    color.dim(
      ` barra = tiempo relativo dentro del grupo (después) · ±rme no se muestra: ver el JSON`,
    ),
  );

  if (regression) {
    console.log(
      color.red(
        ` peor regresión: ${regression.name} (+${regression.change.toFixed(1)}%)`,
      ),
    );
  }

  if (improvement) {
    console.log(
      color.green(
        ` mejor mejora: ${improvement.name} (${improvement.change.toFixed(1)}%)`,
      ),
    );
  }

  if (!regression && !improvement) {
    console.log(
      color.dim(` sin cambios fuera del ruido entre los dos snapshots`),
    );
  }

  console.log("");
}

function main(): void {
  const args = process.argv.slice(2);
  const [beforeName, afterName] = args;

  if (!beforeName || !afterName || beforeName.startsWith("--")) {
    usage();
  }

  const before = loadOrExit(beforeName);
  const after = loadOrExit(afterName);

  if (before.target !== after.target || before.platform !== after.platform) {
    console.error(
      `'${before.name}' se midió en ${before.target}/${before.platform} y '${after.name}' ` +
        `en ${after.target}/${after.platform}. Comparar targets o plataformas distintas no ` +
        `significa nada — mide los dos con el mismo target, en la misma máquina.`,
    );
    process.exit(1);
  }

  const cases = compareCases(before, after);

  draw(before, after, cases);

  const jsonIndex = args.indexOf("--json");

  if (jsonIndex >= 0) {
    const file = args[jsonIndex + 1];

    if (!file) {
      usage();
    }

    const output: CompareOutput = {
      before: summarize(before),
      after: summarize(after),
      target: before.target,
      platform: before.platform,
      cases,
    };

    const resolved = resolve(file);
    mkdirSync(dirname(resolved), { recursive: true });
    writeFileSync(resolved, JSON.stringify(output, null, 2) + "\n");

    console.log(color.dim(` JSON escrito en ${resolved}\n`));
  }
}

main();
