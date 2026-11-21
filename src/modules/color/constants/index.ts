/**
 * Color space names supported by CSS.
 */
export const CSS_SPACES = [
  "sRGB",
  "display-p3",
  "rec2020",
  "a98-rgb",
  "prophoto-rgb",
] as const;

/**
 * Functions supported by CSS to produce color.
 */
export const CSS_FUNCTIONS = [
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "cmyk",
  "lab",
  "lch",
  "color",
] as const;

export type CSSFunction = (typeof CSS_FUNCTIONS)[number];
export type CSSSpace = (typeof CSS_SPACES)[number];
