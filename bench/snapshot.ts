import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { TARGET } from "./shared/load";
import { color } from "./shared/render";
import { casesOf, readReport, type Report } from "./shared/report";
import {
  snapshotExists,
  validateSnapshotName,
  writeSnapshot,
  type Snapshot,
} from "./shared/snapshot";

/**
 * Congela una corrida de benchmarks con nombre en `bench/snapshots/`, para
 * comparar "antes" contra "después" más tarde con `bench/compare.ts` — algo
 * que `baseline.json` no puede hacer, porque una corrida nueva siempre lo
 * pisa (ver el porqué en `bench/shared/snapshot.ts`).
 *
 * `report.ts` ya avisa de que dos corridas seguidas del **mismo** código
 * pueden diferir hasta un 10% sólo por ruido de la máquina (turbo, antivirus,
 * lo que haya abierto). Comparar snapshots tomados en sesiones distintas, o en
 * máquinas distintas, no significa nada por esa razón. Para un "antes/después"
 * real hace falta medir las dos cosas seguidas, en la misma sesión — que es
 * justo para lo que sirve `--ref`: mide el código de otro commit sin salir de
 * este proceso ni tocar el árbol de trabajo a mano.
 *
 * Uso:
 *   tsx bench/snapshot.ts <nombre>
 *     mide el árbol tal cual está ahora (commiteado o no)
 *
 *   tsx bench/snapshot.ts <nombre> --ref <git-ref>
 *     hace checkout de ese commit/rama, mide, y vuelve a donde estabas —
 *     incluso si la medición falla a medio camino
 *
 *   tsx bench/snapshot.ts <nombre> --bench <patrón> [--bench <patrón> ...]
 *     sólo esos ficheros *.bench.ts, en vez de toda la suite
 *
 *   tsx bench/snapshot.ts <nombre> --force
 *     sobrescribe si el nombre ya existe
 *
 * `--ref` exige un árbol de trabajo limpio (si hay cambios sin commitear, el
 * checkout los arrastraría al otro commit) y sólo funciona en commits que ya
 * traigan el propio harness de benchmarks — no hay forma de medir un punto
 * anterior a `chore: add benchmark harness`.
 */

const BENCH_DIR = resolve(__dirname);
const TMP_JSON = resolve(BENCH_DIR, "results", ".snapshot.json");

function usage(): never {
  console.error(
    [
      "Uso: tsx bench/snapshot.ts <nombre> [--ref <git-ref>] [--bench <patrón>...] [--force]",
      "",
      "  <nombre>        con qué se guarda (letras, números, '.', '_', '-')",
      "  --ref <ref>     mide ese commit/rama en vez del árbol actual (checkout, mide, vuelve)",
      "  --bench <pat>   sólo los ficheros *.bench.ts que casen (repetible)",
      "  --force         sobrescribe si el nombre ya existe",
    ].join("\n"),
  );

  process.exit(1);
}

function git(args: string[]): string {
  const result = spawnSync("git", args, { encoding: "utf-8" });

  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} falló: ${result.stderr || result.error?.message || "sin detalle"}`,
    );
  }

  return result.stdout.trim();
}

function isTreeClean(): boolean {
  return git(["status", "--porcelain"]) === "";
}

/** El nombre de la rama actual, o el sha si `HEAD` está desacoplado. */
function currentRef(): string {
  const branch = spawnSync("git", ["symbolic-ref", "-q", "--short", "HEAD"], {
    encoding: "utf-8",
  });

  if (branch.status === 0 && branch.stdout.trim()) {
    return branch.stdout.trim();
  }

  return git(["rev-parse", "HEAD"]);
}

function checkout(ref: string): void {
  const result = spawnSync("git", ["checkout", "--quiet", ref], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`git checkout ${ref} falló`);
  }
}

/**
 * Corre `vitest bench` sobre el árbol tal cual está en este momento. Vive
 * aparte del checkout de `--ref` a propósito: cuando esto se llama, cualquier
 * cambio de commit ya pasó.
 */
function measure(patterns: string[]): Report {
  mkdirSync(dirname(TMP_JSON), { recursive: true });
  rmSync(TMP_JSON, { force: true });

  console.log(color.dim(` midiendo (target=${TARGET})...\n`));

  const result = spawnSync(
    "npx",
    ["vitest", "bench", "--run", "--outputJson", TMP_JSON, ...patterns],
    { cwd: resolve(BENCH_DIR, ".."), shell: true, stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error("vitest bench terminó con error, ver arriba");
  }

  const report = readReport(TMP_JSON);
  rmSync(TMP_JSON, { force: true });

  if (!report) {
    throw new Error(`vitest no dejó ningún resultado en ${TMP_JSON}`);
  }

  return report;
}

function packageVersion(): string {
  const pkg = JSON.parse(
    readFileSync(resolve(BENCH_DIR, "..", "package.json"), "utf-8"),
  ) as { version: string };

  return pkg.version;
}

function main(): void {
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

  const refIndex = args.indexOf("--ref");
  const ref = refIndex >= 0 ? args[refIndex + 1] : undefined;

  if (refIndex >= 0 && !ref) {
    usage();
  }

  const patterns: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--bench") {
      const pattern = args[++i];

      if (!pattern) {
        usage();
      }

      patterns.push(pattern);
    }
  }

  let report: Report;
  let commit: string;
  let dirty = false;

  if (ref) {
    if (!isTreeClean()) {
      console.error(
        "El árbol de trabajo tiene cambios sin commitear. Commitea o guarda en " +
          "un stash antes de usar --ref: el checkout los arrastraría al otro commit.",
      );
      process.exit(1);
    }

    const original = currentRef();

    console.log(color.dim(` haciendo checkout de ${ref}...`));
    checkout(ref);

    try {
      commit = git(["rev-parse", "--short", "HEAD"]);
      report = measure(patterns);
    } finally {
      console.log(color.dim(` volviendo a ${original}...`));
      checkout(original);
    }
  } else {
    dirty = !isTreeClean();
    commit = git(["rev-parse", "--short", "HEAD"]);
    report = measure(patterns);
  }

  const snapshot: Snapshot = {
    name,
    at: new Date().toISOString(),
    target: TARGET,
    node: process.version,
    platform: process.platform,
    version: packageVersion(),
    commit,
    ...(ref ? { ref } : {}),
    dirty,
    cases: casesOf(report),
  };

  const file = writeSnapshot(snapshot);
  const caseCount = Object.keys(snapshot.cases).length;

  console.log(color.green(`\n Snapshot guardado: ${file}`));
  console.log(
    color.dim(
      ` ${caseCount} casos · v${snapshot.version} · ${snapshot.commit}` +
        (dirty ? " · árbol con cambios sin commitear" : "") +
        "\n",
    ),
  );
}

main();
