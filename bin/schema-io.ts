#!/usr/bin/env ts-node
import { SchemaIO, s } from "../src/index";
import * as fs from "fs";

function printUsage() {
  console.log(
    `\nSynthex Schema Import/Export CLI\n\nUsage:\n  ts-node bin/schema-io.ts export <schema-file> <output.[json|yaml]>\n  ts-node bin/schema-io.ts import <input.[json|yaml]>\n\nExamples:\n  ts-node bin/schema-io.ts export ./examples/user-schema.ts ./user-schema.json\n  ts-node bin/schema-io.ts import ./user-schema.yaml\n`
  );
}

async function main() {
  const [, , cmd, ...args] = process.argv;
  if (!cmd || cmd === "--help" || cmd === "-h") {
    printUsage();
    process.exit(0);
  }

  if (cmd === "export") {
    const [schemaFile, outFile] = args;
    if (!schemaFile || !outFile) {
      printUsage();
      process.exit(1);
    }
    const imported = await import(
      schemaFile.startsWith(".") ? schemaFile : `./${schemaFile}`
    );
    const schema = imported.default || imported.schema;
    if (!schema) {
      console.error(
        "Schema not found in file. Export as `export const schema = ...` or `export default ...`"
      );
      process.exit(1);
    }
    SchemaIO.saveToFile(schema, outFile);
    console.log(`Schema exported to ${outFile}`);
    process.exit(0);
  }

  if (cmd === "import") {
    const [inFile] = args;
    if (!inFile) {
      printUsage();
      process.exit(1);
    }
    const schema = SchemaIO.loadFromFile(inFile);
    console.log("Loaded schema:", schema);
    process.exit(0);
  }

  printUsage();
  process.exit(1);
}

main();
