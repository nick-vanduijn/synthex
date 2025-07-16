<br />
<div align="center">
  <a href="https://github.com/nick-vanduijn/synthex">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Synthex</h3>

  <p align="center">
    Type-safe Mocking for LLMs & Structured APIs  
  </p>

  ![npm version](https://img.shields.io/npm/v/synthex?color=brightgreen&label=npm)
  ![types](https://img.shields.io/npm/types/synthex?label=types)
  ![downloads](https://img.shields.io/npm/dt/synthex?color=blue)
  ![license](https://img.shields.io/npm/l/synthex?color=orange)
  ![build](https://img.shields.io/github/actions/workflow/status/nick-vanduijn/synthex/ci.yml?branch=main&label=build)
</div>


## Table of Contents

- [Install](#install)
- [Features](#features)
- [Example Usage](#-example-usage)
- [Sample Output](#-sample-output)
- [API Overview](#api-overview)
- [Streaming / LLM Simulation](#streaming--llm-simulation)
- [Why Synthex?](#why-synthex)
- [Documentation](#documentation)
- [More Examples](#more-examples)
- [CLI Demo](#cli-demo)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
## Documentation

For a comprehensive usage guide, advanced schema patterns, and API reference, see:

- [docs/USAGE.md](docs/USAGE.md)

---

## More Examples

- `node examples/form-demo.cjs` — Interactive form mocker
- `node examples/llm-demo.cjs` — LLM-style streaming and error demo
- `node examples/advanced-demo.cjs` — Advanced: nested, error, streaming, and conditional fields

---


## The Problem

When building AI or LLM-powered applications, testing and prototyping can be painfully slow. Every time you want to check a new feature, you have to wait for your LLM to respond—sometimes for seconds or even minutes. This slows down your feedback loop, makes debugging tedious, and can rack up unnecessary API costs.

**Synthex** solves this by letting you instantly simulate type-safe, realistic LLM or API responses. You can test your code, validate edge cases, and iterate rapidly—without waiting for a real LLM or burning tokens. Save time, move faster, and focus on building, not waiting.

## Install

```bash
npm install synthex
```

## Features

* **Type-safe schema builder**: primitives, objects, enums, unions, intersections
* **Realistic mock data** for testing, prototyping, or LLM scaffolding
* **Conditional fields** with probabilities
* **Simulated errors** for edge-case testing
* **Streaming mock generation** — mimic LLM token flow
* **Context-aware** field templates (e.g. IDs, tokens, slugs)
* **Test-friendly metadata**: timestamps, token usage, finish reasons
* **Composable** schema API, like Zod but mock-first
* **Markdown & JSON formatters** for quick debugging

## 📚 Example Usage

```ts
import { s, MockGenerator } from 'synthex';

const userSchema = s
  .object({
    id: s.uuid().required(),
    name: s.string().min(2).max(50).required(),
    email: s.email().required(),
    age: s.number().min(18).max(99),
    isActive: s.boolean(),
    role: s.enum(['user', 'admin', 'moderator']),
    profile: s
      .object({
        bio: s.string().max(160),
        website: s.url(),
      })
      .optional(),
  })
  .build('UserSchema');

const generator = new MockGenerator({ seed: 42 });
const mock = generator.generate(userSchema);

console.log(mock.data);
```

## Sample Output

```json
{
  "id": "8c5d3a91-14b4-4c5b-a301-cb837b66f0a1",
  "name": "Ava Jackson",
  "email": "ava.jackson@example.com",
  "age": 35,
  "isActive": true,
  "role": "admin",
  "profile": {
    "bio": "Developer. Writer. Tinkerer.",
    "website": "https://ava.dev"
  }
}
```

## API Overview

| Type               | Builder                            |
|--------------------|------------------------------------|
| String             | `m.string()`                       |
| Number             | `m.number()`                       |
| Boolean            | `m.boolean()`                      |
| Date / Time        | `m.date().format()`                |
| Email, URL, UUID   | `m.email()`, `m.url()`, `m.uuid()` |
| Arrays             | `m.array(m.string())`              |
| Objects            | `m.object({...})`                  |
| Enums              | `m.enum(['a', 'b'])`               |
| Conditional Fields | `.probability(0.5)`                |
| Error Simulation   | `.simulateError(true)`             |
| Streaming Output   | `generator.streamGenerate()`       |

## Streaming / LLM Simulation

```ts
const stream = generator.streamGenerate(userSchema, { chunkSize: 10, delayMs: 50 });

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

## Why Synthex?

| Feature                      | Synthex | Zod | Faker | json-schema-faker |
|------------------------------|:--------:|:---:|:-----:|:-----------------:|
| Type-safe schema builder     |   ✅     | ✅  |  ❌   |        ❌         |
| Realistic mock data          |   ✅     | ❌  |  ✅   |        ✅         |
| Field-level error simulation |   ✅     | ❌  |  ❌   |        ❌         |
| Streaming LLM-like output    |   ✅     | ❌  |  ❌   |        ❌         |
| Composable API               |   ✅     | ✅  |  ❌   |   ⚠️ Partial     |

## CLI Demo

```bash
node examples/form-demo.cjs
```

```tex AI Form Fille
Enter fields (comma-separated): name,email,age

{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "age": 28
}
```

## FAQ

**Q: What makes this better than Faker?**
A: Synthex combines type-safety, streaming support, error injection, and realistic test metadata. Ideal for LLMs and structured APIs.

**Q: Can I use this to test OpenAI function-calling?**
A: Yes! It’s designed to simulate real-world outputs for tools/functions.

**Q: Does it support nesting?**
A: Yup. Nest objects, arrays, even deeply nested enums and conditional fields.

## Contributing

We welcome PRs, ideas, and issue reports. Clone the repo and run:

```bash
npm run dev
```
