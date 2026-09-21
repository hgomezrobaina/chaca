# Benchmarks

```shell
pnpm bench          # mide velocidad y dibuja, con delta contra el baseline
pnpm bench:report   # vuelve a dibujar el último resultado, sin medir
pnpm bench:save     # fija el último resultado como baseline

pnpm bench:scaling  # cómo escala la generación (mitata: barras, caja y GC)
pnpm bench:size     # memoria por documento, peso de cada formato y de los bundles
pnpm bench:tests    # qué tests frenan la suite
```

`bench/baseline.json` se versiona: es la referencia contra la que se pinta el delta.
`bench/results/` no, es el resultado de la última corrida.

## Qué mide cada cosa

| Fichero | Comando | Qué responde |
|---|---|---|
| `generation.bench.ts` | `bench` | cuánto cuesta generar n documentos, y qué añaden los campos dependientes |
| `modules.bench.ts` | `bench` | qué módulo es caro (en tandas de 1000 llamadas) |
| `export.bench.ts` | `bench` | qué serializador es lento, sobre datos ya generados |
| `dataset.bench.ts` | `bench` | cuánto cuesta resolver referencias entre schemas |
| `scaling.ts` | `bench:scaling` | si la curva de n es la recta que debería ser, y cuánto pesa el GC |
| `size.ts` | `bench:size` | bytes de heap por documento, de salida por formato y de cada bundle |
| `tests-report.ts` | `bench:tests` | qué ficheros y qué tests alargan la CI |

Los cuatro `*.bench.ts` corren bajo `vitest bench`. Los tres scripts sueltos corren con `tsx`,
y por eso `scaling.ts` no se llama `scaling.bench.ts`: ese nombre lo recogería el glob de
vitest, que intentaría ejecutarlo como suite y fallaría.

## `src` o `dist`

Por defecto se mide `src/`, que es lo cómodo para iterar. Para medir lo que de verdad
instala el usuario —pasado por el treeshake de tsup y bajado a `es2020`— hay que construir
antes y cambiar el objetivo:

```shell
pnpm build:lib
$env:CHACA_BENCH_TARGET = "dist"; pnpm bench    # PowerShell
CHACA_BENCH_TARGET=dist pnpm bench              # bash
```

El peso de los bundles que da `bench:size` sale siempre de `dist/`, así que necesita un
build reciente para no mentir.

## Leer el delta

Un delta sólo se pinta en color cuando supera el ruido. El suelo son **10 puntos
porcentuales**, medido: dos corridas seguidas del mismo código en un portátil dieron
diferencias de hasta ±9.6%. En una máquina tranquila se puede bajar con
`CHACA_BENCH_NOISE=5`.

Eso también significa que **un baseline no es comparable entre máquinas**. El que está
versionado sirve de referencia relativa, no de cifra absoluta.

`bench:tests` es el único que no se compara con nada: la duración de un test incluye sus
aserciones y su setup, así que dice qué frena la CI, no qué tan rápida es la librería.
