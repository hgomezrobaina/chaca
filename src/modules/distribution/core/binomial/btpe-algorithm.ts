import { RandomSource } from "../random-source";

interface Props {
  trials: number;
  probability: number;
}

/** The mode-relative quantities every acceptance check and ratio needs. */
interface ModeDistanceContext {
  y: number;
  m: number;
  n: number;
  r: number;
  q: number;
}

interface AcceptanceCheckProps extends ModeDistanceContext {
  npq: number;
  v: number;
}

/**
 * BTPE — binomial, Triangle, Parallelogram, (two) Exponential tails:
 * Kachitvichyanukul & Schmeiser (1988), "Binomial Random Variate Generation",
 * Communications of the ACM 31(2), reproduced with the same structure (and
 * the same named regions) in GSL's `gsl_ran_binomial`, R's `rbinom.c`, and
 * `rand_distr`. Constant cost per sample regardless of `trials`, unlike
 * BINV's `O(trials * p)`, which is why it takes over above
 * `BINOMIAL_BTPE_THRESHOLD`.
 *
 * The method samples `y` from one of four regions built around the mode
 * (a triangle, a parallelogram, and two exponential tails), then either
 * accepts it on a cheap quadratic squeeze or, when the squeeze is
 * inconclusive, falls back to the exact log of the binomial probability
 * ratio (the four `stirlingCorrection(...)` terms below).
 */
export class BinomialBtpeAlgorithm {
  constructor(private readonly source: RandomSource) {}

  execute({ trials, probability }: Props): number {
    const n = trials;
    const flipped = probability > 0.5;
    const r = flipped ? 1 - probability : probability;
    const q = 1 - r;
    const npq = n * r * q;

    const realValuedMode = n * r + r;
    const m = Math.floor(realValuedMode);
    const triangleHalfWidth =
      Math.floor(2.195 * Math.sqrt(npq) - 4.6 * q) + 0.5;
    const centerOffset = m + 0.5;
    const leftBound = centerOffset - triangleHalfWidth;
    const rightBound = centerOffset + triangleHalfWidth;
    const tailShape = 0.134 + 20.5 / (15.3 + m);

    const leftSlope =
      (realValuedMode - leftBound) / (realValuedMode - leftBound * r);
    const leftRate = leftSlope * (1 + leftSlope / 2);
    const rightSlope = (rightBound - realValuedMode) / (rightBound * q);
    const rightRate = rightSlope * (1 + rightSlope / 2);

    const triangleArea = triangleHalfWidth;
    const parallelogramBound = triangleArea * (1 + 2 * tailShape);
    const leftTailBound = parallelogramBound + tailShape / leftRate;
    const rightTailBound = leftTailBound + tailShape / rightRate;

    for (;;) {
      const u = this.source.next() * rightTailBound;
      const v = this.source.next();

      let y: number;
      let acceptanceValue = v;
      let needsSqueeze = true;

      if (u <= triangleArea) {
        y = Math.floor(centerOffset - triangleArea * v + u);
        needsSqueeze = false;
      } else if (u <= parallelogramBound) {
        const x = leftBound + (u - triangleArea) / tailShape;
        acceptanceValue =
          v * tailShape + 1 - Math.abs(centerOffset - x) / triangleArea;

        if (acceptanceValue > 1 || acceptanceValue <= 0) {
          continue;
        }

        y = Math.floor(x);
      } else if (u <= leftTailBound) {
        y = Math.floor(leftBound + Math.log(v) / leftRate);

        if (y < 0) {
          continue;
        }

        acceptanceValue = v * (u - parallelogramBound) * leftRate;
      } else {
        y = Math.floor(rightBound - Math.log(v) / rightRate);

        if (y > n) {
          continue;
        }

        acceptanceValue = v * (u - leftTailBound) * rightRate;
      }

      if (
        needsSqueeze &&
        !this.accepts({ y, m, n, r, q, npq, v: acceptanceValue })
      ) {
        continue;
      }

      return flipped ? n - y : y;
    }
  }

  /** Accept/reject test shared by the parallelogram and the two tail regions. */
  private accepts({ y, m, n, r, q, npq, v }: AcceptanceCheckProps): boolean {
    const k = Math.abs(y - m);

    if (k <= 20 || k >= npq / 2 - 1) {
      return v <= this.exactProbabilityRatio({ y, m, n, r, q });
    }

    const squeezeRadius =
      (k / npq) * ((k * (k / 3 + 0.625) + 1 / 6) / npq + 0.5);
    const logModeOffset = -(k * k) / (2 * npq);
    const logV = Math.log(v);

    if (logV < logModeOffset - squeezeRadius) {
      return true;
    }

    if (logV > logModeOffset + squeezeRadius) {
      return false;
    }

    return logV <= this.logProbabilityRatio({ y, m, n, r, q });
  }

  /** Exact ratio `binomial(y) / binomial(m)`, as a running product — used when `y` is close to the mode. */
  private exactProbabilityRatio({
    y,
    m,
    n,
    r,
    q,
  }: ModeDistanceContext): number {
    const oddsRatio = r / q;
    const scale = oddsRatio * (n + 1);

    let f = 1;

    if (m < y) {
      for (let i = m + 1; i <= y; i++) {
        f *= scale / i - oddsRatio;
      }
    } else if (m > y) {
      for (let i = y + 1; i <= m; i++) {
        f /= scale / i - oddsRatio;
      }
    }

    return f;
  }

  /**
   * `ln(binomial(y) / binomial(m))` via Stirling's series around each of the
   * four factorial terms it takes to express the ratio — used when `y` is
   * far from the mode, where the running product above would underflow.
   */
  private logProbabilityRatio({ y, m, n, r, q }: ModeDistanceContext): number {
    const centerOffset = m + 0.5;
    const x1 = y + 1;
    const f1 = m + 1;
    const z = n + 1 - m;
    const w = n - y + 1;

    return (
      centerOffset * Math.log(f1 / x1) +
      (n - m + 0.5) * Math.log(z / w) +
      (y - m) * Math.log((w * r) / (x1 * q)) +
      this.stirlingCorrection(f1 * f1) / f1 +
      this.stirlingCorrection(z * z) / z +
      this.stirlingCorrection(x1 * x1) / x1 +
      this.stirlingCorrection(w * w) / w
    );
  }

  /** The next term of Stirling's series beyond `1/(12t)`, evaluated at `t = x^2`. */
  private stirlingCorrection(t: number): number {
    return (13860 - (462 - (132 - (99 - 140 / t) / t) / t) / t) / 166320;
  }
}
