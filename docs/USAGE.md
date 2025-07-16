# Synthex Usage Guide

## Overview
Synthex is a type-safe, streaming-friendly mock data generator for LLM and structured API workflows. It helps you test, prototype, and validate your code without waiting for slow LLMs or burning API tokens.

## 1. Schema Building

Schemas define the structure and constraints of your mock data. Use the `s` or `m` builder API:

```ts
import { s, MockGenerator } from 'synthex';

const userSchema = s.object({
  id: s.uuid().required(),
  name: s.string().min(2).max(50).required(),
  email: s.email().required(),
  age: s.number().min(18).max(99),
  isActive: s.boolean(),
  role: s.enum(['user', 'admin', 'moderator']),
  profile: s.object({
    bio: s.string().max(160),
    website: s.url(),
  }).optional(),
}).build('UserSchema');
```

## 2. Generating Mock Data

```ts
const generator = new MockGenerator({ seed: 42 });
const mock = generator.generate(userSchema);
console.log(mock.data);
```

## 3. Streaming Output (LLM Simulation)

```ts
for await (const chunk of generator.streamGenerate(userSchema, 2, 100)) {
  console.log('Chunk:', chunk);
}
```

## 4. Error Simulation

```ts
const schemaWithError = s.object({
  field: s.string().simulateError(true).errorType('SimulatedError'),
}).build('ErrorSchema');

try {
  const result = generator.generate(schemaWithError);
  console.log(result.data);
} catch (err) {
  console.error('Simulated error:', err);
}
```

## 5. Conditional & Probabilistic Fields

```ts
const schema = s.object({
  always: s.string().required(),
  maybe: s.string().probability(0.3),
  onlyIf: s.string().when('always', 'yes'),
}).build('ConditionalSchema');
```

## 6. Custom Field Generation

```ts
const customSchema = s.object({
  custom: s.string().generate((ctx, data, rng) => `custom-${rng.randomInt(1, 100)}`),
}).build('CustomSchema');
```

## 7. Type Inference & Validation

```ts
import { TypeInference, SchemaUtils } from 'synthex';

console.log(TypeInference.inferType(userSchema));

const isValid = SchemaUtils.validateData({ id: '...', name: '...' }, userSchema);
```

## 8. CLI & Example Scripts

- `node examples/form-demo.cjs` — Interactive form mocker
- `node examples/llm-demo.cjs` — LLM-style streaming and error demo

## 9. API Reference

See the source code or TypeScript types for full API details. Key exports:
- `MockGenerator`
- `SchemaForm`, `SchemaField`
- `s` / `m` (schema builders)
- `TypeInference`, `SchemaUtils`, `DocGenerator`

## 10. Advanced: Collections, References, Snapshots

- Use `SchemaUtils.createCollection` for managing multiple schemas
- Use `s.reference('OtherSchema')` for nested/linked schemas
- Use `SnapshotUtils` for snapshot testing

For more, see the README and example scripts.