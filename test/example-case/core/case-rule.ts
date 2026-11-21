/**
 * A business rule of an example case, documented and verified in the same
 * place. `text` and `fields` feed the entity field tables of `schema.md`
 * (see `core/schema/schema-document.ts`); `check` is the rule's own
 * assertion, run against the dataset generated once for the whole case.
 *
 * A rule without a passing `check` cannot be documented, because the rule
 * *is* its own test.
 */
export interface CaseRule<K> {
  /** Stable id, printed in the docs: "R1", "R2"... */
  id: string;
  /** What the rule guarantees, in English, one sentence. */
  text: string;
  /** The `Entity.field`s this rule governs. */
  fields: string[];
  /** The assertion. Receives the whole generated dataset, typed. */
  check: (data: K) => void;
}
