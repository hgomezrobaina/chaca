# Benchmarks

```shell
pnpm bench          # mide velocidad y dibuja, con delta contra el baseline
pnpm bench:report   # vuelve a dibujar el último resultado, sin medir
pnpm bench:save     # fija el último resultado como baseline
pnpm bench:snapshot <nombre>          # congela una corrida con nombre, para comparar después
pnpm bench:compare <antes> <después>  # compara dos snapshots

pnpm bench:scaling  # cómo escala la generación (mitata: barras, caja y GC)
pnpm bench:size     # memoria por documento, peso de cada formato y de los bundles
pnpm bench:tests    # qué tests frenan la suite
pnpm bench:history  # cómo han evolucionado los tiempos entre corridas

pnpm bench:competitors <nombre>  # chaca contra faker, chance y falso; congela un snapshot
pnpm bench:uniqueness [n]        # % de valores distintos en las cuatro, sobre n llamadas
pnpm bench:competitors:size      # memoria por documento en las cuatro, y salida sólo de chaca
```

`bench/baseline.json` se versiona: es la referencia contra la que se pinta el delta.
`bench/results/` no, es el resultado de la última corrida. `bench/snapshots/` sí se
versiona — ver [Snapshots](#snapshots) más abajo.

## Qué mide cada cosa

| Fichero               | Comando                  | Qué responde                                                             |
| --------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `generation.bench.ts` | `bench`                  | cuánto cuesta generar n documentos, y qué añaden los campos dependientes |
| `modules.bench.ts`    | `bench`                  | qué módulo es caro (en tandas de 1000 llamadas)                          |
| `export.bench.ts`     | `bench`                  | qué serializador es lento, sobre datos ya generados                      |
| `dataset.bench.ts`    | `bench`                  | cuánto cuesta resolver referencias entre schemas                         |
| `scaling.ts`          | `bench:scaling`          | si la curva de n es la recta que debería ser, y cuánto pesa el GC        |
| `size.ts`             | `bench:size`             | bytes de heap por documento, de salida por formato y de cada bundle      |
| `tests-report.ts`     | `bench:tests`            | qué ficheros y qué tests alargan la CI                                   |
| `history.ts`          | `bench:history`          | si hay una deriva lenta que ningún delta suelto delata                   |
| `competitors.ts`      | `bench:competitors`      | chaca contra faker, chance y falso, operación por operación              |
| `uniqueness.ts`       | `bench:uniqueness`       | qué porcentaje de las llamadas da un valor distinto, en las cuatro       |
| `competitors-size.ts` | `bench:competitors:size` | memoria por documento en las cuatro, y peso de la salida sólo de chaca   |

Los cuatro `*.bench.ts` corren bajo `vitest bench`. Los siete scripts sueltos corren con `tsx`,
y por eso ninguno se llama `*.bench.ts`: ese nombre lo recogería el glob de vitest, que
intentaría ejecutarlo como suite y fallaría — y en el caso de los tres de la comparativa,
metería a `@faker-js/faker`, `chance` y `@ngneat/falso` en el baseline versionado y en el
histórico de Chaca, que son solo de Chaca.

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

## La comparativa

`competitors.ts`, `uniqueness.ts` y `competitors-size.ts` miden a Chaca contra
`@faker-js/faker`, `chance` y `@ngneat/falso` — las tres librerías vivas de npm con las que
compite de verdad (el informe de competencia descartó `casual`, sin publicar desde 2019, y
`@snaplet/copycat`, que resuelve otro problema). Las tres son `devDependencies`: no viajan en
el paquete publicado (`npm pack --dry-run` lo confirma).

**Toda cifra que se vaya a publicar se mide con `dist`, no con `src`.** Es la única
comparación justa: los tres competidores se miden como paquetes instalados, y `src/` no pasa
por el treeshake de tsup ni baja a `es2020`.

```shell
pnpm build:lib
CHACA_BENCH_TARGET=dist pnpm bench:competitors <nombre>
CHACA_BENCH_TARGET=dist pnpm bench:uniqueness 10000
CHACA_BENCH_TARGET=dist pnpm bench:competitors:size
```

**Las operaciones comparadas son un dato, no código repartido:**
`bench/competitors/operations.ts` declara cada una con su función en las cuatro librerías, o
`null` cuando una no tiene equivalente. Una fila sin equivalente se dibuja como «sin
equivalente: `<librería>`», nunca como una barra de longitud cero — comparar contra cero no
dice nada, y rellenar el hueco inventaría un dato.

**Ninguna de las cuatro corre con semilla fijada.** `@faker-js/faker`, `chance` y
`@ngneat/falso` admiten semilla y Chaca no: fijarla en tres y no en la cuarta mediría cuatro
cosas distintas, así que las cuatro se miden en su modo por defecto. La consecuencia es
honesta: el tiempo es reproducible dentro del suelo de ruido de la sección
[Leer el delta](#leer-el-delta), no al valor exacto, para las cuatro por igual.
`bench:uniqueness` mide con muchas llamadas (10 000 por defecto) precisamente para que esa
cifra sea estable sin necesitar semilla.

**`bench:competitors` no entra en el glob de `vitest bench`** (como `scaling.ts`, por el mismo
motivo: metería a tres librerías ajenas en el baseline y el histórico de Chaca) y mide con
`measure()` de mitata, caso por caso, protegido con `do_not_optimize` contra la eliminación de
código muerto. El snapshot que guarda es uno normal (`Snapshot` de `shared/snapshot.ts`), con
las versiones exactas de los tres competidores como campo de más — así `bench:compare` lo lee
sin cambios, y agrupa por operación porque la clave de cada caso sigue la misma forma
`<fichero> > <grupo>::<caso>` que deja `vitest`.

`bench:uniqueness` y `bench:competitors:size` sí son independientes del hardware: miden
porcentajes de catálogo y bytes de heap, no tiempo, así que sus cifras no necesitan la
disciplina de `--ref` ni de una sola sesión que sí exige `bench:competitors`.

## Snapshots

`bench/baseline.json` es un único fichero que cada `pnpm bench:save` pisa: sirve para el
delta del día a día, no para guardar un punto concreto al que volver. Para un "antes/después"
publicable —el número que va en un CHANGELOG o un artículo— hace falta algo con nombre que no
se pise:

```shell
pnpm bench:snapshot v2.3.0                          # mide el árbol tal cual está ahora
pnpm bench:snapshot v2.3.1 --ref perf/benchmark-findings
pnpm bench:snapshot solo-fase-1 --ref 515dfeb --bench bench/dataset.bench.ts
```

Cada snapshot queda en `bench/snapshots/<nombre>.json`, versionado, con el commit, la
versión de `package.json`, `target` y `platform` en los que se midió, además de las cifras.

Los cuatro que hay hoy son la cadena del trabajo de rendimiento de 2.3.1, medidos de una
sentada para que se puedan comparar entre sí:

| snapshot | commit    | añade                                                       |
| -------- | --------- | ----------------------------------------------------------- |
| `v2.3.0` | `74df0bc` | el punto de partida                                         |
| `fase-0` | `7c5fd7d` | las listas de `person` cacheadas                            |
| `fase-1` | `515dfeb` | el objeto del documento construido de una pasada            |
| `v2.3.1` | `047a4ff` | el `ref` que deja de rehacer lo que no cambia por documento |

Están para que cada cifra del CHANGELOG se pueda reimprimir en vez de creerse: el "3.8x" de
la fase 1 es `bench:compare fase-0 fase-1` —y no `v2.3.0 fase-1`, que le colgaría también la
mejora de `person`—, y el "6.1x" de la versión entera es `bench:compare v2.3.0 v2.3.1`.

`--ref <commit-o-rama>` hace `git checkout`, mide, y vuelve a donde estabas —incluso si la
medición falla a medio camino—. Exige un árbol de trabajo limpio: con cambios sin commitear el
checkout se los llevaría al otro commit. Y sólo funciona en commits que ya traigan este propio
harness de benchmarks; no hay forma de medir un punto anterior a
`chore: add benchmark harness`.

**Por qué el checkout y no comparar contra un snapshot viejo:** el ruido entre corridas (ver
[Leer el delta](#leer-el-delta)) puede llegar al 10% en la misma máquina, el mismo minuto. Dos
snapshots tomados en sesiones distintas, o en máquinas distintas, no son comparables aunque el
JSON lo permita — por eso `bench:compare` se niega a comparar dos snapshots que no compartan
`target` y `platform`. Para un "antes/después" real, `--ref` mide las dos cosas seguidas, en el
mismo proceso, en la misma máquina.

### Comparar dos snapshots

```shell
pnpm bench:compare v2.3.0 v2.3.1                              # dibuja en consola
pnpm bench:compare v2.3.0 v2.3.1 --json bench/results/out.json  # y deja un JSON normalizado
```

Dibuja una barra por caso —dentro del grupo, según el tiempo del segundo snapshot— y el delta
entre los dos, con el mismo suelo de ruido que `report.ts`. Un caso que sólo exista en uno de los
dos snapshots (un benchmark nuevo, o uno que se quitó) se marca como tal en vez de compararse
contra cero.

El `--json` es el fichero pensado para que lo lea otra herramienta —hoy, la composición de
Remotion que dibuja las imágenes del CHANGELOG o de un artículo—: trae la metadata de los dos
snapshots (`name`, `version`, `commit`, `ref`) y, por caso, `before`/`after` con `mean`/`hz`/`rme`
más el `changePercent` y si es `significant` o sólo ruido.

## El histórico

Cada `pnpm bench` deja un registro compacto en `bench/history/` —sólo las cifras que se
dibujan, no los `samples` de vitest— y `pnpm bench:history` los pinta como una línea por caso.
La carpeta **no** se versiona: un tiempo medido aquí no es comparable con el de otra máquina,
así que un histórico compartido mezclaría series que no tienen nada que ver.
`CHACA_BENCH_HISTORY` la lleva a otro sitio.

La tendencia compara la **mediana de la primera mitad de la serie con la de la segunda**, no el
primer punto con el último: con tres corridas del mismo código, esa comparación punto a punto
marcaba derivas del 14% y del 25% que eran sólo ruido. Por debajo de **seis corridas** no se
saca conclusión, sólo se dibuja la forma.

## En CI

`pnpm bench:ci` corre las suites e imprime las cifras con `--no-compare --no-history`: el
baseline versionado se midió en otro sitio, y compararlo en un runner compartido daría rojos
que no significan nada. El paso de `dev.yml` lleva `continue-on-error`, así que **nada falla por
un número**. Está ahí para acumular el dato que falta —cuánta varianza tiene el runner entre
corridas— y decidir después el umbral, o pasar a CodSpeed, que instrumenta en vez de cronometrar.

## Leer el delta

Un delta sólo se pinta en color cuando supera el ruido. El suelo son **10 puntos
porcentuales**, medido: dos corridas seguidas del mismo código en un portátil dieron
diferencias de hasta ±9.6%. En una máquina tranquila se puede bajar con
`CHACA_BENCH_NOISE=5`.

Eso también significa que **un baseline no es comparable entre máquinas**. El que está
versionado sirve de referencia relativa, no de cifra absoluta.

`bench:tests` es el único que no se compara con nada: la duración de un test incluye sus
aserciones y su setup, así que dice qué frena la CI, no qué tan rápida es la librería.
