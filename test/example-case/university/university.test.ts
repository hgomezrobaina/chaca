import { ExampleCaseTest } from "../core/example-case";
import { UNIVERSITY_SCHEMAS } from "./definitions/definition";
import { UNIVERSITY_RULES } from "./rules";
import { UniversityDataset } from "./types";

const example = new ExampleCaseTest<UniversityDataset>({
  name: "University case",
  slug: "university",
  schemas: UNIVERSITY_SCHEMAS,
  rules: UNIVERSITY_RULES,
});

example.execute();
