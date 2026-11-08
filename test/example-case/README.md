# Example cases

Real-world usage examples of `chaca`. Each case defines a relational dataset that mimics a production domain, generates it and validates its business rules.

These tests serve two purposes:

1. **Integration testing** — they exercise the generation pipeline (`chaca.dataset` → `generate()`) with schemas that combine most of the library's features: `chaca.key`, `chaca.ref` (with `unique` and `where` filters), `chaca.enum`, `chaca.probability`, `possibleNull`, dynamic `documents` counts, and cross-schema lookups through the `store`.
2. **Living documentation** — they show how to model a realistic domain with chaca. If you want to learn how to build relational datasets, start here.

## Cases

| Case                            | Domain                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| [ecommerce](ecommerce/README.md)   | Online store: users, products, orders, payments, shipments, support. |
| [university](university/README.md) | University: students, courses, registrations, grades, library.       |
| [airline](airline/README.md)       | Flight network: fleet, routes, crews, bookings, check-ins, baggage.  |
| [hospital](hospital/README.md)     | Hospital: admissions, bed assignments, appointments, prescriptions, billing. |
| [banking](banking/README.md)       | Banking core: customers, accounts, double-entry transfers, cards, loans.     |
| [social](social/README.md)         | Social network: users, follows, posts, threaded comments, reactions, DMs.    |

## Structure

Each case lives in its own folder, next to the shared runner:

```
example-case/
├── core/
│   ├── example-case.ts     # ExampleCaseTest<K>: generates once, runs every rule + the schema doc checks
│   ├── case-rule.ts         # CaseRule<K>: a business rule, with its own assertion
│   ├── find-ref.ts          # FindRef: resolves a chaca.ref to its document, or throws clearly
│   └── schema/               # SchemaReader, ColumnTypes, MermaidDiagram, SchemaDocument
└── <case>/
    ├── README.md           # Domain, entities and modeling notes — written by hand
    ├── schema.md            # GENERATED: erDiagram + one field table per entity + the rule table
    ├── types.ts             # One interface per entity, one enum per closed set of values
    ├── rules.ts              # CaseRule<K>[] — every business rule, with its assertion inline
    ├── <case>.test.ts        # Entry point: instantiates and runs ExampleCaseTest
    └── definitions/          # One chaca.schema per entity + definition.ts exporting <CASE>_SCHEMAS
```

A rule is never just prose: `CaseRule.check` *is* its test, so a rule documented in `schema.md` without a passing assertion can't exist. `ExampleCaseTest` (in [core/example-case.ts](core/example-case.ts)) generates the dataset once, runs the meta-rules (unique rule ids, every `fields` entry pointing at a real field, every entity covered by at least one rule), runs each case rule as its own `it`, regenerates `schema.md` and checks it's still valid mermaid and up to date with the schemas, and finally writes a generation report. The serialization of each format is covered by the content-based tests in `test/library/extensions`.

### Running a single case

```
npx vitest run test/example-case/<case>
```

Every case is its own test file, so this generates and validates only that one case instead of all six.

### The generation report

Every case writes `data/cases/<slug>/report.md` on each run: row counts per entity, and per field the number of real nulls, distinct values, and (for numbers and dates) the minimum and maximum — computed on the data the rules already hold, never a second generation. It's not versioned (`data/` is in `.gitignore`); open it after a run to see the shape of what actually got generated, e.g. to spot a problem like "8 declared departments collapsing into 3 distinct names" without reading the raw data.

### Regenerating the documentation

`schema.md` is a snapshot: if a schema changes, its test fails with a diff instead of silently going stale. To accept an intentional change:

```
npm run test:cases:docs
```

This re-runs the suite with vitest's `-u` (update snapshots) and rewrites every case's `schema.md`. Always re-read the diff before committing it — a change here should be explainable by a change you just made to a `definitions/*.ts` or `rules.ts` file.

## Adding a new case

1. Create `<your-case>/types.ts` with one interface per entity, one enum per closed set of values, and the dataset interface.
2. Create `<your-case>/definitions/` with one schema file per entity and a `definition.ts` exporting `<YOUR_CASE>_SCHEMAS: DatasetSchema[]`.
3. Create `<your-case>/rules.ts` with a `CaseRule<YourCaseDataset>[]`: every business rule of your domain, each with its own `check`. Every entity needs at least one rule.
4. Create `<your-case>/<your-case>.test.ts` instantiating `ExampleCaseTest<YourCaseDataset>` with the case's name, schemas and rules.
5. Write `<your-case>/README.md`: the domain, the entities table and any modeling notes. Don't hand-write the diagram or the field tables — run `npm run test:cases:docs` to generate `schema.md` and link it from the README.
6. Run `npm run test:cases` and `npm run typecheck:cases` (the one that actually type-checks `test/`; plain `npm run typecheck` only covers `src/`).
