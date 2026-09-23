import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { compareMeasured as compare, deltaText as delta } from "./shared/delta";
import { append } from "./shared/history";
import { TARGET } from "./shared/load";
import { BAR_WIDTH, bar, color, ops, time } from "./shared/render";
import {
  casesOf,
  indexReport as index,
  readReport as read,
  type Report,
} from "./shared/report";

/**
 * Dibuja en consola el JSON que deja `vitest bench --outputJson`.
 *
 * La tabla que imprime vitest compara todo contra el caso más rápido del grupo
 * ("110x faster than array(10000)"), que para un barrido de tamaños no dice
 * nada. Esto dibuja una barra por caso —tiempo relativo dentro de su grupo— y,
 * lo que de verdad importa, el delta contra el baseline guardado.
 *
 * Cada corrida deja además un registro en `bench/history/`, que es de donde
 * `pnpm bench:history` saca la evolución.
 *
 * Uso:
 *   tsx bench/report.ts                 dibuja bench/results/last.json
 *   tsx bench/report.ts --save          promueve ese resultado a baseline
 *   tsx bench/report.ts --json <file>   dibuja otro fichero
 *   tsx bench/report.ts --no-compare    sin delta contra el baseline (CI)
 *   tsx bench/report.ts --no-history    sin guardar la corrida
 */

const BENCH_DIR = resolve(__dirname);
const DEFAULT_JSON = join(BENCH_DIR, "results", "last.json");
const BASELINE = join(BENCH_DIR, "baseline.json");

function save(from: string): void {
  const report = read(from);

  if (!report) {
    console.error(`No hay resultados en ${from}. Corre 'pnpm bench' antes.`);
    process.exit(1);
  }

  mkdirSync(dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, JSON.stringify(report, null, 2));

  console.log(color.green(`Baseline fijado desde ${from}`));
}

function draw(
  report: Report,
  baseline: Report | undefined,
  noCompare = false,
): void {
  const before = baseline ? index(baseline) : undefined;

  const header = [
    color.bold("BENCH"),
    `chaca · ${color.cyan(TARGET)}`,
    `node ${process.version}`,
    new Date().toLocaleString(),
  ].join("  ·  ");

  console.log(`\n ${header}\n`);

  let regression: { name: string; change: number } | undefined;
  let improvement: { name: string; change: number } | undefined;

  for (const file of report.files) {
    for (const group of file.groups) {
      // El fullName trae delante la ruta del fichero, que ya no aporta.
      const title = group.fullName.split(" > ").slice(1).join(" > ");
      const slowest = Math.max(...group.benchmarks.map((b) => b.mean));
      const width = Math.max(...group.benchmarks.map((b) => b.name.length));

      console.log(` ${color.bold(title)}`);

      for (const benchmark of group.benchmarks) {
        const key = `${group.fullName}::${benchmark.name}`;
        const previous = before?.get(key);

        console.log(
          [
            "  ",
            benchmark.name.padEnd(width),
            color.cyan(bar(benchmark.mean, slowest).padEnd(BAR_WIDTH)),
            time(benchmark.mean).padStart(10),
            ops(benchmark.hz).padStart(16),
            color.dim(`±${benchmark.rme.toFixed(1)}%`.padStart(7)),
            delta(benchmark, previous),
          ].join(" "),
        );

        if (previous) {
          const { change, noise } = compare(benchmark, previous);

          if (change > noise && (!regression || change > regression.change)) {
            regression = { name: `${title} › ${benchmark.name}`, change };
          }

          if (
            -change > noise &&
            (!improvement || change < improvement.change)
          ) {
            improvement = { name: `${title} › ${benchmark.name}`, change };
          }
        }
      }

      console.log("");
    }
  }

  console.log(
    color.dim(
      ` barra = tiempo relativo dentro del grupo (más larga = más lenta) · ±rme = margen de error`,
    ),
  );

  if (!baseline) {
    console.log(
      noCompare
        ? color.dim(` --no-compare: cifras sueltas, sin delta\n`)
        : color.yellow(
            ` sin baseline: 'pnpm bench:save' fija el actual como referencia\n`,
          ),
    );

    return;
  }

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
    console.log(color.dim(` sin cambios fuera del ruido respecto al baseline`));
  }

  console.log("");
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonFlag = args.indexOf("--json");
  const file = jsonFlag >= 0 ? resolve(args[jsonFlag + 1]) : DEFAULT_JSON;

  if (args.includes("--save")) {
    save(file);

    return;
  }

  const report = read(file);

  if (!report) {
    console.error(`No hay resultados en ${file}. Corre 'pnpm bench' antes.`);

    return process.exit(1);
  }

  // En CI el baseline versionado se midió en otra máquina, así que su delta no
  // significa nada: `--no-compare` imprime sólo las cifras de esta corrida.
  const noCompare = args.includes("--no-compare");

  draw(report, noCompare ? undefined : read(BASELINE), noCompare);

  if (!args.includes("--no-history")) {
    const saved = append(casesOf(report));

    console.log(color.dim(` guardado en el histórico: ${basename(saved)}\n`));
  }
}

main();
