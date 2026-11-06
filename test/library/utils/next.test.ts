import { chaca } from "../../../src";
import { describe, expect, it } from "vitest";

describe("utils.next", () => {
  it("500 calls. every value is in [0, 1)", () => {
    for (let i = 0; i < 500; i++) {
      const v = chaca.utils.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("500 calls. does not always return the same value", () => {
    const values = new Set<number>();

    for (let i = 0; i < 500; i++) {
      values.add(chaca.utils.next());
    }

    expect(values.size).toBeGreaterThan(1);
  });
});
