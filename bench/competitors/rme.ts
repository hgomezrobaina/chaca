/**
 * El margen relativo al 95 % a partir de las muestras crudas de mitata
 * (`stats.samples`, `node_modules/mitata/src/main.d.mts:42`), con la misma
 * fórmula que publica tinybench como `rme` en los `*.bench.ts` de vitest:
 * 1,96 × error estándar / media × 100.
 *
 * Con menos de dos muestras no hay variabilidad que medir: se devuelve 0 en
 * vez de `NaN` (desviación de una sola muestra no está definida).
 */
export function relativeMarginOfError(samples: number[]): number {
  if (samples.length < 2) {
    return 0;
  }

  const mean =
    samples.reduce((sum, value) => {
      return sum + value;
    }, 0) / samples.length;

  const variance =
    samples.reduce((sum, value) => {
      return sum + (value - mean) ** 2;
    }, 0) /
    (samples.length - 1);

  const standardError = Math.sqrt(variance) / Math.sqrt(samples.length);

  return mean === 0 ? 0 : ((1.96 * standardError) / mean) * 100;
}
