import { existsSync, readFileSync } from "node:fs";
import type { HistoryCase } from "./history";

/**
 * El formato que deja `vitest bench --outputJson`, y las utilidades para
 * leerlo. Vive aparte porque lo comparten `report.ts` (lo pinta en consola,
 * con delta contra `baseline.json`) y `snapshot.ts` (lo reduce a un registro
 * con nombre para comparar dos corridas más tarde).
 */

export interface Benchmark {
  name: string;
  hz: number;
  mean: number;
  median: number;
  rme: number;
  sampleCount: number;
}

export interface Group {
  fullName: string;
  benchmarks: Benchmark[];
}

export interface BenchFile {
  filepath: string;
  groups: Group[];
}

export interface Report {
  files: BenchFile[];
}

export function readReport(file: string): Report | undefined {
  if (!existsSync(file)) {
    return undefined;
  }

  return JSON.parse(readFileSync(file, "utf-8")) as Report;
}

/** Índice plano `grupo::caso` para cruzar dos ejecuciones distintas. */
export function indexReport(report: Report): Map<string, Benchmark> {
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

/** El registro compacto que se guarda en el histórico y en los snapshots. */
export function casesOf(report: Report): Record<string, HistoryCase> {
  const cases: Record<string, HistoryCase> = {};

  for (const [key, benchmark] of indexReport(report)) {
    cases[key] = {
      mean: benchmark.mean,
      hz: benchmark.hz,
      rme: benchmark.rme,
    };
  }

  return cases;
}
