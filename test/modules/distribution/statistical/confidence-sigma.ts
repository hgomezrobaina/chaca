/**
 * How many standard errors a sample's mean or variance may drift from theory
 * before a statistical test fails.
 *
 * 6 sigma keeps the false-failure rate of a single check around 1 in 500
 * million — negligible even run across 8 distributions on every CI build —
 * while still catching an actually wrong algorithm, which misses by orders
 * of magnitude of sigma, not by one or two.
 */
export const CONFIDENCE_SIGMA = 6;
