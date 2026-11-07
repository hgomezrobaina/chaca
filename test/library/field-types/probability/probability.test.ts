import { WrongProbabilityFieldDefinitionError, chaca } from "../../../../src";
import { describe, expect, it } from "vitest";

function count(data: any[], value: number): number {
  let count = 0;
  for (const dat of data) {
    if (dat.prob === value) {
      count++;
    }
  }

  return count;
}

describe("Probability field", () => {
  it("create a schema with a probability field without values. Should throw an error", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([]),
    });

    await expect(schema.array(10)).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("all options with chance = 0. Should throw an error", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: 0, value: 10 },
        { chance: 0, value: 5 },
      ]),
    });

    await expect(schema.object()).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("option with chance greater than 1. Should throw an error", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([{ chance: 1.5, value: 10 }]),
    });

    await expect(schema.object()).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("option with negative chance. Should throw an error", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: -0.5, value: 10 },
        { chance: 0.5, value: 5 },
      ]),
    });

    await expect(schema.object()).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("option with a not number or function chance. Should throw an error", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([{ chance: "0.5" as any, value: 10 }]),
    });

    await expect(schema.object()).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("option that is not an object. Should throw an error", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([null as any]),
    });

    await expect(schema.object()).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("chance function that returns a not number value. Should throw an error", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([{ chance: () => "0.5" as any, value: 10 }]),
    });

    await expect(schema.object()).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("create a schema with a probability field with 3 elements", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: 0.8, value: 10 },
        { chance: 0.1, value: 5 },
        { chance: 0.1, value: 1 },
      ]),
    });

    const data = await schema.array(50);

    // every generated value belongs to the declared value set
    for (const doc of data) {
      expect([10, 5, 1]).toContain(doc.prob);
    }

    expect(count(data, 10)).toBeGreaterThanOrEqual(30);
  });

  it("probability field with function chance that returns 0.8", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: () => 0.8, value: 10 },
        { chance: 0.1, value: 5 },
        { chance: 0.1, value: 1 },
      ]),
    });

    const data = await schema.array(50);

    for (const doc of data) {
      expect([10, 5, 1]).toContain(doc.prob);
    }

    expect(count(data, 10)).toBeGreaterThanOrEqual(30);
  });

  it("probability field with an only option with chance=1. Should always return that value", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([{ chance: 1, value: 10 }]),
    });

    const data = await schema.array(20);

    expect(data.every((d) => d.prob === 10)).toBe(true);
  });

  it("probability field with 2 elements with 0.8 chance", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: 0.8, value: 10 },
        { chance: 0.8, value: 5 },
        { chance: 0.1, value: 1 },
      ]),
    });

    const data = await schema.array(100);
    const result = Math.abs(count(data, 10) - count(data, 5));

    expect(result).toBeLessThanOrEqual(40);
  });

  it("probability field with an option with chance=0. should never return that value", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: 0, value: 10 },
        { chance: 0.3, value: 5 },
        { chance: 0.2, value: 1 },
      ]),
    });

    const data = await schema.array(100);

    expect(count(data, 10)).toBe(0);
  });

  it("probability field with 3 options with different chances", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: 0.9, value: 10 },
        { chance: 0.3, value: 5 },
        { chance: 0.05, value: 1 },
      ]),
    });

    const data = await schema.array(1000);
    const result1 = count(data, 10);
    const result2 = count(data, 5);
    const result3 = count(data, 1);

    expect(result1).toBeGreaterThan(result2);
    expect(result2).toBeGreaterThan(result3);
  });

  it("chances summing less than 1. are normalized by their own sum, not padded with a null option", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: 0.2, value: 10 },
        { chance: 0.3, value: 5 },
      ]),
    });

    const data = await schema.array(1000);

    // every document got one of the two declared values: there is no
    // "remaining probability" that falls through to null or undefined.
    for (const doc of data) {
      expect([10, 5]).toContain(doc.prob);
    }

    // the sum is 0.5, so the relative split is still 0.2 : 0.3 (2 : 3).
    const ratio = count(data, 5) / count(data, 10);
    expect(ratio).toBeGreaterThan(1);
  });

  it("chances summing more than 1. normalize to the same split as the equivalent chances summing less than 1", async () => {
    // Each individual chance must stay within [0, 1] — only their sum can
    // exceed it. 0.2 : 0.3 (sum 0.5) and 0.6 : 0.9 (sum 1.5) are the same
    // 2 : 3 ratio.
    const schema = chaca.schema({
      prob: chaca.probability([
        { chance: 0.6, value: 10 },
        { chance: 0.9, value: 5 },
      ]),
    });

    const data = await schema.array(1000);
    const ratio = count(data, 5) / count(data, 10);

    expect(ratio).toBeGreaterThan(1);
  });

  it("a single option with chance = 0. should throw an error, the same as when every option does", async () => {
    const schema = chaca.schema({
      prob: chaca.probability([{ chance: 0, value: 10 }]),
    });

    await expect(schema.object()).rejects.toThrow(
      WrongProbabilityFieldDefinitionError,
    );
  });

  it("chance function. is re-evaluated per document, not fixed once for the whole array", async () => {
    const schema = chaca.schema({
      seed: chaca.sequence({ startsWith: 0, step: 1 }),
      prob: chaca.probability([
        {
          chance: ({ currentFields }: { currentFields: { seed: number } }) =>
            currentFields.seed % 2 === 0 ? 1 : 0,
          value: "even",
        },
        {
          chance: ({ currentFields }: { currentFields: { seed: number } }) =>
            currentFields.seed % 2 === 1 ? 1 : 0,
          value: "odd",
        },
      ]),
    });

    const data = await schema.array(10);

    for (const doc of data) {
      expect(doc.prob).toBe(doc.seed % 2 === 0 ? "even" : "odd");
    }
  });
});
