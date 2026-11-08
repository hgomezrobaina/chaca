import { modules } from "../../../src";
import { describe, expect, it } from "vitest";

describe("person modules", () => {
  it("person.gender", () => {
    const value = modules.person.gender();
    expect(modules.person.constants.genders.en.includes(value)).toBe(true);
  });

  it("person.jobArea", () => {
    const value = modules.person.jobArea();
    expect(modules.person.constants.jobAreas.en.includes(value)).toBe(true);
  });

  it("person.jobLevel", () => {
    const value = modules.person.jobLevel();
    expect(modules.person.constants.jobLevels.en.includes(value)).toBe(true);
  });

  it("person.language", () => {
    const value = modules.person.language();
    expect(modules.person.constants.languages.en.includes(value)).toBe(true);
  });

  it("person.prefix", () => {
    const value = modules.person.prefix();
    const all = [
      ...modules.person.constants.prefixes.en.female,
      ...modules.person.constants.prefixes.en.male,
    ];
    expect(all.includes(value)).toBe(true);
  });

  it("person.prefix with sex = 'male'", () => {
    const value = modules.person.prefix({ sex: "male" });
    expect(modules.person.constants.prefixes.en.male.includes(value)).toBe(
      true,
    );
  });

  it("person.prefix with sex = 'female'", () => {
    const value = modules.person.prefix({ sex: "female" });
    expect(modules.person.constants.prefixes.en.female.includes(value)).toBe(
      true,
    );
  });

  it("person.sex", () => {
    const value = modules.person.sex();
    expect(modules.person.constants.sexs.en.includes(value)).toBe(true);
  });

  it("person.zodiacSign", () => {
    const value = modules.person.zodiacSign();
    expect(modules.person.constants.zodiacSigns.en.includes(value)).toBe(true);
  });
});
