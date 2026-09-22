import { color } from "./render";

/**
 * El delta entre dos mediciones, y el ruido por debajo del cual ese delta no
 * significa nada. Lo comparten `report.ts` (la corrida actual contra
 * `baseline.json`) y `compare.ts` (dos snapshots con nombre) — a los dos les
 * basta `mean` y `rme`, así que ni un `Benchmark` de `shared/report.ts` ni un
 * `HistoryCase` de `shared/history.ts` necesitan más que eso.
 */

interface Measured {
  mean: number;
  rme: number;
}

/**
 * Suelo de ruido, en puntos porcentuales: por debajo de esto un delta no se
 * pinta como cambio real.
 *
 * El 10% no es una corazonada. Dos corridas seguidas del **mismo** código en
 * un portátil dieron diferencias de hasta ±9.6%, porque el `rme` que calcula
 * tinybench mide la dispersión *dentro* de una corrida y no recoge la deriva
 * entre corridas (turbo, antivirus, lo que haya abierto). Una máquina más
 * tranquila —o una CI dedicada— admite bajarlo con `CHACA_BENCH_NOISE`.
 */
export const NOISE_FLOOR = Number(process.env.CHACA_BENCH_NOISE ?? 10);

export interface Delta {
  /** Cambio porcentual: negativo es más rápido. */
  change: number;
  /** El ruido combinado de las dos mediciones, o el suelo si es menor. */
  noise: number;
  /** `true` si `change` supera `noise` — un cambio real, no varianza. */
  significant: boolean;
}

export function compareMeasured(now: Measured, before: Measured): Delta {
  const change = ((now.mean - before.mean) / before.mean) * 100;
  const noise = Math.max(now.rme + before.rme, NOISE_FLOOR);

  return { change, noise, significant: Math.abs(change) > noise };
}

/**
 * El delta pintado como se ve en consola. Sólo se pinta de color cuando supera
 * el ruido de las dos mediciones — pintar de rojo lo que es varianza de la
 * máquina entrena a ignorar el color.
 */
export function deltaText(now: Measured, before: Measured | undefined): string {
  if (!before) {
    return color.dim("—");
  }

  const { change, significant } = compareMeasured(now, before);
  const text = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;

  if (!significant) {
    return color.dim(`≈ ${text}`);
  }

  return change > 0 ? color.red(`▲ ${text}`) : color.green(`▼ ${text}`);
}
