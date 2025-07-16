# Synthex Advanced Recipes

## 1. Conditional & Probabilistic Fields

```ts
import { s } from '../src/index';
const schema = s.object({
  status: s.enum(['active', 'inactive']).required(),
  deactivationReason: s.string().when('status', 'inactive').required(),
  activationDate: s.date().when('status', 'active').required(),
}).build('ConditionalSchema');
```

## 2. Streaming LLM Simulation

```ts
import { s, MockGenerator } from '../src/index';
const schema = s.object({ text: s.string().required() }).build('StreamSchema');
const generator = new MockGenerator({ streamChunkSize: 1, streamDelayMs: 100 });
(async () => {
  for await (const chunk of generator.streamGenerate(schema)) {
    console.log(chunk);
  }
})();
```

## 3. Hallucination Simulation

```ts
import { s, MockGenerator } from '../src/index';
const schema = s.object({ text: s.string().required() }).build('HallucSchema');
const generator = new MockGenerator({ hallucinate: true, hallucinationProbability: 0.5 });
console.log(generator.generate(schema));
```

## 4. Function-Calling Mock

```ts
import { MockGenerator } from '../src/index';
const generator = new MockGenerator({ simulateFunctionCall: true });
console.log(generator.simulateFunctionCall('myFunc', { foo: 1 }));
```

## 5. Import/Export Schemas

```sh
ts-node bin/schema-io.ts export ./examples/user-schema.ts ./user-schema.json
ts-node bin/schema-io.ts import ./user-schema.json
```
