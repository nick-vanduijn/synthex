import { s, MockGenerator } from "../src/index";

describe("LLM Simulation Features", () => {
  const schema = s
    .object({
      text: s.string().required(),
      value: s.number().required(),
      flag: s.boolean().required(),
      arr: s.array(s.string()).min(1).max(2).required(),
      obj: s.object({ foo: s.string().required() }).required(),
      choice: s.enum(["a", "b", "c"]).required(),
    })
    .build("LLMSimSchema");

  it("can hallucinate fields", () => {
    const generator = new MockGenerator({
      hallucinate: true,
      hallucinationProbability: 1,
    });
    const response = generator.generate(schema);
    expect(typeof response.data.text).toBe("string");
    expect(typeof response.data.value).toBe("number");
    expect(typeof response.data.flag).toBe("boolean");
    expect(Array.isArray(response.data.arr)).toBe(true);
    expect(typeof response.data.obj).toBe("object");
    expect(response.data.choice).toBe("???");
  });

  it("can simulate function-calling", () => {
    const generator = new MockGenerator({ simulateFunctionCall: true });
    const result = generator.simulateFunctionCall("myFunc", { foo: 1 });
    expect(result.object).toBe("function_call");
    expect(result.function).toBe("myFunc");
    expect(result.arguments.foo).toBe(1);
    expect(result.result.success).toBe(true);
    expect(typeof result.result.data).toBe("string");
    expect(result.finish_reason).toBe("function_call");
  });

  it("supports streaming with chunking and delay", async () => {
    const generator = new MockGenerator({
      streamChunkSize: 2,
      streamDelayMs: 10,
    });
    const stream = generator.streamGenerate(schema);
    let chunkCount = 0;
    for await (const chunk of stream) {
      expect(typeof chunk).toBe("object");
      chunkCount++;
    }
    expect(chunkCount).toBeGreaterThan(0);
  });
});
