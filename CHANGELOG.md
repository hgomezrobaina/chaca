# chaca@2.3.1

## ⚡ Performance

- **Building a document's plain object was quadratic in its number of fields.** Every place that hands your functions a document — `currentFields` in `custom`, `isArray`, `possibleNull`, `pick.count` and `probability.chance`, `refFields`/`currentFields` in a `ref`'s `where`, the results of `store.get()` and `store.currentDocuments()`, and the dataset `generate()` returns — went through a loop that spread the object built so far into a brand new one for each field. A document with 20 fields allocated 20 objects of growing size instead of one, and a `ref` with a `where` paid that twice for every (document, candidate) pair.

  Nothing about the result changes — still a fresh object on every call, same keys in the same order — but the relational dataset in the benchmarks is now **4x faster** at 3500 documents (1014 ms → 252 ms) and 2.3x at 350 (14.2 ms → 6.1 ms). The wider your documents, the bigger the difference.

- **`modules.person.firstName()` no longer rebuilds the name list on every call.** Called without a `sex` it fell into a branch that spread `male` and `female` into a brand new array each time, so it was measurably _slower_ than `fullName()` despite doing less work — `fullName()` picks a random sex first and therefore got the language's list by reference. The joined list is now built once per language and reused, which makes `firstName()` about **16x faster** and puts it back ahead of `fullName()`.
- **`modules.person.prefix()` built its list of prefixes on every call too**, even when given a `sex` and therefore about to ignore it. Same fix: the joined list is built once and reused, and it is no longer built at all when a `sex` is given. Roughly **5x faster** without a `sex` and **4x** with one.

# chaca@2.3.0

## 🌚 Features

### Errors now say which field caused them

- **When a `custom`, `isArray`, `possibleNull`, `pick.count`, `probability.chance` or `ref.where` function throws, the error now says which field failed, in which document, and while doing what** — instead of the bare error propagating with no way to tell where in the schema it came from. All of these extend the new `FieldGenerationError`:
  - `ValueGenerationError` — a field's own value function (`custom`, `pick`, `probability`, ...) threw.
  - `PossibleNullFunctionError` — a field's `possibleNull` function threw.
  - `IsArrayFunctionError` — a field's `isArray` function threw.
  - `RefWhereFunctionError` — a `ref`'s `where` function threw. Also names the field it references.
  - `SchemaCountFunctionError` — a schema's `documents` function threw. Not a `FieldGenerationError`, since it isn't tied to a field or a document.

  ```ts
  import { chaca, Errors } from "chaca";

  const schema = chaca.schema({
    email: () => {
      throw new Error("faker.internet.emial is not a function");
    },
  });

  try {
    await schema.object();
  } catch (error) {
    if (error instanceof Errors.FieldGenerationError) {
      console.log(error.fieldRoute); // "Schema.email"
      console.log(error.message); // "On field 'Schema.email' (document 0), while generating its value. faker.internet.emial is not a function"
      console.log(error.originalError); // the original Error thrown by the function
    }
  }
  ```

  The original error is preserved untouched in `originalError` and as the standard `cause`. A `ChacaError` thrown by a field's function (for example one raised while reading another field through the `store`) is never wrapped: it already carries its own context and type, and rethrowing it as-is keeps the deepest, most useful error visible with `instanceof`.

### `modules.vehicle.vin`

