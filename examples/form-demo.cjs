const readline = require('readline');
const { s, MockGenerator } = require('../dist/index.js');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- AI Form Filler Demo ---');
rl.question('Enter comma-separated field names (e.g. name,email,age): ', (answer) => {
  const fields = answer.split(',').map(f => f.trim()).filter(Boolean);
  if (fields.length === 0) {
    console.log('No fields provided. Exiting.');
    rl.close();
    return;
  }
  
  const schemaFields = {};
  for (const field of fields) {
    
    if (field.toLowerCase().includes('email')) {
      schemaFields[field] = s.email().required();
    } else if (field.toLowerCase().includes('age')) {
      schemaFields[field] = s.number().min(1).max(120).required();
    } else if (field.toLowerCase().includes('date')) {
      schemaFields[field] = s.date().format('date-time').required();
    } else {
      schemaFields[field] = s.string().required();
    }
  }
  const formSchema = s.object(schemaFields).build('UserForm');
  const generator = new MockGenerator({ seed: Date.now() });
  const mock = generator.generate(formSchema);
  console.log('\n--- AI Generated Form Output ---');
  console.log(JSON.stringify(mock.data, null, 2));
  rl.close();
});
