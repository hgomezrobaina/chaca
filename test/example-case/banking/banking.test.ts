import { ExampleCaseTest } from "../core/example-case";
import { BANKING_SCHEMAS } from "./definitions/definition";
import { BANKING_RULES } from "./rules";
import { BankingDataset } from "./types";

const example = new ExampleCaseTest<BankingDataset>({
  name: "Banking case",
  slug: "banking",
  schemas: BANKING_SCHEMAS,
  rules: BANKING_RULES,
});

example.execute();
