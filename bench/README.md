# Benchmarks

```shell
pnpm bench          # mide y dibuja
pnpm bench:report   # vuelve a dibujar el último resultado, sin medir
pnpm bench:save     # fija el último resultado como baseline
```

`bench/baseline.json` se versiona: es la referencia contra la que se pinta el delta.
`bench/results/` no, es el resultado de la última corrida.

## Qué mide cada fichero

| Fichero | Qué responde |
|---|---|
| `generation.bench.ts` | cuánto cuesta generar n documentos, y qué añaden los campos dependientes |
| `modules.bench.ts` | qué módulo es caro (en tandas de 1000 llamadas) |
| `export.bench.ts` | qué serializador es lento, sobre datos ya generados |
| `dataset.bench.ts` | cuánto cuesta resolver referencias entre schemas |

## `src` o `dist`

Por defecto se mide `src/`, que es lo cómodo para iterar. Para medir lo que de verdad
instala el usuario —pasado por el treeshake de tsup y bajado a `es2020`— hay que construir
antes y cambiar el objetivo:

```shell
pnpm build:lib
$env:CHACA_BENCH_TARGET = "dist"; pnpm bench    # PowerShell
CHACA_BENCH_TARGET=dist pnpm bench              # bash
```

## Leer el delta

Un delta sólo se pinta en color cuando supera el ruido. El suelo son **10 puntos
porcentuales**, medido: dos corridas seguidas del mismo código en un portátil dieron
diferencias de hasta ±9.6%. En una máquina tranquila se puede bajar con
`CHACA_BENCH_NOISE=5`.

Eso también significa que **un baseline no es comparable entre máquinas**. El que está
versionado sirve de referencia relativa, no de cifra absoluta.
