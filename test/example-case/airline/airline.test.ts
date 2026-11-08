import { ExampleCaseTest } from "../core/example-case";
import { AIRLINE_SCHEMAS } from "./definitions/definition";
import { AIRLINE_RULES } from "./rules";
import { AirlineDataset } from "./types";

const example = new ExampleCaseTest<AirlineDataset>({
  name: "Airline case",
  slug: "airline",
  schemas: AIRLINE_SCHEMAS,
  rules: AIRLINE_RULES,
});

example.execute();
