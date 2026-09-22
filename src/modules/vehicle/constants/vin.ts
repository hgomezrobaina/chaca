/**
 * Data for the VIN check digit algorithm (position 9), as defined by
 * ISO 3779 / SAE J853 and mandated for VINs assigned in North America
 * (49 CFR 565). It's the same algorithm every real-world VIN validator
 * checks against, so a VIN built from this data validates as genuinely
 * correct, not just plausible-looking.
 */

/**
 * Every character a VIN can contain. `I`, `O` and `Q` are excluded by the
 * standard itself, to avoid confusion with `1` and `0`.
 */
export const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789".split("");

/** Numeric value of each letter for the check digit calculation. */
export const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

/** Weight applied to each of the 17 positions. Position 9 weighs 0: it's the check digit being computed, so it never contributes to its own value. */
export const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Model year codes for position 10, in order starting at `VIN_YEAR_CYCLE_START`.
 * The cycle is 30 codes long and then repeats (1980 and 2010 both encode as
 * `A`), which is a property of the standard itself, not something a decoder
 * can resolve from this character alone.
 */
export const VIN_YEAR_CODES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "R",
  "S",
  "T",
  "V",
  "W",
  "X",
  "Y",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];

export const VIN_YEAR_CYCLE_START = 1980;
