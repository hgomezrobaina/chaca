import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Lo que `bench/snapshot.ts` y `bench/competitors.ts` necesitan de git y del
 * `package.json` del propio repo, para que ningún snapshot quede con un
 * commit o una versión escritos a mano.
 */

export function git(args: string[]): string {
  const result = spawnSync("git", args, { encoding: "utf-8" });

  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} falló: ${result.stderr || result.error?.message || "sin detalle"}`,
    );
  }

  return result.stdout.trim();
}

export function commitSha(): string {
  return git(["rev-parse", "--short", "HEAD"]);
}

export function isTreeClean(): boolean {
  return git(["status", "--porcelain"]) === "";
}

export function packageVersion(): string {
  const pkg = JSON.parse(
    readFileSync(resolve(__dirname, "..", "..", "package.json"), "utf-8"),
  ) as { version: string };

  return pkg.version;
}
