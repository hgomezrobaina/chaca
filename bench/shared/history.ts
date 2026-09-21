import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { TARGET } from "./load";

/**
 * El histórico local de corridas.
 *
 * Guarda un registro por ejecución, no el JSON entero de vitest: ese trae los
 * `samples` de cada caso y ocupa cientos de kilobytes. Aquí sólo quedan las
 * cifras que se dibujan, y una corrida pesa unos pocos kilobytes.
 *
 * La carpeta **no** se versiona, a diferencia del baseline. Un tiempo medido en
 * un portátil no es comparable con el de otra máquina, así que un histórico
 * compartido mezclaría series que no tienen nada que ver.
 */

/** `CHACA_BENCH_HISTORY` permite llevar la serie a otro sitio (otra máquina, la CI). */
export const HISTORY_DIR = process.env.CHACA_BENCH_HISTORY
  ? resolve(process.env.CHACA_BENCH_HISTORY)
  : resolve(__dirname, "..", "history");

export interface HistoryCase {
  mean: number;
  hz: number;
  rme: number;
}

export interface HistoryEntry {
  /** ISO del momento de la corrida. */
  at: string;
  /** `src` o `dist`: dos series distintas que no deben mezclarse. */
  target: string;
  node: string;
  platform: string;
  cases: Record<string, HistoryCase>;
}

/** Los dos puntos no valen en un nombre de fichero de Windows. */
function filenameFor(at: string): string {
  return `${at.split(":").join("-")}.json`;
}

export function append(cases: Record<string, HistoryCase>): string {
  const entry: HistoryEntry = {
    at: new Date().toISOString(),
    target: TARGET,
    node: process.version,
    platform: process.platform,
    cases,
  };

  mkdirSync(HISTORY_DIR, { recursive: true });
  const file = join(HISTORY_DIR, filenameFor(entry.at));
  writeFileSync(file, JSON.stringify(entry, null, 2));

  return file;
}

export function readAll(): HistoryEntry[] {
  if (!existsSync(HISTORY_DIR)) {
    return [];
  }

  return readdirSync(HISTORY_DIR)
    .filter((name) => name.endsWith(".json"))
    .map(
      (name) =>
        JSON.parse(
          readFileSync(join(HISTORY_DIR, name), "utf-8"),
        ) as HistoryEntry,
    )
    .sort((a, b) => a.at.localeCompare(b.at));
}
