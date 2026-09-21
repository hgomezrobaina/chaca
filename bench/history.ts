import { type HistoryEntry, readAll } from "./shared/history";
import { color, sparkline, time } from "./shared/render";

/**
 * Cómo han evolucionado los tiempos a lo largo de las corridas guardadas.
 *
 * El delta de `pnpm bench` responde "¿cambió algo desde el baseline?". Esto
 * responde otra cosa: si lo que se ve es una deriva lenta —el tipo de regresión
 * que nunca supera el ruido en un solo salto pero sí en diez— o un escalón en
 * una fecha concreta.
 *
 * Uso:
 *   pnpm bench:history                      últimas 20 corridas
 *   tsx bench/history.ts --limit 50         más historia
 *   tsx bench/history.ts --filter export    sólo los casos que contengan eso
 */

const DEFAULT_LIMIT = 20;

/** Cambio significativo entre las dos mitades de la serie, en porcentaje. */
const DRIFT = 10;

/**
 * Corridas mínimas para hablar de tendencia.
 *
 * Con tres corridas del mismo código esto marcaba derivas del 14% y del 25%:
 * comparar un punto contra otro punto es tan ruidoso como el delta de una
 * corrida suelta, y aquí el ruido de la máquina llega al 10%. Por debajo de
 * este número se dibuja la forma pero no se saca conclusión.
 */
const MIN_RUNS = 6;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Deriva: mediana de la primera mitad contra mediana de la segunda. Promediar
 * a los dos lados es lo que separa una tendencia real de dos corridas con
 * suerte distinta.
 */
function drift(values: number[]): number {
  const half = Math.floor(values.length / 2);
  const before = median(values.slice(0, half));
  const after = median(values.slice(values.length - half));

  return ((after - before) / before) * 100;
}

function label(key: string): string {
  // `bench/x.bench.ts > grupo::caso` → `grupo › caso`
  const [group, name] = key.split("::");

  return `${group.split(" > ").slice(1).join(" > ")} › ${name}`;
}

function draw(entries: HistoryEntry[], filter: string | undefined): void {
  const latest = entries[entries.length - 1];

  // Mezclar `src` con `dist` en una misma línea sería comparar dos librerías
  // distintas, así que la serie es la del objetivo de la última corrida.
  const series = entries.filter((entry) => entry.target === latest.target);

  const keys = Object.keys(latest.cases)
    .filter(
      (key) => !filter || key.toLowerCase().includes(filter.toLowerCase()),
    )
    .sort();

  if (keys.length === 0) {
    console.log(color.yellow(` ningún caso coincide con '${filter}'\n`));

    return;
  }

  const header = [
    color.bold("HISTORY"),
    `${series.length} corridas · ${latest.target}`,
    `${series[0].at.slice(0, 16).replace("T", " ")} → ${latest.at.slice(0, 16).replace("T", " ")}`,
  ].join("  ·  ");

  console.log(`\n ${header}\n`);

  const width = Math.max(...keys.map((key) => label(key).length));
  const drifted: { name: string; change: number }[] = [];

  for (const key of keys) {
    // Una corrida vieja puede no tener un caso que se añadió después.
    const values = series
      .map((entry) => entry.cases[key]?.mean)
      .filter((value): value is number => typeof value === "number");

    if (values.length === 0) {
      continue;
    }

    const last = values[values.length - 1];
    const change = values.length >= 2 ? drift(values) : 0;
    const text = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;

    const trend =
      values.length < MIN_RUNS
        ? color.dim("—")
        : change > DRIFT
          ? color.red(`▲ ${text}`)
          : change < -DRIFT
            ? color.green(`▼ ${text}`)
            : color.dim(`≈ ${text}`);

    console.log(
      [
        "  ",
        label(key).padEnd(width),
        color.cyan(sparkline(values).padEnd(DEFAULT_LIMIT)),
        time(last).padStart(10),
        trend,
      ].join(" "),
    );

    if (values.length >= MIN_RUNS && Math.abs(change) > DRIFT) {
      drifted.push({ name: label(key), change });
    }
  }

  console.log(
    color.dim(
      `\n cada carácter es una corrida; la altura va del mínimo al máximo de esa fila · el % compara las medianas de las dos mitades`,
    ),
  );

  if (series.length < MIN_RUNS) {
    console.log(
      color.yellow(
        ` con ${series.length} corrida(s) no hay tendencia que leer: hacen falta ${MIN_RUNS}\n`,
      ),
    );

    return;
  }

  if (drifted.length === 0) {
    console.log(color.dim(` ninguna serie se ha movido más de un ${DRIFT}%\n`));

    return;
  }

  const worst = drifted.sort((a, b) => b.change - a.change)[0];

  console.log(
    worst.change > 0
      ? color.red(
          ` la que más se ha ido: ${worst.name} (+${worst.change.toFixed(1)}%)\n`,
        )
      : color.green(` todas las derivas son mejoras\n`),
  );
}

function main(): void {
  const args = process.argv.slice(2);
  const limitFlag = args.indexOf("--limit");
  const filterFlag = args.indexOf("--filter");
  const limit = limitFlag >= 0 ? Number(args[limitFlag + 1]) : DEFAULT_LIMIT;

  const entries = readAll();

  if (entries.length === 0) {
    console.log(
      color.yellow(
        "\n no hay histórico todavía: cada 'pnpm bench' deja una corrida\n",
      ),
    );

    return;
  }

  draw(
    entries.slice(-limit),
    filterFlag >= 0 ? args[filterFlag + 1] : undefined,
  );
}

main();
