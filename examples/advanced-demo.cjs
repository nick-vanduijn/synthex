const { s, MockGenerator } = require('../dist/index.js');

defineDemo();

function defineDemo() {
  const nestedSchema = s.object({
    user: s.object({
      id: s.uuid().required(),
      name: s.string().required(),
      email: s.email().required(),
      role: s.enum(['admin', 'user', 'guest']),
    }).required(),
    session: s.object({
      token: s.string().template('sess-{{user.id}}'),
      expires: s.date().format('date-time'),
    }),
    errorField: s.string().simulateError(true).errorType('SessionError'),
    maybeField: s.string().probability(0.2),
  }).build('AdvancedSchema');

  const generator = new MockGenerator({ seed: 99, outputFormat: 'markdown' });

  console.log('--- Advanced Mock Output ---');
  try {
    const result = generator.generate(nestedSchema);
    console.log(generator.formatOutput(result));
  } catch (err) {
    console.error('Simulated error:', err);
  }

  console.log('\n--- Streaming Output ---');
  (async () => {
    for await (const chunk of generator.streamGenerate(nestedSchema, 2, 100)) {
      console.log('Chunk:', chunk);
    }
  })();
}
