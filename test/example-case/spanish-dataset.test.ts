import { beforeAll, describe, expect, it } from "vitest";
import { chaca, Language, modules } from "../../src";
import { en } from "../../src/locales/en";
import { es } from "../../src/locales/es";

/**
 * E2E-16: a relational dataset built the way a real consumer would, through
 * the singleton `chaca`/`modules` (every other locale test uses a fresh
 * `ChacaModules` to keep registries from leaking between tests; this is the
 * one exception, because it exists to prove the real import path works).
 */

const DOCUMENTS = 15;

function profilesSchema() {
  return chaca.schema({
    country: () => modules.address.country({ language: Language.Spanish }),
    petType: () => modules.animal.type({ language: Language.Spanish }),
    favoriteColor: () => modules.color.human({ language: Language.Spanish }),
    birthMonth: () => modules.date.month({ language: Language.Spanish }),
    accountType: () =>
      modules.finance.accountType({ language: Language.Spanish }),
    jobArea: () => modules.person.jobArea({ language: Language.Spanish }),
    unit: () => modules.science.unit({ language: Language.Spanish }),
    vehicleType: () => modules.vehicle.type({ language: Language.Spanish }),
    favoriteVerb: () => modules.word.verb({ language: Language.Spanish }),
    bio: () => modules.lorem.sentence({ language: Language.Spanish }),
  });
}

interface ProfilesDataset {
  profiles: Profile[];
}

function profilesDataset() {
  return chaca.dataset<ProfilesDataset>([
    { name: "profiles", documents: DOCUMENTS, schema: profilesSchema() },
  ]);
}

interface Profile {
  country: string;
  petType: string;
  favoriteColor: string;
  birthMonth: string;
  accountType: string;
  jobArea: string;
  unit: string;
  vehicleType: string;
  favoriteVerb: string;
  bio: string;
}

/**
 * Asserts every profile's localized fields belong to the Spanish locale's own
 * catalogs. For the five catalogs with zero overlap with their English
 * counterpart (verified against the real data: `word.verbs`, `date.months`,
 * `finance.accountTypes`, `animal.types` and `lorem.words`), it also asserts
 * the value is absent from the English catalog. The other five categories
 * (`address.countries`, `color.human`, `person.jobAreas`, `science.units`,
 * `vehicle.types`) have genuine cognates shared with English — "Argentina",
 * "magenta", "Director", "newton (N)", "Convertible" — so asserting absence
 * from English there would be a flaky, false claim rather than a real check.
 */
function expectSpanishProfiles(profiles: Profile[]): void {
  const esCountries = es.address.countries.map((c) => c.country);
  const esUnits = Object.values(es.science.units);
  const enVerbs = en.word.verbs;
  const enMonths = en.date.months;
  const enAccountTypes = en.finance.accountTypes;
  const enAnimalTypes = en.animal.types;
  const enLoremWords = en.lorem.words;

  for (const profile of profiles) {
    expect(esCountries).toContain(profile.country);

    expect(es.animal.types).toContain(profile.petType);
    expect(enAnimalTypes).not.toContain(profile.petType);

    expect(es.color.human).toContain(profile.favoriteColor);

    expect(es.date.months).toContain(profile.birthMonth);
    expect(enMonths).not.toContain(profile.birthMonth);

    expect(es.finance.accountTypes).toContain(profile.accountType);
    expect(enAccountTypes).not.toContain(profile.accountType);

    expect(es.person.jobAreas).toContain(profile.jobArea);

    expect(esUnits).toContain(profile.unit);

    expect(es.vehicle.types).toContain(profile.vehicleType);

    expect(es.word.verbs).toContain(profile.favoriteVerb);
    expect(enVerbs).not.toContain(profile.favoriteVerb);

    const bioWords = profile.bio
      .toLowerCase()
      .replace(/[.,]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0);

    for (const word of bioWords) {
      expect(es.lorem.words).toContain(word);
      expect(enLoremWords).not.toContain(word);
    }
  }
}

describe("Spanish relational dataset (E2E-16)", () => {
  beforeAll(() => {
    modules.registerLocale(es);
  });

  it("generate(): every localized field of every document belongs to the Spanish locale", async () => {
    const data = await profilesDataset().generate();

    expect(data.profiles).toHaveLength(DOCUMENTS);
    expectSpanishProfiles(data.profiles);
  });

  it("transform to json: the exported file keeps every value Spanish", async () => {
    const [file] = await profilesDataset().transform({
      filename: "profiles",
      format: "json",
    });

    expect(file.filename).toBe("profiles.json");

    const parsed: { profiles: Profile[] } = JSON.parse(file.content);

    expect(parsed.profiles).toHaveLength(DOCUMENTS);
    expectSpanishProfiles(parsed.profiles);
  });

  it("transform to csv: the exported file has one Spanish-named header row and one row per document", async () => {
    const [file] = await profilesDataset().transform({
      filename: "profiles",
      format: "csv",
    });

    expect(file.filename).toBe("profiles.csv");

    const lines = file.content.split("\n");
    const [header, ...rows] = lines;

    expect(header).toBe(
      "country,petType,favoriteColor,birthMonth,accountType,jobArea,unit,vehicleType,favoriteVerb,bio",
    );
    expect(rows).toHaveLength(DOCUMENTS);

    for (const month of en.date.months) {
      expect(file.content).not.toContain(`,${month},`);
    }
  });
});
