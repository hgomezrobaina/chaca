import { ExampleCaseTest } from "../core/example-case";
import { HOSPITAL_SCHEMAS } from "./definitions/definition";
import { HOSPITAL_RULES } from "./rules";
import { HospitalDataset } from "./types";

const example = new ExampleCaseTest<HospitalDataset>({
  name: "Hospital case",
  slug: "hospital",
  schemas: HOSPITAL_SCHEMAS,
  rules: HOSPITAL_RULES,
});

example.execute();
