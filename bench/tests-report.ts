import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { barTable, color, head, time } from "./shared/render";

/**
 * Qué tests frenan la suite, a partir del reporter JSON de vitest.
 *
 * Esto **no** mide la velocidad de la librería y no se compara con el baseline
 * de `pnpm bench`: la duración de un test incluye sus aserciones, su setup y lo
 * que el runner tarde en aislarlo. Responde a otra pregunta —qué hace larga la
 * CI— y por eso vive en su propio comando.
 *
 * Uso:
 *   pnpm bench:tests                 corre la suite y dibuja
 *   tsx bench/tests-report.ts --json <file>   dibuja un JSON ya existente
 */

const RESULTS = resolve(__dirname, "results", "tests.json");

const SLOWEST = 20;

interface Assertion {
  fullName: string;
  duration: number | null;
  status: string;
}

interface FileResult {
  name: string;
  startTime: number;
  endTime: number;
  assertionResults: Assertion[];
}

interface TestReport {
  numTotalTests: number;
  numFailedTests: number;
  success: boolean;
  testResults: FileResult[];
}

function runSuite(): void {
  console.log(color.dim(" corriendo la suite con el reporter json…\n"));

  const result = spawnSync(
    "npx",
    ["vitest", "run", "--reporter=json", `--outputFile=${RESULTS}`],
    { cwd: resolve(__dirname, ".."), shell: true, stdio: "inherit" },
  );

  // Un test rojo no impide dibujar: los tiempos de los que sí pasaron siguen
  // siendo válidos, y avisamos al final.
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
}

/** `test/modules/person/person.test.ts` → `modules` */
function folderOf(file: string): string {
  const normalized = file.split("\\").join("/");
  const parts = normalized.slice(normalized.indexOf("/test/") + 6).split("/");

  return parts.length > 1 ? parts[0] : "(raíz)";
}

function draw(report: TestReport): void {
  console.log(
    `\n ${color.bold("TESTS")}  ·  ${report.numTotalTests} tests en ${report.testResults.length} ficheros\n`,
  );

  const perFolder = new Map<string, { ms: number; files: number }>();

  for (const file of report.testResults) {
    const folder = folderOf(file.name);
    const current = perFolder.get(folder) ?? { ms: 0, files: 0 };

    current.ms += file.endTime - file.startTime;
    current.files += 1;
    perFolder.set(folder, current);
  }

  head("reparto por carpeta");

  barTable(
    [...perFolder.entries()]
      .sort((a, b) => b[1].ms - a[1].ms)
      .map(([name, data]) => ({
        name,
        value: data.ms,
        text: time(data.ms),
        extra: [`${data.files} ficheros`],
      })),
  );

  const slowestFiles = [...report.testResults]
    .map((file) => ({ name: file.name, ms: file.endTime - file.startTime }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 10);

  head("ficheros más lentos");

  barTable(
    slowestFiles.map((file) => ({
      name: folderOf(file.name) + "/" + (file.name.split(/[\\/]/).pop() ?? ""),
      value: file.ms,
      text: time(file.ms),
    })),
  );

  const slowestTests = report.testResults
    .flatMap((file) => file.assertionResults)
    .filter((test) => typeof test.duration === "number")
    .sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))
    .slice(0, SLOWEST);

  head(`los ${SLOWEST} tests más lentos`);

  barTable(
    slowestTests.map((test) => ({
      // Los nombres completos son larguísimos; la cola es lo que identifica.
      name:
        test.fullName.length > 58
          ? "…" + test.fullName.slice(-57)
          : test.fullName,
      value: test.duration ?? 0,
      text: time(test.duration ?? 0),
    })),
  );

  const total = report.testResults.reduce(
    (sum, file) => sum + (file.endTime - file.startTime),
    0,
  );

  console.log(
    color.dim(
      `\n suma de los ficheros: ${time(total)} (en paralelo tarda menos) · la duración incluye aserciones y setup, no es velocidad de la librería`,
    ),
  );

  if (!report.success) {
    console.log(
      color.yellow(
        ` ${report.numFailedTests} tests en rojo: los tiempos de los que fallan no significan nada`,
      ),
    );
  }

  console.log("");
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonFlag = args.indexOf("--json");
  const file = jsonFlag >= 0 ? resolve(args[jsonFlag + 1]) : RESULTS;

  if (jsonFlag < 0) {
    runSuite();
  }

  if (!existsSync(file)) {
    console.error(`No hay resultados en ${file}.`);
    process.exit(1);
  }

  draw(JSON.parse(readFileSync(file, "utf-8")) as TestReport);
}

main();
