/**
 * The one capability every sampling algorithm needs: a number in `[0, 1)`.
 *
 * `ChacaUtils` satisfies this structurally (it has a `next()` method), so the
 * real source in production is `ChacaUtils` itself, no cast involved. Tests use
 * a literal `{ next: () => ... }` to make an algorithm's transformation exact
 * and reproducible.
 */
export interface RandomSource {
  next(): number;
}