- **New `modules.vehicle.vin()` method**, returning a 17-character Vehicle Identification Number ([ISO 3779](https://en.wikipedia.org/wiki/Vehicle_identification_number)). The check digit (position 9) is computed with the same algorithm real-world VIN validators use, so the result validates as genuinely correct, not just plausible-looking. It also starts with one of a curated list of real World Manufacturer Identifiers (exposed as `modules.vehicle.constants.wmi`) and encodes a model year at position 10.

  ```ts
  import { modules } from "chaca";

  modules.vehicle.vin(); // '1HGBH41JXMN109186'
  modules.vehicle.vin({ year: 2018 }); // 'WBA5A5C50JD123456'
  ```

## 🪛 Fix

- **Every `modules.image` method returned a dead url.** The whole module pointed at `lexica.art`, whose API now answers `500` (and `403` from Cloudflare at the root), and `modules.image.animatedAvatar` pointed at `api.multiavatar.com`, which now answers `403`. All image methods now return urls that resolve to an actual image again.
- The image urls were **never image urls in the first place**. `https://lexica.art/api/v1/search?q=...` is a _search_ endpoint that responds with JSON, so the value could never be used in an `<img src>` even while the service was up.
- **`width` and `height` were ignored.** They were appended as query params to that search endpoint, which does not accept them, so the requested size had no effect whatsoever. Both are now part of the url and are honoured by the provider.
- A `category` containing whitespace (`"sports car"`) produced a url that the image host rejects with `403`. Whitespace now separates tags, and a category left with no usable characters falls back to a valid tag instead of building a broken url.

## ⚠️ Behavior changes

- **A non-`ChacaError` thrown inside a field's function is no longer the error you catch.** It now arrives wrapped in a `FieldGenerationError` subclass (see above), with the original error moved to `.cause` / `.originalError`. Code that does `catch (error) { if (error.message === "...") }` on one of these should switch to checking `error.cause?.message` (or `error.originalError`), and `instanceof` checks for anything other than `Error`/`ChacaError` should check the `cause` chain instead.
- Image urls are now served by **loremflickr** and have the shape `https://loremflickr.com/<width>/<height>/<tags>?lock=<n>` — the size lives in the path, not in query params, and the category is a path segment rather than a `q` query param. This matches the output the README has always documented. Update any snapshot or assertion that matched the previous `lexica.art` url.
- `modules.image.animatedAvatar` now returns a **dicebear** url (`https://api.dicebear.com/9.x/adventurer/svg?seed=<n>`) instead of a multiavatar one. Its seed range also widened from 1,000 to 1,000,000 possible avatars, so large datasets no longer repeat the same handful of pictures.
- A `width` or `height` of `0` or less is clamped to `1` instead of producing an invalid url.

# chaca@2.2.0

## 🌚 Features

### Browser support

- **`chaca` is now isomorphic.** It can be installed and used in browser apps (React, Vue, Svelte, etc.), not only in Node. Your bundler automatically resolves the browser-safe build through the package `exports` map — no configuration needed.
- The package now ships **both ESM and CommonJS** builds, each with its own type definitions.
- Use `transform` to serialize your data to any supported format (`json`, `csv`, `yaml`, `postgresql`, `java`, `python`, `typescript`, `javascript`) fully **in memory**. This is the way to obtain file contents in the browser (e.g. to trigger a download):

  ```ts
  import { chaca, modules } from "chaca";

  const schema = chaca.schema({
    id: chaca.key(() => modules.id.uuid()),
    name: () => modules.person.firstName(),
  });

  const [file] = await schema.transform(50, {
    filename: "users",
    format: "json",
  });

  // file.filename -> "users.json"
  // file.content  -> serialized string, ready to download or display
  ```

- The `FileWriter` type is now exported, so advanced users can plug in a custom output target when constructing a `Schema`/`Dataset`.

### Errors

- Every exception is now grouped under a single `Errors` namespace for easier discovery:

  ```ts
  import { Errors } from "chaca";

  try {
    await schema.export(/* ... */);
  } catch (e) {
    if (e instanceof Errors.TryRefANoKeyFieldError) {
      /* handle the specific error */
    }
    if (e instanceof Errors.ChacaError) {
      /* catch-all for any chaca error */
    }
  }
  ```

- `WrongArrayDefinitionError`, `WrongPossibleNullDefinitionError` and `WrongProbabilityFieldDefinitionError` — announced back in `2.0.0` but never actually exported — are now reachable through the `Errors` namespace. The existing flat error exports (`ChacaError`, `TryRefANoKeyFieldError`, ...) keep working unchanged.

### SQLite export

- New `sqlite` export format, available in `export`, `transform` and the CLI (`chaca sqlite`). It shares every option with the `postgresql` format (`keys`, `uniques`, `nulls`, `refs`, `generateIds`, `declarationOnly`, ...):

  ```ts
  await dataset.export({
    filename: "data",
    location: "./data",
    format: "sqlite",
  });
  ```

- The generated script enables `PRAGMA foreign_keys = ON` and uses SQLite-native types: `INTEGER PRIMARY KEY` for generated ids, `TEXT` for strings and dates (ISO format), `REAL` for floats and `INTEGER` for bigints.

### MySQL export

- New `mysql` export format, available in `export`, `transform` and the CLI (`chaca mysql`). It shares every option with the `postgresql` and `sqlite` formats (`keys`, `uniques`, `nulls`, `refs`, `generateIds`, `declarationOnly`, ...):

  ```ts
  await dataset.export({
    filename: "data",
    location: "./data",
    format: "mysql",
  });
  ```

- The generated script uses MySQL-native types and syntax: `INT AUTO_INCREMENT PRIMARY KEY` for generated ids, `VARCHAR(255)`/`TEXT` for strings, `DATETIME(3)` for dates, `DOUBLE` for floats and `BIGINT` for bigints. Identifiers that collide with MySQL reserved words are quoted with backticks, and foreign keys are declared as table-level `FOREIGN KEY` constraints (InnoDB ignores inline column `REFERENCES` clauses).
- MySQL limitations to be aware of: `DOUBLE` cannot represent `Infinity`/`NaN`, so infinities are clamped to the `DOUBLE` range limits (`±1.7976931348623157e+308`) and `NaN` is exported as `NULL` (add the column to `nulls` if your data contains `NaN`). Backslashes in strings are escaped (`\` → `\\`), since MySQL treats them as escape characters.

### Sequence field

- `chaca.sequence` now accepts the correctly-spelled `startsWith` option. The misspelled `starsWith` keeps working as a deprecated alias (when both are passed, `startsWith` wins).

## 🪛 Fix

- `transform` on a relational JSON dataset without `separate` returned an unresolved value instead of the serialized data. It now returns the correct output.
- `chaca.pick` with a `count: { min, max }` range could never select `max` elements (the upper bound was effectively exclusive). The range is now inclusive, as documented.
- `isArray: { min, max }` had the same problem: the generated array could never reach `max` elements. The upper bound is now inclusive.
- `Dataset.generate()` threw synchronously for reference-wiring errors (`TryRefANoKeyFieldError`, `NotExistRefFieldError`), so a `.catch()` on the returned promise never caught them. All errors now surface as promise rejections.
- A `probability` field where every option has `chance: 0` silently produced `undefined`. It now throws a descriptive `WrongProbabilityFieldDefinitionError`.
- Documentation fixes: `possibleNull` now documents the integer semantics (an integer ≥ 1 is an exact count of null documents, a float in [0, 1] is a probability); the `isArray` doc no longer lists `boolean` as a valid config (it never was); `modules.datatype.int` documents that `max` is exclusive.
- Exporting relational **TypeScript** data with `separate: true` did not await the resolved data; the generated files now contain the fully resolved values.
- `modules.datatype.hexadecimal` could include the character `G`, which is not a valid hexadecimal digit. The output is now always valid hex.
- `modules.address.country` never matched the continents `Oceania` and `Antarctica` because the `continent` type declared them as `"Oseania"` and `"Antartica"`; filtering by those continents silently fell back to any country. The type now uses the correct names.
- `modules.date.past`, `modules.date.soon` and `modules.date.between` no longer **mutate** the `refDate`/`to` `Date` object you pass in — they work on a copy. This also fixes `between({ to })`, which could return a value outside the expected range because `from` and `to` ended up being the same mutated object.
- `modules.date.timeAgo()` without arguments can now return `"N months ago"`; the `months` unit was missing from the random unit pool.
- `modules.internet.email` with a provider that already contains a TLD (e.g. `{ provider: 'yahoo.com' }`) no longer appends an extra `.com` (`pedro@yahoo.com.com` → `pedro@yahoo.com`). Providers without a dot keep getting `.com` appended.
- `modules.system.filename` with an extension that starts with a dot (e.g. `{ ext: '.gif' }`) no longer produces a double dot in the filename.
- `modules.color.rgb` with `format: 'css'` or `format: 'binary'` no longer prepends the hex `prefix` to the output (it produced invalid values like `#rgb(12, 34, 56)`). The `prefix` option now only applies to the `'hex'` format, as documented.
- `modules.color` constants: removed a duplicated `rec2020` entry from the CSS spaces list.
- `modules.image` methods now URL-encode the category in the generated URL, so categories with spaces or special characters produce valid URLs.
- `chaca.utils.pick` with `count` equal to the array length returned the input array **by reference**, so mutating the result also mutated your original array. It now returns a copy.
- Defining a schema field with a primitive value (e.g. `chaca.schema({ name: "hola" })`) threw a cryptic JavaScript `TypeError`. It now throws a descriptive `ChacaError` indicating the field type is invalid.

- CSV export: missing field values (objects with different keys) were serialized as the literal string `undefined`. They now produce an empty cell.
- YAML export: `bigint` values were silently dropped from the output (objects lost the key, arrays lost the element). They are now serialized — as a plain integer when the value fits in a safe JavaScript integer, and as a decimal string otherwise.
- Java export: the generated `Main.java` never compiled — the last `add(...)` statement was missing its semicolon. Every statement is now properly terminated.
- Java export: decimal values were emitted as `double` literals (e.g. `5.5`) for fields typed `Float`, which does not compile. They now use the `f` suffix (`5.5f`).
- Java export: `bigint` values generated invalid code (the expression `BigInteger.valueOf(...)` was used as the field **type**). They are now typed `BigInteger`, built with `new BigInteger("<value>")`, and the `java.math.BigInteger` import is included.
- Java export: `Date` values emitted a stray semicolon inside the constructor call and an ISO string with a trailing `Z` that `LocalDateTime.parse` cannot parse. Both are fixed.
- Java export: fields named like Java reserved words (`class`, `int`, ...) generated invalid identifiers. They are now renamed with a `Value` suffix (`classValue`), which also avoids the `getClass()` collision with `Object`.
- Java export: exporting documents with mixed types for the same field threw a `ChacaError` with an **empty message**. It now reports the field and the conflicting types.
- Java export: `RegExp` values generated `Patter.compile(...)` (typo). Now `Pattern.compile(...)`.
- Python export: fields named like Python reserved words (`class`, `import`, `from`, ...) generated invalid syntax. They are now renamed with a trailing underscore (`class_`), following PEP 8.
- PostgreSQL export: string values with single quotes produced broken SQL (`'l'agua'`) and double quotes were escaped with invalid backslashes. Single quotes are now doubled (`'l''agua'`), the standard SQL escape.
- PostgreSQL export: columns where every value is `null` were generated **without a type** (`n NULL,`), which is invalid SQL. They now fall back to `TEXT`.
- PostgreSQL export: `Date` values were exported as `DATE` with only the date part, silently dropping the time. They are now exported as `TIMESTAMP` with the full ISO value.
- PostgreSQL export: tables or columns named like reserved SQL words (`select`, `user`, `table`, ...) produced invalid statements. They are now double quoted (`"user"`).

## ⚠️ Behavior changes

- `modules.finance.ethereumAddress` now returns the address with the `0x` prefix, as its documentation always stated (42 characters in total instead of 40).
- `modules.color.rgb({ format: 'css' })` output changed as described in the fixes above; update any code that relied on the previous prefixed value.
- The `continent` option type of `modules.address.country` changed from `"Oseania" | "Antartica"` to `"Oceania" | "Antarctica"`; update your code if you passed the misspelled values.
- An **array `ref` field that runs out of values to reference no longer pads the array with `null`**. It now stops as soon as there is nothing left to take, so the array only contains the references that could actually be resolved:

  ```ts
  const schema2 = chaca.schema({
    ref: {
      type: chaca.ref("schema.id", { unique: true, nullOnEmpty: true }),
      isArray: 100,
    },
  });

  // with only 6 documents available in `schema`:
  // before -> [1, 2, 3, 4, 5, 6, null, null, ... 94 nulls]
  // now    -> [1, 2, 3, 4, 5, 6]
  ```

  This also applies to a schema that references **itself**: its first document used to get an array full of `null` (there are no other documents yet) and now gets an empty array. Single (non array) `ref` fields are unchanged — they still return `null` when empty, and still throw `NotEnoughValuesForRefError` when `nullOnEmpty` is `false`. Besides the output change, this avoids scanning the referenced schema once per remaining array position, which was noticeably slow for large `isArray` values.

- **`possibleNull` no longer applies to the elements of an array field.** It describes the _field_, so it decides whether the field's value is a complete array or `null` — it is never re-evaluated for each element. Previously, a field combining `isArray` with a **float probability** (or a **function** returning one) rolled the dice again per element and could produce `null` values scattered inside the array:

  ```ts
  const schema = chaca.schema({
    values: {
      type: () => modules.id.uuid(),
      isArray: 10,
      possibleNull: 0.5,
    },
  });

  // before -> [uuid, null, null, uuid, null, uuid, uuid, null, uuid, uuid]
  // now    -> either null, or an array of exactly 10 non-null values
  ```

  This affects every field type (`ref`, `enum`, `pick`, nested schemas, custom functions, ...). The `possibleNull: true` / `false` and exact-count (integer) forms already behaved this way and are unchanged.

## ⚠️ Notes

- In the **browser** build, `export` (which writes files to the filesystem) is not available and throws a descriptive error. Use `transform` to get the file contents in memory instead. In **Node**, `export` keeps working exactly as before.
- The build output moved from `lib/` to `dist/`. The public entry point is unchanged (`import { chaca } from "chaca"`); only update your imports if you were relying on internal deep paths such as `chaca/lib/...`.
- Internal: the `nanoid-cjs` dependency was replaced with `nanoid`. There is no API change — `modules.id.nanoid()` behaves as before.

# chaca@2.1.0

## 🌚 Features

- All dataset, schema and dataset store operations are now async functions
- You can define the number of documents to generate as a function that depends on the current state of the dataset.

  ```ts
  chaca.dataset([
    {
      name: "User",
      schema: userSchema,
      documents: 50,
    },
    {
      name: "Writer",
      schema: writerSchema,
      documents: async ({ store }) => {
        const users = await store.get("User");

        return users.filter((u) => u.role === "writer").length;
      },
    },
  ]);
  ```

## 🪛 Fix

- Issues with `date.birthdate` generation problems were fixed

# chaca@2.0.0

## 🌚 Features

### Core

- The `Dataset` class was created to export various schemas in a relational way
- You can now define the `isArray` parameter as a function that is executed when each document is created.

  ```ts
  const schema = chaca.schema({
    image: {
      type: () => modules.image.people(),
      isArray: ({ currentFields, store }) => {
        return 5;

        // or

        return {
          min: 2,
          max: 10,
        };
      },
    },
  });
  ```

- Added exception `WrongPossibleNullDefinitionError` for errors in the definition of the parameter `possibleNull`
- Added exception `WrongArrayDefinitionError` for errors in the definition of the parameter `isArray`
- Added exception `WrongProbabilityFieldDefinitionError` for errors in the definition of `probability` fields
- 🗑️ `chaca.multiGenerate` was removed
- 🎉 The number of items to select in the `pick` field can be defined as a range of values ​​or a function that returns the number of values ​​to choose from.

  ```ts
  // range
  chaca.pick({
    values: [1, 2, 3, 4, 5],
    count: {
      min: 1,
      max: 3,
    },
  });

  // function
  chaca.pick({
    values: [1, 2, 3, 4, 5],
    count: ({ store, currentFields }) => {
      return 2;

      // or

      return {
        min: 1,
        max: 3,
      };
    },
  });
  ```

- Added `nullOnEmpty` parameter to avoid `NotEnoughValuesForRefError` exception
- The `ref` fields can reference the schema they are located in without causing a circular dependency.
- 🎉 Added `Dataset.transform`, `Schema.transform` and `Chaca.transform` methods to serialize data to a specific file format without having to export it
- 🎉 Added new CLI commands
  - `json`
  - `python`
  - `java`
  - `js`
  - `json`
  - `postgresql`
  - `ts`
  - `yaml`

### Modules

- 🎉 Added `datatype.octal`
- 🎉 Added `datatype.numeric`
- 🎉 Added `datatype.bigint`
- 🎉 Added `datatype.character`
- 🎉 Added `id.nanoid`
- 🎉 Added `id.ulid`
- 🎉 Added `id.cuid`
- 🎉 Added `image.category`
- 🎉 Added `color.human`
- 🎉 Added `date.anytime`
- 🎉 Added `finance.litecoinAddress`
- 🎉 Added `internet.ip`
- 🎉 Added `address.ordinalDirection`
- 🎉 Added `lorem.word`
- 🎉 Added `lorem.sentence`
- 🎉 Added `lorem.paragraph`
- 🎉 Added `person.zodiacSign`
- 🎉 Added `system.cron`
- 🎉 Added `address.longitude`
- 🎉 Added `address.latitude`
- The `prefix` argument was added to the `datatype.alphaNumeric` module

### Utils

- 🎉 Added `utils.pick` to select elements from an array without being chosen more than once
- 🎉 Added `utils.multiple` To create an array of values ​​from a generator
- 🎉 Added `banned` and `symbols` options on `utils.replaceSymbols`
- 🗑️ Deleted `utils.capitalCamelCase`
- 🗑️ Deleted `utils.capitalize`
- 🗑️ Deleted `utils.capitalizeWord`
- 🎉 Added `utils.snakeCase`
- 🎉 Added `utils.dotCase`
- 🎉 Added `utils.sentenceCase`
- 🎉 Added `utils.capitalCase`
- 🎉 Added `utils.pascalCase`

## 🪛 Fix

### Core

- 🔄 `DatasetStore.getValue` -> `DatasetStore.get`
- 🔄 The `schemas` concept was changed to `modules` for predefined functions
- 🗑️ The `SchemaField` class and the `chaca.schemaField()` method are removed. The way to use the modules from now on is as follows

  ```js
  // get a value
  modules.id.uuid();

  // use on schemas
  const schema = chaca.schema({
    id: () => modules.id.uuid(),
  });
  ```

- Probability values ​​for the `possibleNull` param must be in the range 0 to 1 now
- 🔄 `Schema.generate` -> `Schema.array`
- 🔄 `Schema.generateObject` -> `Schema.object`
- 🔄 `FileConfig.fileName` -> `FileConfig.filename`
- 🔄 `DatasetStore.getSchemaDocuments` -> `DatasetStore.currentDocuments`
- 🔄 `NotExistFieldError` -> `NotExistRefFieldError`
- 🗑️ Removed `export` CLI command

### Modules

- 🔄 `modules.animal.animalType` -> `modules.animal.type`
- 🔄 `modules.image.animateAvatar` -> `modules.image.animatedAvatar`
- 🔄 `modules.id.mongodbID` -> `modules.id.mongodbId`

# chaca@1.9.0

## 🌚 Features

- 🎉 Add `pick` field to choose unique elements from an array

## 🪛 Fix

- 🎉 Data creation times have been reduced by 20%

# chaca@1.8.0

## 🌚 Features

- 🎉 The bundle size has been reduced by 50%
- 🗑️ `Video` schema was deleted
- 🗑️ The `constants` in `Image` schema were removed

# chaca@1.7.2

## 🪛 Fix

- Fix problems with zip exportation in `python` and `postgresql` formats
- Fix `Internet.password` schema

# chaca@1.7.1

## 🌚 Features

- Add export configurations to all formats (`java` | `csv` | `typescript` | `json` | `javascript` | `yaml` | `postgresql` | `python`)

# chaca@1.7.0

## 🪛 Fix

- Fix some problems with `sequence` fields configuration
- Upgrade error messages

## 🌚 Features

- Add conditional value function to `possibleNull` configuration

  ```ts
  const schema = chaca.schema({
    age: schemas.dataType.int({ min: 18, max: 90 }),
    actual_school_year: {
      type: schemas.dataType.int({ min: 10, max: 15 }),
      possibleNull: ({ currentFields, store }) => {
        if (currentFields.age > 25) {
          return 90; // If the age is greater than 25 years, there will be a 90% probability that the field will be null
        } else {
          return 15; // Will be a 15% probability that the field will be null;
        }
      },
    },
  });
  ```

- Add `probability` field as alternative to `enum` field

  ```ts
  // Simple definition
  const schema = chaca.schema({
    prob: chaca.probability([
      { chance: 0.9, value: 10 }, // There is a 90% chance of choosing the value 10
      { chance: 0.5, value: 5 }, // There is a 50% chance of choosing the value 5
      { chance: 0.1, value: 1 }, // There is a 10% chance of choosing the value 1
    ]),
  });

  // Conditional definition
  const schema = chaca.schema({
    test: schemas.dataType.int({ min: 0, max: 10 }),
    prob: chaca.probability([
      {
        chance: ({ currentFields, store }) => {
          if (currentFields.test > 5) {
            return 0.9;
          } else {
            return 0.2;
          }
        },
        value: 10,
      },
      { chance: 0.5, value: 5 },
      { chance: 0.1, value: 1 },
    ]),
  });
  ```

- Add export configurations for `json`, `java` and `csv` extensions
  ```ts
  chaca.export(data, {
    filename: "Data",
    localtion: "./data",
    format: { ext: "json", zip: false, separate: true },
  });
  ```

# chaca@1.6.3

## 🪛 Fix

- Add more information of fields routes in exceptions
- Add new exception `NotExistFieldError`

  ```ts
  const dataset1 = chaca.schema({
    id: chaca.key(schemas.id.uuid()),
  });

  const dataset2 = chaca.schema({
    id: chaca.ref("Dataset1.customId"), // not exist that field
  });

  const data = chaca.multiGenerate([
    { name: "Dataset1", documents: 30, schema: dataset1 },
    { name: "Dataset2", documents: 30, schema: dataset2 },
  ]); // throw a NotExistFieldError because 'customId' not exist
  ```

# chaca@1.6.2

## 🪛 Fix

- Change `internet.userName` to `internet.username`
- Fix `intener.username` and `internet.email` values generator

# chaca@1.6.1

## 🌚 Features

- Add `browser`, `oauthProvider`, `locale`, `emailProvider` options in `internet` schema
- Add more values for the `protocol` option in `internet` schema
- Add `transaction`, `subscriptionPlan` options in `finance` schema
- Add more values for `manufacturer` and `model` options in `vehicle` schema
- Add `language` option in `person` schema

## 🪛 Fix

- Allow `possibleNull` config for sequence and sequential fields
- Add more results for `internet.userName`

# chaca@1.6.0

## 🌚 Features

- Add CLI commands for export dataset from schemas configuration file

- 🐍 Add Python code generator

- Add `loop` configuration in `chaca.sequential` field

```js
// Before
const schema = chaca.schema({
  favoriteNumber: chaca.sequential([1, 2, 3]),
});

schema.generate(5); // Throws an error because there are only 3 values for 5 documents to create

// Now
const schema = chaca.schema({
  favoriteNumbers: chaca.sequential([1, 2, 3], { loop: true }),
});

schema.generate(5);

/*
[
  { favoriteNumber: 1 },
  { favoriteNumber: 2 },
  { favoriteNumber: 3 },
  { favoriteNumber: 1 },
  { favoriteNumber: 2 },
];
*/
```

- Remove names from `schema field` declaration

```js
// Before
const customField = chaca.module("customField", (args) => {
  // return value
});

// Now
const customField = chaca.module((args) => {
  // return value
});
```

## 🪛 Fix

- Allow 0 as a possible value for the `isArray` parameter
- Interfaces referring to `isArray` and `possibleNull` configurations are now accessible
- Change `posibleNull` to `possibleNull` in schema configuration
- The limit of documents to be generated by schema was eliminated
- Fix problems with CSV code generator
- Fix problems with Typescript code generator

# chaca@1.5.1

## 🪛 Fix

- Fix extra blank space in `PersonSchema.fullName` string generation

# chaca@1.5.0

## 🌚 Features

# Fields

- Add `sequence field`
- Add `sequential field`
- Add `ref field`
- Add `key field`
- Add `enum field`

# Schemas

- Add `ColorSchema`
- Delete `numberRow` from `IdSchema`

# Utils

- Add `utils.sumDateRange` to change dates by range

# Generators

- Add `PostgreSQL` code generator
- Add `chaca.multiGenerate` to generate relational schemas data
- Add `chaca.exportFromSchemas` to export and generate relational schemas data
- Add `schema.object` to generate single object of data schema

## 🪛 Fix

# Generators

- Now you can export any type of data in all extensions

# Utils

- Fix `utils.camelCase`

# chaca@1.1.0

- Add YAML code generator
- Fix `Internet.email` schema error
- Fix `Person.fullName` schema error
- Remove `chaca.exportAll` method

# chaca@1.0.0

- Initial release
