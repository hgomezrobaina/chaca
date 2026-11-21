import { describe, expect, it } from "vitest";
import { modules } from "../../../src";

describe("data.weekDay", () => {
  it("should return a week day constant value", () => {
    expect(modules.date.constants.weekDays.en).include(modules.date.weekDay());
  });
});
