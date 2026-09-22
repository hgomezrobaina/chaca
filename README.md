<p align="center"><img align="center" width="200" src="https://res.cloudinary.com/chaca-sa/image/upload/v1681924431/Logopit_1681682634889_hywzcu.png" style="max-width: 100%"/></p>

<h2 align="center">🌚 Think your data and let Chaca create it.</h2>

<p align="center">
  <a href="https://www.npmjs.com/package/chaca"><img src="https://img.shields.io/npm/v/chaca.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/chaca"><img src="https://img.shields.io/npm/dm/chaca.svg" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/package/chaca"><img src="https://img.shields.io/bundlephobia/minzip/chaca.svg" alt="minzipped size"></a>
  <img src="https://img.shields.io/npm/types/chaca.svg" alt="types included">
  <img src="https://img.shields.io/node/v/chaca.svg" alt="node version">
  <a href="https://github.com/Chacaponquin/chaca/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/chaca.svg" alt="license"></a>
</p>

## 😀 Intro

Welcome to Chaca, a powerful library that revolutionizes mock data generation for testing and development. Define the shape of your data once and let Chaca generate realistic, diverse and **relational** fake data to simulate any scenario for your application.

Chaca is **isomorphic**: the same API runs in **Node.js and in the browser** (React, Vue, Svelte, ...). Your bundler automatically picks the right build, so you can generate data on the server, in a script, in the CLI, or straight in the browser.

## ✨ Features

- 🌐 **Runs everywhere** — Node.js and the browser, ESM and CommonJS, with TypeScript types included.
- 🧩 **Batteries included** — a large set of data `modules` (person, address, internet, finance, image, date, ...) ready to use.
- 🔗 **Relational data** — model references between schemas with `Dataset` and `chaca.ref(...)`.
- 📤 **Multi-format export** — serialize to `json`, `csv`, `yaml`, `postgresql`, `mysql`, `sqlite`, `java`, `python`, `typescript` and `javascript`.
- 🧠 **Dynamic fields** — each field can depend on the other fields of the document or on the dataset state.
- 🕹️ **CLI** included to generate data from a config file.

## 📦 Installation

```shell
npm install chaca
```

Requires Node.js >= 18 (when used on the server). In the browser, just import it — no configuration needed.

## 😎 Usage

### Define a schema and generate data

```ts
import { chaca, modules } from "chaca";

const movieSchema = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  authors: {
    type: () => modules.person.fullName({ language: "es" }),
    isArray: { min: 1, max: 3 },
  },
  image: () => modules.image.film(),
  likes: () => modules.datatype.int({ min: 0, max: 500000 }),
  category: chaca.enum(["Horror", "War", "History", "Comedy"]),
  adultMovie: ({ currentFields: docFields }) => {
    return docFields.category === "Horror" || docFields.category === "War";
  },
});

// Generate 20 objects with the defined schema
const docs = await movieSchema.array(20);

/*
[
  {
    id: "4136cd0b-d90b-4af7-b485-5d1ded8db252",
    authors: ["Olivia Gonzalez Gomez", "Santiago Torres Gil"],
    image: "https://loremflickr.com/1746/1746/film?lock=13845",
    likes: 21456,
    category: "Horror",
    adultMovie: true,
  },
  ...rest, // 19 more documents
];
*/
```

### Serialize in memory — `transform()` (works in the browser)

`transform` returns the serialized files **in memory** (`{ filename, content }[]`), without touching the filesystem. This is the way to obtain the data in the browser, e.g. to trigger a download.

```ts
const files = await movieSchema.transform(20, {
  filename: "movies",
  format: "json",
});

// files[0].filename -> "movies.json"
// files[0].content  -> "[ { ... }, ... ]"  (string, ready to download or display)
```

### Export to files — `export()` (Node.js only)

`export` writes the generated data to disk.

```ts
await movieSchema.export(20, {
  filename: "movies",
  format: "json",
  location: "./folder",
});
```

> In the browser `export` is not available (there is no filesystem) and throws a descriptive error. Use `transform` instead.

## 🔗 Relational data

Use `Dataset` to generate several related schemas at once, referencing fields across them with `chaca.ref("Schema.field")`.

```ts
import { chaca, modules } from "chaca";

const userSchema = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  username: () => modules.internet.username(),
});

const postSchema = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  title: () => modules.lorem.words(),
  user: chaca.ref("User.id"), // references a User.id value
});

const dataset = chaca.dataset([
  { name: "User", schema: userSchema, documents: 3 },
  { name: "Post", schema: postSchema, documents: 10 },
]);

const data = await dataset.generate(); // { User: [...], Post: [...] }

// Datasets can be serialized too:
const files = await dataset.transform({ filename: "blog", format: "postgresql" });
```

## 🧩 Data modules

Chaca ships with a batteries-included set of data generators, accessible through `modules`:

```ts
modules.person.fullName();
modules.internet.email();
modules.address.country();
modules.finance.bitcoinAddress();
modules.image.film();
modules.datatype.int({ min: 0, max: 100 });
```

See the full list in the [modules documentation](https://chaca.app).

## 📤 Export formats

Both `transform` and `export` support these `format` values:

`json` · `csv` · `yaml` · `postgresql` · `mysql` · `sqlite` · `java` · `python` · `typescript` · `javascript`

## 📘 Documentation

Visit our website to read the documentation. [Chaca Docs](https://chaca.app)

## 🕹️ CLI

See [CLI guide](https://chaca.app/docs/guides/cli)

## 🌐 Try our REST API

If you don't want to use our npm package you can use our [REST API](https://chaca.app/docs/rest-api/overview) to create your mock data

## 🗂️ Changelog

Detailed changes for each release are documented in the [CHANGELOG.md](https://github.com/Chacaponquin/chaca/blob/main/CHANGELOG.md).

## Contributing

The Chaca project welcomes all constructive contributions. Contributions take many forms, from code for bug fixes and enhancements, to additions and fixes to documentation, additional tests, triaging incoming pull requests and issues, and more!. [See CONTRIBUTING.md](https://github.com/Chacaponquin/chaca/blob/main/CONTRIBUTING.md)

## License

MIT
