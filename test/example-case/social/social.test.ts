import { ExampleCaseTest } from "../core/example-case";
import { SOCIAL_SCHEMAS } from "./definitions/definition";
import { SOCIAL_RULES } from "./rules";
import { SocialDataset } from "./types";

const example = new ExampleCaseTest<SocialDataset>({
  name: "Social case",
  slug: "social",
  schemas: SOCIAL_SCHEMAS,
  rules: SOCIAL_RULES,
});

example.execute();
