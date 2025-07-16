const { s, MockGenerator } = require("../dist/index.js");

const llmSchema = s
  .object({
    prompt: s.string().required(),
    response: s.string().required(),
    contextField: s.string().required().template("CTX-{{contextValue}}"),
    errorField: s.string().simulateError(true).errorType("SimulatedFieldError"),
    maybeField: s.string().probability(0.2),
  })
  .build("LLMDemoSchema");

const generator = new MockGenerator({
  seed: 123,
  context: { contextValue: "LLMCTX" },
  outputFormat: "markdown",
  errorProbability: 0.2,
});

console.log("--- LLM Mock Response ---");
try {
  const response = generator.generate(llmSchema);
  console.log(generator.formatOutput(response));
} catch (err) {
  console.error("Error during generation:", err);
}

console.log("\n--- Streaming Output ---");
(async () => {
  try {
    for await (const chunk of generator.streamGenerate(llmSchema, 2, 100)) {
      console.log("Chunk:", chunk);
    }
  } catch (err) {
    console.error("Streaming error:", err);
  }
})();
