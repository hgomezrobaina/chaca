import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * Dibuja en consola el JSON que deja `vitest bench --outputJson`.
 *
 * La tabla que imprime vitest compara todo contra el caso más rápido del grupo
 * ("110x faster than array(10000)"), que para un barrido de tamaños no dice
 * nada. Esto dibuja una barra por caso —tiempo relativo dentro de su grupo— y,
 * lo que de verdad importa, el delta contra el baseline guardado.
 *
 * Uso:
 *   tsx bench/report.ts                 dibuja bench/results/last.json
 *   tsx bench/report.ts --save          promueve ese resultado a baseline
 *   tsx bench/report.ts --json <file>   dibuja otro fichero
 */

const BENCH_DIR = resolve(__dirname);
const DEFAULT_JSON = join(BENCH_DIR, "results", "last.json");
const BASELINE = join(BENCH_DIR, "baseline.json");

interface Benchmark {
  name: string;
  hz: number;
  mean: number;
  median: number;
  rme: number;
  sampleCount: number;
}

interface Group {
  fullName: string;
  benchmarks: Benchmark[];
}

interface BenchFile {
  filepath: string;
  groups: Group[];
}

interface Report {
  files: BenchFile[];
}

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function paint(code: string, text: string): string {
  return useColor ? `\u001b[${code}m${text}\u001b[0m` : text;
}

const color = {
  bold: (t: string) => paint("1", t),
  dim: (t: string) => paint("2", t),
  red: (t: string) => paint("31", t),
  green: (t: string) => paint("32", t),
  yellow: (t: string) => paint("33", t),
  cyan: (t: string) => paint("36", t),
};

const BAR_WIDTH = 24;
const BLOCKS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];

/** Barra con resolución de un octavo de carácter. */
function bar(value: number, max: number): string {
  const ratio = max > 0 ? value / max : 0;
  const eighths = Math.max(1, Math.round(ratio * BAR_WIDTH * 8));
  const full = Math.floor(eighths / 8);
  const rest = eighths % 8;

  return "█".repeat(full) + BLOCKS[rest];
}

function time(ms: number): string {
  if (ms < 0.001) {
    return `${(ms * 1e6).toFixed(0)} ns`;
  }

  if (ms < 1) {
    return `${(ms * 1000).toFixed(1)} µs`;
  }

  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  }

  return `${(ms / 1000).toFixed(2)} s`;
}

function ops(hz: number): string {
  const value =
    hz >= 100 ? Math.round(hz).toLocaleString("en-US") : hz.toFixed(1);

  return `${value} ops/s`;
}

/**
 * Suelo de ruido, en porcentaje: por debajo de esto un delta no se pinta.
 *
 * El 10% no es una corazonada. Dos corridas seguidas del **mismo** código en
 * este portátil dieron diferencias de hasta ±9.6%, porque el `rme` que calcula
 * tinybench mide la dispersión *dentro* de una corrida y no recoge la deriva
 * entre corridas (turbo, antivirus, lo que haya abierto). Una máquina más
 * tranquila —o una CI dedicada— admite bajarlo con `CHACA_BENCH_NOISE`.
 */
const NOISE_FLOOR = Number(process.env.CHACA_BENCH_NOISE ?? 10);

/** Cambio porcentual y el ruido por debajo del cual ese cambio no significa nada. */
function compare(now: Benchmark, before: Benchmark) {
  return {
    change: ((now.mean - before.mean) / before.mean) * 100,
    noise: Math.max(now.rme + before.rme, NOISE_FLOOR),
  };
}

/**
 * El delta sólo se pinta cuando supera el ruido de las dos mediciones. Pintar
 * de rojo lo que es varianza de la máquina entrena a ignorar el color.
 */
function delta(now: Benchmark, before: Benchmark | undefined): string {
  if (!before) {
    return color.dim("—");
  }

  const { change, noise } = compare(now, before);
  const text = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;

  if (Math.abs(change) < noise) {
    return color.dim(`≈ ${text}`);
  }

  return change > 0 ? color.red(`▲ ${text}`) : color.green(`▼ ${text}`);
}

function read(file: string): Report | undefined {
  if (!existsSync(file)) {
    return undefined;
  }

  return JSON.parse(readFileSync(file, "utf-8")) as Report;
}

/** Índice plano `grupo::caso` para cruzar dos ejecuciones distintas. */
function index(report: Report): Map<string, Benchmark> {
  const map = new Map<string, Benchmark>();

  for (const file of report.files) {
    for (const group of file.groups) {
      for (const benchmark of group.benchmarks) {
        map.set(`${group.fullName}::${benchmark.name}`, benchmark);
      }
    }
  }

  return map;
}

function save(from: string): void {
  const report = read(from);

  if (!report) {
    console.error(`No hay resultados en ${from}. Corre 'npm run bench' antes.`);
    process.exit(1);
  }

  mkdirSync(dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, JSON.stringify(report, null, 2));

  console.log(color.green(`Baseline fijado desde ${from}`));
}

function draw(report: Report, baseline: Report | undefined): void {
  const before = baseline ? index(baseline) : undefined;
  const target = process.env.CHACA_BENCH_TARGET === "dist" ? "dist" : "src";

  const header = [
    color.bold("BENCH"),
    `chaca · ${color.cyan(target)}`,
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
      color.yellow(
        ` sin baseline: 'npm run bench:save' fija el actual como referencia\n`,
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
    console.error(`No hay resultados en ${file}. Corre 'npm run bench' antes.`);
    process.exit(1);
  }

  draw(report, read(BASELINE));
}

main();
