import { ExampleCaseTest } from "../core/example-case";
import { ECOMMERCE_SCHEMAS } from "./definitions/definition";
import { ECOMMERCE_RULES } from "./rules";
import { EcommerceDataset } from "./types";

const example = new ExampleCaseTest<EcommerceDataset>({
  name: "Ecommerce case",
  slug: "ecommerce",
  schemas: ECOMMERCE_SCHEMAS,
  rules: ECOMMERCE_RULES,
});

example.execute();
