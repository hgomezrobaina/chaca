import { describe, expect, it } from "vitest";
import { modules } from "../../../src";

const ITERATIONS = 50;

describe("# Color modules tests", () => {
  it("color.human", () => {
    const value = modules.color.human();

    expect(modules.color.constants.human.en).include(value);
  });

  it("color.cssSupportedFunction", () => {
    const value = modules.color.cssSupportedFunction();

    expect(modules.color.constants.cssFunctions).include(value);
  });

  it("color.cssSupportedSpace", () => {
    const value = modules.color.cssSupportedSpace();

    expect(modules.color.constants.cssSpaces).include(value);
  });

  describe("color.rgb tests", () => {
    it("no arguments. should return a hex color: '#' + 6 hex chars", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.rgb();

        expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it("includeAlpha = true. should return a hex color: '#' + 8 hex chars", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.rgb({ includeAlpha: true });

        expect(value).toMatch(/^#[0-9a-fA-F]{8}$/);
      }
    });

    it("prefix = '0x', casing = 'lower'. should return '0x' + 6 lowercase hex chars", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.rgb({ prefix: "0x", casing: "lower" });

        expect(value).toMatch(/^0x[0-9a-f]{6}$/);
      }
    });

    it("format = 'css'. should return 'rgb(r, g, b)' with values between 0 and 255", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.rgb({ format: "css" });

        const match = value.match(/^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/);

        expect(match).not.toBeNull();

        for (const v of (match as RegExpMatchArray).slice(1, 4)) {
          const channel = Number(v);

          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        }
      }
    });

    it("format = 'css', includeAlpha = true. should return 'rgba(r, g, b, a)' with alpha between 0 and 1", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.rgb({ format: "css", includeAlpha: true });

        const match = value.match(
          /^rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), ([\d.]+)\)$/,
        );

        expect(match).not.toBeNull();

        const alpha = Number((match as RegExpMatchArray)[4]);

        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("color.cmyk tests", () => {
    it("no arguments. should return 'cmyk(c%, m%, y%, k%)' with percentages between 0 and 100", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.cmyk();

        const match = value.match(
          /^cmyk\((\d{1,3})%, (\d{1,3})%, (\d{1,3})%, (\d{1,3})%\)$/,
        );

        expect(match).not.toBeNull();

        for (const v of (match as RegExpMatchArray).slice(1, 5)) {
          const percent = Number(v);

          expect(percent).toBeGreaterThanOrEqual(0);
          expect(percent).toBeLessThanOrEqual(100);
        }
      }
    });

    it("format = 'binary'. should return 4 space-separated groups of bits", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.cmyk({ format: "binary" });

        const groups = value.split(" ");

        expect(groups).toHaveLength(4);

        for (const group of groups) {
          expect(group).toMatch(/^[01]+$/);
          expect([8, 32]).toContain(group.length);
        }
      }
    });
  });

  describe("color.hsl tests", () => {
    it("no arguments. should return 'hsl(Hdeg S% L%)'", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.hsl();

        expect(value).toMatch(/^hsl\(\d{1,3}deg \d{1,3}% \d{1,3}%\)$/);
      }
    });

    it("includeAlpha = true. should return 'hsl(Hdeg S% L% / A)'", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.color.hsl({ includeAlpha: true });

        expect(value).toMatch(
          /^hsl\(\d{1,3}deg \d{1,3}% \d{1,3}% \/ \d{1,3}\)$/,
        );
      }
    });
  });

  it("color.hwb. should return 'hwb(H W% B%)'", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const value = modules.color.hwb();

      expect(value).toMatch(/^hwb\(\d{1,3} \d{1,3}% \d{1,3}%\)$/);
    }
  });

  it("color.lch. should return 'lch(L% C H)'", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const value = modules.color.lch();

      expect(value).toMatch(/^lch\(\d{1,3}% \d+(\.\d+)? \d+(\.\d+)?\)$/);
    }
  });

  it("color.colorByCSSColorSpace with space = 'display-p3'. should return 'color(display-p3 x y z)' with values between 0 and 1", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const value = modules.color.colorByCSSColorSpace({ space: "display-p3" });

      const match = value.match(
        /^color\(display-p3 ([\d.]+) ([\d.]+) ([\d.]+)\)$/,
      );

      expect(match).not.toBeNull();

      for (const v of (match as RegExpMatchArray).slice(1, 4)) {
        const channel = Number(v);

        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
    }
  });
});
