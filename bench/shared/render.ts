/**
 * Lo que dibuja en consola: color, barras y formato de números. Vive aparte
 * porque lo comparten el report de `vitest bench`, el de peso y el de tests.
 */

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function paint(code: string, text: string): string {
  return useColor ? `\u001b[${code}m${text}\u001b[0m` : text;
}

export const color = {
  bold: (t: string) => paint("1", t),
  dim: (t: string) => paint("2", t),
  red: (t: string) => paint("31", t),
  green: (t: string) => paint("32", t),
  yellow: (t: string) => paint("33", t),
  cyan: (t: string) => paint("36", t),
};

export const BAR_WIDTH = 24;

const BLOCKS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];

/** Barra con resolución de un octavo de carácter. */
export function bar(value: number, max: number): string {
  const ratio = max > 0 ? value / max : 0;
  const eighths = Math.max(1, Math.round(ratio * BAR_WIDTH * 8));
  const full = Math.floor(eighths / 8);
  const rest = eighths % 8;

  return "█".repeat(full) + BLOCKS[rest];
}

export function time(ms: number): string {
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

export function ops(hz: number): string {
  const value =
    hz >= 100 ? Math.round(hz).toLocaleString("en-US") : hz.toFixed(1);

  return `${value} ops/s`;
}

export function bytes(value: number): string {
  if (value < 1024) {
    return `${Math.round(value)} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

export interface Row {
  /** Etiqueta de la izquierda. */
  name: string;
  /** El número con el que se dibuja la barra. */
  value: number;
  /** Ese número ya formateado. */
  text: string;
  /** Columnas extra, ya formateadas. */
  extra?: string[];
}

export function head(text: string): void {
  console.log(`\n ${color.bold(text)}`);
}

/** Tabla de barras normalizadas al valor más grande de las filas dadas. */
export function barTable(rows: Row[]): void {
  const max = Math.max(...rows.map((r) => r.value));
  const width = Math.max(...rows.map((r) => r.name.length));
  const extras = Math.max(0, ...rows.map((r) => r.extra?.length ?? 0));
  const extraWidth: number[] = [];

  for (let i = 0; i < extras; i++) {
    extraWidth.push(Math.max(...rows.map((r) => (r.extra?.[i] ?? "").length)));
  }

  for (const row of rows) {
    const cells = [
      "  ",
      row.name.padEnd(width),
      color.cyan(bar(row.value, max).padEnd(BAR_WIDTH)),
      row.text.padStart(10),
    ];

    for (let i = 0; i < extras; i++) {
      cells.push(color.dim((row.extra?.[i] ?? "").padStart(extraWidth[i])));
    }

    console.log(cells.join(" "));
  }
}
