import { s, MockGenerator } from "./index";

const schema = s
  .object({
    id: s.uuid().required(),
    name: s.string().required(),
    arr: s.array(s.number()).min(10).max(100),
  })
  .build("PerfSchema");

const generator = new MockGenerator();

const ITER = 10000;
console.time("synthex-generate");
for (let i = 0; i < ITER; i++) {
  generator.generate(schema);
}
console.timeEnd("synthex-generate");
