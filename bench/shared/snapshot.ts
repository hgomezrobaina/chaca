import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import type { HistoryCase } from "./history";

/**
 * Un snapshot es una corrida de benchmarks congelada con el nombre que se le
 * dé, para comparar "antes" contra "después" más tarde con `bench/compare.ts`.
 *
 * Es distinto de las otras dos cosas que ya existen:
 * - `baseline.json` es un único fichero que una corrida nueva siempre pisa —
 *   sirve para el delta del día a día, no para guardar un punto concreto.
 * - `bench/history/` no se versiona: un tiempo medido en un portátil no es
 *   comparable con el de otra máquina, así que mezclar series de máquinas
 *   distintas no tiene sentido y por eso esa carpeta se queda local.
 *
 * Un snapshot de release SÍ se versiona (a diferencia de `history/`): es la
 * prueba de la cifra que aparece en un CHANGELOG o un artículo, y trae consigo
 * de dónde salió (`commit`, `version`, `target`, `platform`). Comparar dos
 * snapshots sólo tiene sentido si comparten `target` y `platform` — eso lo
 * exige `compare.ts`, no este módulo.
 */

export const SNAPSHOTS_DIR = resolve(__dirname, "..", "snapshots");

export interface Snapshot {
  /** El nombre elegido al crearlo. También el nombre del fichero. */
  name: string;
  /** ISO del momento en que se midió. */
  at: string;
  /** `src` o `dist`. Comparar snapshots con distinto target no dice nada. */
  target: string;
  node: string;
  /** `process.platform`. Comparar snapshots de plataformas distintas no dice nada. */
  platform: string;
  /** Versión de `package.json` en el momento medido. */
  version: string;
  /** Sha corto del commit medido — el de `--ref`, o el que hubiera en el árbol. */
  commit: string;
  /** El `--ref` pedido a `snapshot.ts`, tal cual, cuando se usó uno. */
  ref?: string;
  /** El árbol tenía cambios sin commitear al medir. Sólo posible sin `--ref`. */
  dirty: boolean;
  cases: Record<string, HistoryCase>;
}

/**
 * Letras, números, `.`, `_` y `-`, sin empezar por un separador. Es un nombre
 * de fichero, así que las mismas reglas que un nombre de paquete de npm
 * bastan y evitan sorpresas entre sistemas de ficheros.
 */
const VALID_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function validateSnapshotName(name: string): void {
  if (!VALID_NAME.test(name)) {
    throw new Error(
      `Nombre de snapshot inválido: '${name}'. Sólo letras, números, '.', '_' y ` +
        `'-', y no puede empezar por uno de estos símbolos.`,
    );
  }
}

function fileFor(name: string): string {
  return join(SNAPSHOTS_DIR, `${name}.json`);
}

export function snapshotExists(name: string): boolean {
  return existsSync(fileFor(name));
}

export function writeSnapshot(snapshot: Snapshot): string {
  validateSnapshotName(snapshot.name);
  mkdirSync(SNAPSHOTS_DIR, { recursive: true });

  const file = fileFor(snapshot.name);
  writeFileSync(file, JSON.stringify(snapshot, null, 2) + "\n");

  return file;
}

export function readSnapshot(name: string): Snapshot | undefined {
  const file = fileFor(name);

  if (!existsSync(file)) {
    return undefined;
  }

  return JSON.parse(readFileSync(file, "utf-8")) as Snapshot;
}

export function listSnapshots(): string[] {
  if (!existsSync(SNAPSHOTS_DIR)) {
    return [];
  }

  return readdirSync(SNAPSHOTS_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length))
    .sort();
}
