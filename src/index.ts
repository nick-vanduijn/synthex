import * as fs from "fs";

let yaml: any = undefined;
// NOTE: For YAML support, ensure 'js-yaml' is installed in your project.
// Use dynamic import if needed in a Node.js environment.
// Example: const yaml = await import('js-yaml');

class SchemaIO {
  /**
   * Serialize a schema to JSON string.
   */
  static toJSON(schema: SchemaForm): string {
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Deserialize a schema from JSON string.
   */
  static fromJSON(json: string): SchemaForm {
    const obj = JSON.parse(json);
    return new SchemaForm(obj);
  }

  /**
   * Serialize a schema to YAML string (if js-yaml is available).
   */
  static toYAML(schema: SchemaForm): string {
    if (!yaml) throw new Error("js-yaml not installed");
    return yaml.dump(schema);
  }

  /**
   * Deserialize a schema from YAML string (if js-yaml is available).
   */
  static fromYAML(yamlStr: string): SchemaForm {
    if (!yaml) throw new Error("js-yaml not installed");
    const obj = yaml.load(yamlStr);
    return new SchemaForm(obj);
  }

  /**
   * Save a schema to a file (JSON or YAML by extension).
   */
  static saveToFile(schema: SchemaForm, filePath: string) {
    if (filePath.endsWith(".json")) {
      fs.writeFileSync(filePath, SchemaIO.toJSON(schema), "utf8");
    } else if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
      fs.writeFileSync(filePath, SchemaIO.toYAML(schema), "utf8");
    } else {
      throw new Error("Unsupported file extension");
    }
  }

  /**
   * Load a schema from a file (JSON or YAML by extension).
   */
  static loadFromFile(filePath: string): SchemaForm {
    const content = fs.readFileSync(filePath, "utf8");
    if (filePath.endsWith(".json")) {
      return SchemaIO.fromJSON(content);
    } else if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) {
      return SchemaIO.fromYAML(content);
    } else {
      throw new Error("Unsupported file extension");
    }
  }
}

export { SchemaIO };

/**
 * Type for a literal value or a weighted object for enums.
 */
type EnumValue<T> = T | { value: T; weight: number };

/**
 * Defines the structure and constraints for a single field within a schema.
 * Represents the internal representation of a field after the builder constructs it.
 */
interface SchemaField<T = any> {
  type:
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object"
    | "enum"
    | "uuid"
    | "email"
    | "url"
    | "date"
    | "union"
    | "intersection"
    | "nullable"
    | "reference";
  required?: boolean;
  min?: number;
  max?: number;
  items?: SchemaField;
  properties?: Record<string, SchemaField>;
  enum?: Array<EnumValue<any>>;
  pattern?: string;
  format?: "date" | "date-time";
  unionTypes?: SchemaField[];
  intersectionTypes?: SchemaField[];
  reference?: string;
  nullableType?: SchemaField;
  probability?: number;
  condition?: (
    currentData: Record<string, any>,
    globalContext: Record<string, any>
  ) => boolean;
  template?: string;
  simulateError?: boolean;
  errorType?: string;
  generateFn?: (
    context: Record<string, any>,
    currentData: Record<string, any>,
    rng: RandomGenerator
  ) => T;
}

/**
 * Represents a compiled schema for structured data, typically for an object type.
 * This is what m.object().build() returns.
 */
class SchemaForm<T = any> implements SchemaField<T> {
  type: SchemaField["type"] = "object";
  _isSchemaForm = true as const;
  name?: string;
  version?: string;
  fields: Record<string, SchemaField<any>>;
  /**
   * This property is only for type extraction, not runtime use.
   * Use as: type MyType = typeof schema.infer
   */
  declare readonly infer: T;
  required?: boolean;
  min?: number;
  max?: number;
  items?: SchemaField;
  properties?: Record<string, SchemaField>;
  enum?: Array<EnumValue<any>>;
  pattern?: string;
  format?: "date" | "date-time";
  unionTypes?: SchemaField[];
  intersectionTypes?: SchemaField[];
  reference?: string;
  nullableType?: SchemaField;
  probability?: number;
  condition?: (
    currentData: Record<string, any>,
    globalContext: Record<string, any>
  ) => boolean;
  template?: string;
  simulateError?: boolean;
  errorType?: string;
  generateFn?: (
    context: Record<string, any>,
    currentData: Record<string, any>,
    rng: RandomGenerator
  ) => T;

  constructor(params: {
    name?: string;
    version?: string;
    fields: Record<string, SchemaField<any>>;
    required?: boolean;
    min?: number;
    max?: number;
    items?: SchemaField;
    properties?: Record<string, SchemaField>;
    enum?: Array<EnumValue<any>>;
    pattern?: string;
    format?: "date" | "date-time";
    unionTypes?: SchemaField[];
    intersectionTypes?: SchemaField[];
    reference?: string;
    nullableType?: SchemaField;
    probability?: number;
    condition?: (
      currentData: Record<string, any>,
      globalContext: Record<string, any>
    ) => boolean;
    template?: string;
    simulateError?: boolean;
    errorType?: string;
    generateFn?: (
      context: Record<string, any>,
      currentData: Record<string, any>,
      rng: RandomGenerator
    ) => T;
  }) {
    this.name = params.name;
    this.version = params.version;
    this.fields = params.fields;
    this.required = params.required;
    this.min = params.min;
    this.max = params.max;
    this.items = params.items;
    this.properties = params.properties as Record<string, SchemaField<any>>;
    this.enum = params.enum;
    this.pattern = params.pattern;
    this.format = params.format;
    this.unionTypes = params.unionTypes;
    this.intersectionTypes = params.intersectionTypes;
    this.reference = params.reference;
    this.nullableType = params.nullableType;
    this.probability = params.probability;
    this.condition = params.condition;
    this.template = params.template;
    this.simulateError = params.simulateError;
    this.errorType = params.errorType;
    this.generateFn = params.generateFn;
  }
}

/**
 * Represents a collection of schemas, allowing for structured data definitions
 * and references between them.
 */
interface SchemaCollection {
  name: string;
  version: string;
  schemas: SchemaForm[];
}

/**
 * Represents a mock response structure, including the schema and the data.
 */
interface MockResponse<T = any> {
  schema: SchemaForm;
  data: T;
  metadata?: {
    generatedAt: string;
    generator: string;
    version: string;
    seed?: number;
    tokenUsage: number;
    modelInfo: string;
    latencyMs: number;
    roles?: Array<"system" | "user" | "assistant" | "tool">;
    log?: { requestTime: number; requestId: string };
    rateLimit?: number;
    quota?: number;
    quotaUsed?: number;
    finishReason?: string;
    stopSequence?: string;
    [key: string]: any;
  };
  tokens?: string[];
  finishReason?: string;
}

/**
 * Configuration options for the mock generator.
 */
interface MockGeneratorOptions {
  seed?: number;
  locale?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  simulateError?: boolean;
  errorProbability?: number;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
  tokenUsage?: number;
  modelInfo?: string;
  latencyMs?: number;
  randomness?: "deterministic" | "fuzz" | "random";
  outputFormat?: "json" | "xml" | "markdown";
  maxTokens?: number;
  roles?: Array<"system" | "user" | "assistant" | "tool">;
  logTrace?: boolean;
  rateLimit?: number;
  rateLimitIntervalMs?: number;
  quota?: number;
  quotaUsed?: number;
  abortSignal?: AbortSignal;
  hallucinate?: boolean;
  hallucinationProbability?: number;
  simulateFunctionCall?: boolean;
  streamChunkSize?: number;
  streamDelayMs?: number;
}

/**
 * Error class for schema validation and generation errors.
 */
class SyntexError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "SyntexError";
  }
}

/**
 * Utility class for generating random values with constraints.
 *
 * */
class RandomGenerator {
  private seed: number;
  private rng: () => number;
  private randomness: "deterministic" | "fuzz" | "random";

  constructor(
    seed?: number,
    randomness: "deterministic" | "fuzz" | "random" = "random"
  ) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
    this.randomness = randomness;
    this.rng = this.createSeededRandom(this.seed);
  }

  private createSeededRandom(seed: number): () => number {
    return () => {
      let x = Math.sin(seed) * 10000;
      if (this.randomness === "deterministic") {
        x = Math.sin(x) * 10000;
        return x - Math.floor(x);
      } else if (this.randomness === "fuzz") {
        x = Math.sin(x + Math.random()) * 10000;
        return x - Math.floor(x);
      } else {
        return Math.random();
      }
    };
  }

  random(): number {
    return this.rng();
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)];
  }

  randomWeightedChoice<T>(items: Array<EnumValue<T>>): T {
    let totalWeight = 0;
    const choices: { value: T; weight: number }[] = items.map(
      (item: EnumValue<T>) => {
        if (typeof item === "object" && item !== null && "value" in item) {
          totalWeight += item.weight;
          return { value: item.value as T, weight: item.weight };
        } else {
          totalWeight += 1;
          return { value: item as T, weight: 1 };
        }
      }
    );

    let randomNum = this.random() * totalWeight;

    for (const choice of choices) {
      if (randomNum < choice.weight) {
        return choice.value;
      }
    }

    return this.randomChoice(choices.map((c) => c.value));
  }

  randomString(
    length: number,
    charset: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  ): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(this.random() * charset.length));
    }
    return result;
  }

  randomEmail(): string {
    const domains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "company.com",
      "example.org",
    ];
    const names = [
      "john",
      "jane",
      "alice",
      "bob",
      "charlie",
      "diana",
      "eve",
      "frank",
    ];
    const name = this.randomChoice(names);
    const domain = this.randomChoice(domains);
    const number = this.randomInt(1, 999);
    return `${name}${number}@${domain}`;
  }

  randomUrl(): string {
    const protocols = ["https", "http"];
    const domains = ["example.com", "test.org", "sample.net", "demo.co"];
    const paths = ["", "/api", "/dashboard", "/users", "/products"];

    const protocol = this.randomChoice(protocols);
    const domain = this.randomChoice(domains);
    const path = this.randomChoice(paths);

    return `${protocol}://${domain}${path}`;
  }

  randomUuid(): string {
    const hex = "0123456789abcdef";
    let uuid = "";
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += "-";
      } else if (i === 14) {
        uuid += "4";
      } else if (i === 19) {
        uuid += hex.charAt(this.randomInt(8, 11));
      } else {
        uuid += hex.charAt(this.randomInt(0, 15));
      }
    }
    return uuid;
  }

  randomDate(start?: Date, end?: Date): Date {
    const startTime = start?.getTime() || new Date("2020-01-01").getTime();
    const endTime = end?.getTime() || new Date().getTime();

    return new Date(startTime + this.random() * (endTime - startTime));
  }

  randomBoolean(): boolean {
    return this.random() < 0.5;
  }
}

/**
 * Main mock generator class that creates structured data based on schemas.
 */
type SynthexPlugin = {
  name: string;
  onInit?: (generator: MockGenerator) => void;
  onGenerateField?: (
    field: SchemaField,
    context: Record<string, any>,
    currentData: Record<string, any>,
    rng: RandomGenerator
  ) => any | undefined;
};

class MockGenerator {
  private rng: RandomGenerator;
  private options: MockGeneratorOptions;
  private requestCount: number = 0;
  private lastReset: number = Date.now();
  private registeredSchemas: Record<string, SchemaForm> = {};
  private static _plugins: SynthexPlugin[] = [];
  private _plugins: SynthexPlugin[] = [];

  static registerPlugin(plugin: SynthexPlugin) {
    MockGenerator._plugins.push(plugin);
  }

  constructor(options: MockGeneratorOptions = {}) {
    this.options = options;
    this.rng = new RandomGenerator(options.seed, options.randomness);
    this._plugins = [...MockGenerator._plugins];
    this._plugins.forEach((p) => p.onInit?.(this));
  }

  /**
   * Registers a schema to be available for references within other schemas.
   * @param schema The SchemaForm to register.
   */
  registerSchema(schema: SchemaForm) {
    if (!schema.name) {
      throw new SyntexError(
        "Cannot register a schema without a name for referencing.",
        "SCHEMA_NO_NAME"
      );
    }
    this.registeredSchemas[schema.name] = schema;
  }

  /**
   * Simulate streaming tokens for a given string field.
   * Returns an array of tokens and a finish reason.
   */
  streamTokens(
    text: string,
    maxTokens?: number,
    stopSequence?: string
  ): { tokens: string[]; finishReason: string } {
    let tokens = text.split(/\s+/);
    let finishReason = "stop";

    if (stopSequence) {
      const stopIdx = tokens.findIndex((t) => t === stopSequence);
      if (stopIdx !== -1) {
        tokens = tokens.slice(0, stopIdx);
        finishReason = "stop";
      }
    }

    if (maxTokens && tokens.length > maxTokens) {
      tokens = tokens.slice(0, maxTokens);
      finishReason = "length";
    }

    return { tokens, finishReason };
  }

  /**
   * Generates mock data based on the provided schema form.
   */
  generate<T>(schema: SchemaForm<T>): MockResponse<T> {
    try {
      this.validateSchema(schema);

      const now = Date.now();
      this.handleRateLimiting(now);
      this.handleQuota();
      this.handleGlobalErrorSimulation();

      const context = this.options.context || {};
      const generatedData: Record<string, any> = this.generateObjectData(
        schema.fields,
        context,
        {}
      );

      let tokenCount = 0;
      try {
        tokenCount = JSON.stringify(generatedData).length;
      } catch (jsonError) {
        throw new SyntexError(
          `Failed to stringify generated data for token count: ${jsonError}`,
          "TOKEN_COUNT_ERROR"
        );
      }

      if (this.options.maxTokens && tokenCount > this.options.maxTokens) {
        throw new SyntexError(
          `Max token limit exceeded (${tokenCount}/${this.options.maxTokens})`,
          "MAX_TOKEN_LIMIT"
        );
      }

      let dataWithRoles: Record<string, any> = generatedData;
      const roles = this.options.roles || [];
      if (roles.length > 0) {
        dataWithRoles = {};
        for (const role of roles) {
          dataWithRoles[role] = { ...generatedData };
        }
      }

      let tokens: string[] | undefined;
      let finishReason: string | undefined;

      const mainData = roles.includes("assistant")
        ? dataWithRoles["assistant"]
        : generatedData;

      if (
        mainData &&
        typeof mainData === "object" &&
        Object.keys(mainData).length > 0
      ) {
        const firstStringFieldKey = Object.keys(mainData).find(
          (k) => typeof mainData[k] === "string"
        );
        if (firstStringFieldKey) {
          const { tokens: tks, finishReason: fr } = this.streamTokens(
            mainData[firstStringFieldKey],
            this.options.maxTokens,
            this.options.metadata?.stopSequence
          );
          tokens = tks;
          finishReason = fr;
        }
      }

      const metadata: MockResponse["metadata"] = {
        generatedAt: new Date().toISOString(),
        generator: "Syntex",
        version: schema.version || "1.0.0",
        seed: this.options.seed,
        ...this.options.metadata,
        tokenUsage: tokenCount,
        modelInfo: this.options.modelInfo ?? "Syntex-llm",
        latencyMs: this.options.latencyMs ?? this.rng.randomInt(50, 500),
        roles: this.options.roles,
        log: this.options.logTrace
          ? { requestTime: now, requestId: this.rng.randomUuid() }
          : undefined,
        rateLimit: this.options.rateLimit,
        quota: this.options.quota,
        quotaUsed: this.options.quotaUsed,
        finishReason: finishReason,
      };

      return {
        schema,
        data: dataWithRoles as T,
        metadata,
        tokens,
        finishReason,
      };
    } catch (error) {
      if (error instanceof SyntexError) {
        throw error;
      }
      let errorMessage = "An unexpected error occurred during generation.";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new SyntexError(
        `Failed to generate mock data for schema "${schema.name || "unnamed"}": ${errorMessage}`,
        "GENERATION_ERROR"
      );
    }
  }

  /**
   * Generates multiple mock responses based on the schema.
   */
  generateMultiple<T>(schema: SchemaForm<T>, count: number): MockResponse<T>[] {
    const responses: MockResponse<T>[] = [];
    for (let i = 0; i < count; i++) {
      responses.push(this.generate(schema));
    }
    return responses;
  }

  /**
   * Generates mock data from a schema collection by name.
   */
  generateFromCollection<T>(
    collection: SchemaCollection,
    schemaName: string
  ): MockResponse<T> {
    const schema = collection.schemas.find((s) => s.name === schemaName);

    if (!schema) {
      throw new SyntexError(
        `Schema "${schemaName}" not found in collection "${collection.name}"`,
        "SCHEMA_NOT_FOUND"
      );
    }
    this.registerSchema(schema);

    return this.generate(schema) as MockResponse<T>;
  }

  async *streamGenerate<T>(
    schema: SchemaForm<T>,
    chunkSize?: number,
    delayMs?: number
  ): AsyncGenerator<Record<string, any>, void, unknown> {
    this.validateSchema(schema);
    const keys = Object.keys(schema.fields);
    let i = 0;
    const fullData: Record<string, any> = {};
    const chunkSz = chunkSize ?? this.options.streamChunkSize ?? 1;
    const delay = delayMs ?? this.options.streamDelayMs ?? 50;

    while (i < keys.length) {
      if (this.options.abortSignal?.aborted) {
        throw new SyntexError("Stream aborted", "STREAM_ABORTED");
      }

      const chunk: Record<string, any> = {};
      const globalContext = this.options.context || {};

      for (let j = 0; j < chunkSz && i < keys.length; j++, i++) {
        const key = keys[i];
        const field = schema.fields[key];

        const isRequired = field.required !== false;
        const probability = field.probability ?? 1.0;
        const shouldInclude =
          (isRequired || this.rng.random() < probability) &&
          (!field.condition || field.condition(fullData, globalContext));

        if (shouldInclude) {
          let value = this.generateFieldValue(field, globalContext, fullData);
          if (
            this.options.hallucinate &&
            this.rng.random() < (this.options.hallucinationProbability ?? 0.1)
          ) {
            value = this.simulateHallucination(field);
          }
          chunk[key] = value;
          fullData[key] = value;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      yield chunk;
    }
  }

  /**
   * Simulate hallucination for a field (random or nonsense value).
   */
  private simulateHallucination(field: SchemaField): any {
    switch (field.type) {
      case "string":
        return this.rng.randomString(12, "!@#$%^&*()_+1234567890abcdef");
      case "number":
        return this.rng.randomInt(10000, 99999);
      case "boolean":
        return this.rng.random() > 0.5;
      case "array":
        return [this.simulateHallucination(field.items!)];
      case "object":
        return { hallucinated: true };
      case "enum":
        return "???";
      default:
        return null;
    }
  }

  /**
   * Simulate an OpenAI function/tool call response.
   */
  simulateFunctionCall(
    functionName: string,
    args: Record<string, any> = {}
  ): any {
    if (!this.options.simulateFunctionCall)
      throw new SyntexError(
        "Function call simulation not enabled",
        "NO_FUNCTION_CALL_SIM"
      );
    return {
      object: "function_call",
      function: functionName,
      arguments: args,
      result: { success: true, data: this.rng.randomString(8) },
      finish_reason: "function_call",
    };
  }

  formatOutput(response: MockResponse): string {
    const format = this.options.outputFormat || "json";
    switch (format) {
      case "json":
        return JSON.stringify(response.data, null, 2);
      case "xml":
        return this.toXML(response.data);
      case "markdown":
        return this.toMarkdown(response);
      default:
        return JSON.stringify(response.data, null, 2);
    }
  }

  private toXML(data: any, rootName = "root"): string {
    function objToXml(obj: any, indent = "  "): string {
      if (obj === null || typeof obj === "undefined") {
        return "";
      }
      if (Array.isArray(obj)) {
        return obj
          .map(
            (item) => `${indent}<item>${objToXml(item, indent + "  ")}</item>`
          )
          .join("");
      }
      if (typeof obj !== "object") {
        return obj.toString();
      }

      let xml = "";
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          xml += `\n${indent}<${key}>${objToXml(value, indent + "  ")}</${key}>`;
        }
      }
      return xml;
    }
    return `<${rootName}>${objToXml(data, "  ")}\n</${rootName}>`;
  }

  private toMarkdown(response: MockResponse): string {
    let md = `# Mock Response for ${response.schema.name || "Unnamed Schema"}\n`;
    md += `\n## Data\n`;
    md += "```json\n" + JSON.stringify(response.data, null, 2) + "\n```";
    if (response.metadata) {
      md += `\n## Metadata\n`;
      md += "```json\n" + JSON.stringify(response.metadata, null, 2) + "\n```";
    }
    return md;
  }

  private validateSchema(schema: SchemaForm): void {
    if (!schema.fields || Object.keys(schema.fields).length === 0) {
      throw new SyntexError(
        "Invalid schema: fields definition is missing or empty.",
        "INVALID_SCHEMA"
      );
    }
    for (const [fieldName, field] of Object.entries(schema.fields)) {
      this.validateField(fieldName, field);
    }
  }

  private validateField(fieldName: string, field: SchemaField): void {
    const validTypes = [
      "string",
      "number",
      "boolean",
      "array",
      "object",
      "enum",
      "uuid",
      "email",
      "url",
      "date",
      "union",
      "intersection",
      "nullable",
      "reference",
    ];

    if (!validTypes.includes(field.type)) {
      throw new SyntexError(
        `Invalid field type "${field.type}" for field "${fieldName}"`,
        "INVALID_FIELD_TYPE"
      );
    }

    if (field.type === "array" && !field.items) {
      throw new SyntexError(
        `Array field "${fieldName}" must have items definition`,
        "MISSING_ITEMS"
      );
    }

    if (field.type === "object" && !field.properties) {
      throw new SyntexError(
        `Object field "${fieldName}" must have properties definition`,
        "MISSING_PROPERTIES"
      );
    }

    if (field.type === "enum" && (!field.enum || field.enum.length === 0)) {
      throw new SyntexError(
        `Enum field "${fieldName}" must have enum values`,
        "MISSING_ENUM_VALUES"
      );
    }

    if (
      field.min !== undefined &&
      field.max !== undefined &&
      field.min > field.max
    ) {
      throw new SyntexError(
        `Field "${fieldName}": min (${field.min}) cannot be greater than max (${field.max})`,
        "INVALID_MIN_MAX"
      );
    }
  }

  private generateObjectData(
    fields: Record<string, SchemaField>,
    globalContext: Record<string, any> = {},
    currentData: Record<string, any> = {}
  ): Record<string, any> {
    const data = currentData;
    for (const [fieldName, field] of Object.entries(fields)) {
      if (field.simulateError && this.rng.random() < 0.5) {
        data[fieldName] = { error: field.errorType ?? "SimulatedFieldError" };
        continue;
      }

      const isRequired = field.required !== false;
      const probability = field.probability ?? 1.0;
      if (!isRequired && probability === 0) {
        continue;
      }
      const shouldInclude =
        (isRequired || this.rng.random() < probability) &&
        (!field.condition || field.condition(data, globalContext));

      if (shouldInclude) {
        let value = this.generateFieldValue(field, globalContext, data);
        if (
          this.options.hallucinate &&
          this.rng.random() < (this.options.hallucinationProbability ?? 0.1)
        ) {
          value = this.simulateHallucination(field);
        }
        data[fieldName] = value;
      }
    }
    return data;
  }

  private interpolateTemplate(
    template: string,
    globalContext: Record<string, any>,
    currentData: Record<string, any>
  ): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      if (currentData[key] !== undefined) {
        return String(currentData[key]);
      }
      if (globalContext[key] !== undefined) {
        return String(globalContext[key]);
      }
      return "";
    });
  }

  private generateFieldValue(
    field: SchemaField,
    globalContext: Record<string, any> = {},
    currentData: Record<string, any> = {}
  ): any {
    for (const plugin of this._plugins) {
      const result = plugin.onGenerateField?.(
        field,
        globalContext,
        currentData,
        this.rng
      );
      if (result !== undefined) return result;
    }
    if (field.generateFn) {
      return field.generateFn(globalContext, currentData, this.rng);
    }
    switch (field.type) {
      case "string":
        return this.generateString(field, globalContext, currentData);
      case "number":
        return this.generateNumber(field);
      case "boolean":
        return this.rng.randomBoolean();
      case "array":
        return this.generateArray(field, globalContext, currentData);
      case "object":
        return this.generateObjectData(field.properties!, globalContext, {});
      case "enum":
        return this.rng.randomWeightedChoice(field.enum!);
      case "uuid":
        return this.rng.randomUuid();
      case "email":
        return this.rng.randomEmail();
      case "url":
        return this.rng.randomUrl();
      case "date":
        return this.generateDate(field);
      case "union":
        return this.generateFieldValue(
          this.rng.randomChoice(field.unionTypes!),
          globalContext,
          currentData
        );
      case "intersection":
        return field.intersectionTypes!.reduce((acc, t) => {
          const val = this.generateFieldValue(t, globalContext, currentData);
          if (typeof val === "object" && val !== null) {
            return { ...acc, ...val };
          }
          return val;
        }, {});
      case "nullable":
        return this.rng.randomBoolean()
          ? this.generateFieldValue(
              field.nullableType!,
              globalContext,
              currentData
            )
          : null;
      case "reference":
        if (!field.reference || !this.registeredSchemas[field.reference]) {
          throw new SyntexError(
            `Reference to unregistered schema "${field.reference}"`,
            "UNREGISTERED_SCHEMA_REFERENCE"
          );
        }
        return this.generateObjectData(
          this.registeredSchemas[field.reference].fields,
          globalContext,
          {}
        );
      default:
        throw new SyntexError(
          `Unsupported field type: ${field.type}`,
          "UNSUPPORTED_TYPE"
        );
    }
  }

  private generateString(
    field: SchemaField,
    globalContext: Record<string, any> = {},
    currentData: Record<string, any> = {}
  ): string {
    if (field.template) {
      return this.interpolateTemplate(
        field.template,
        globalContext,
        currentData
      );
    }
    if (field.pattern) {
      return this.generatePatternString(field.pattern);
    }

    const minLength = field.min || 1;
    const maxLength = field.max || 50;
    const length = this.rng.randomInt(minLength, maxLength);

    const words = [
      "lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit",
      "sed",
      "do",
      "eiusmod",
      "tempor",
      "incididunt",
      "ut",
      "labore",
      "et",
      "dolore",
      "magna",
      "aliqua",
      "enim",
      "ad",
      "minim",
      "veniam",
      "quis",
      "nostrud",
    ];

    let result = "";
    while (result.length < length) {
      const word = this.rng.randomChoice(words);
      if (result.length + word.length + 1 <= length) {
        result += (result ? " " : "") + word;
      } else {
        break;
      }
    }

    return result || this.rng.randomString(length);
  }

  private generatePatternString(pattern: string): string {
    if (pattern.includes("[A-Z]")) {
      return this.rng.randomString(8, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if (pattern.includes("[0-9]")) {
      return this.rng.randomString(6, "0123456789");
    }
    return this.rng.randomString(10);
  }

  private generateNumber(field: SchemaField): number {
    const min = field.min || 0;
    const max = field.max || 1000;

    if (Number.isInteger(min) && Number.isInteger(max)) {
      return this.rng.randomInt(min, max);
    }

    return min + this.rng.random() * (max - min);
  }

  private generateArray(
    field: SchemaField,
    globalContext: Record<string, any> = {},
    currentData: Record<string, any> = {}
  ): any[] {
    const minLength = field.min ?? 1;
    const maxLength = field.max ?? 5;
    if (minLength === 0 && maxLength === 0) {
      return [];
    }
    const length = this.rng.randomInt(minLength, maxLength);
    const array = [];
    for (let i = 0; i < length; i++) {
      array.push(
        this.generateFieldValue(field.items!, globalContext, currentData)
      );
    }
    return array;
  }

  private generateDate(field: SchemaField): string {
    const start = this.options.dateRange?.start;
    const end = this.options.dateRange?.end;
    const date = this.rng.randomDate(start, end);
    if (field.format === "date-time") {
      return date.toISOString();
    }
    return date.toISOString().split("T")[0];
  }

  private handleRateLimiting(now: number): void {
    if (this.options.rateLimit && this.options.rateLimitIntervalMs) {
      if (now - this.lastReset > this.options.rateLimitIntervalMs) {
        this.requestCount = 0;
        this.lastReset = now;
      }
      this.requestCount++;
      if (this.requestCount > this.options.rateLimit) {
        throw new SyntexError("Rate limit exceeded", "RATE_LIMIT");
      }
    }
  }

  private handleQuota(): void {
    if (
      this.options.quota !== undefined &&
      this.options.quotaUsed !== undefined
    ) {
      if (this.options.quotaUsed >= this.options.quota) {
        throw new SyntexError("Quota exceeded", "QUOTA_EXCEEDED");
      }
      this.options.quotaUsed++;
    }
  }

  private handleGlobalErrorSimulation(): void {
    if (
      this.options.simulateError &&
      ((this.options.errorProbability ?? 0.1) === 1 ||
        this.rng.random() < (this.options.errorProbability ?? 0.1))
    ) {
      const errorTypes = [
        "TIMEOUT",
        "MODEL_UNAVAILABLE",
        "MALFORMED_REQUEST",
        "RATE_LIMIT",
        "INTERNAL_SERVER_ERROR",
      ];
      throw new SyntexError(
        "Simulated global error for testing.",
        this.rng.randomChoice(errorTypes)
      );
    }
  }
}

/**
 * Base class for all schema field builders.
 * Handles common modifiers like required, min, max, probability, condition, template, etc.
 * @template TInfer The inferred TypeScript type of the field.
 */
abstract class SBase<TInfer = any> {
  protected _field: Partial<SchemaField> = {};
  protected _type: SchemaField["type"];

  constructor(type: SchemaField["type"]) {
    this._type = type;
    this._field.type = type;
  }

  /** Marks the field as required. */
  required(): this {
    this._field.required = true;
    return this;
  }

  /** Marks the field as optional (default behavior). */
  optional(): this {
    this._field.required = false;
    return this;
  }

  /** Sets the minimum value for numbers, minimum length for strings/arrays. */
  min(val: number): this {
    this._field.min = val;
    return this;
  }

  /** Sets the maximum value for numbers, maximum length for strings/arrays. */
  max(val: number): this {
    this._field.max = val;
    return this;
  }

  /** Sets a regex pattern for string generation. */
  pattern(p: string): this {
    this._field.pattern = p;
    return this;
  }

  /** Sets a format for date generation (e.g., "date-time" or "date"). */
  format(f: "date" | "date-time"): this {
    this._field.format = f;
    return this;
  }

  /** Sets the probability (0-1) that this field will be included in the output. */
  probability(p: number): this {
    if (p < 0 || p > 1) {
      throw new SyntexError(
        "Probability must be between 0 and 1.",
        "INVALID_PROBABILITY"
      );
    }
    this._field.probability = p;
    return this;
  }

  /**
   * Defines a condition function for field inclusion.
   * The field will only be generated if the condition returns true.
   * @param conditionFn A function that receives the `currentData` (generated fields within the current object) and `globalContext` and returns a boolean.
   */
  condition(
    conditionFn: (
      currentData: Record<string, any>,
      globalContext: Record<string, any>
    ) => boolean
  ): this {
    this._field.condition = conditionFn;
    return this;
  }

  /**
   * A simplified `when` helper for common conditional logic.
   * Includes the field only if `fieldName` in `currentData` equals `value`.
   * For more complex logic, use `condition()`.
   * @param fieldName The name of another field in the same object.
   * @param value The value the `fieldName` should have for this field to be included.
   */
  when(fieldName: string, value: any): this {
    return this.condition((currentData) => currentData[fieldName] === value);
  }

  /** Sets a string template for the field's value. Can use `{{key}}` for context values or other fields. */
  template(t: string): this {
    this._field.template = t;
    return this;
  }

  /** Enables simulation of an error for this specific field. */
  simulateError(enable: boolean = true): this {
    this._field.simulateError = enable;
    return this;
  }

  /** Sets a specific error type for a simulated field error. */
  errorType(type: string): this {
    this._field.errorType = type;
    return this;
  }

  /**
   * Provides a custom function to generate the field's value.
   * This overrides all other generation methods for this field.
   * @param fn A function that receives the `globalContext`, `currentData`, and `rng` instance and returns the value.
   */
  generate(
    fn: (
      context: Record<string, any>,
      currentData: Record<string, any>,
      rng: RandomGenerator
    ) => TInfer
  ): this {
    this._field.generateFn = fn;
    return this;
  }

  /** Returns the compiled SchemaField object. */
  build(): SchemaField {
    return { ...this._field } as SchemaField;
  }
}

class SString extends SBase<string> {
  constructor() {
    super("string");
  }
}
class SNumber extends SBase<number> {
  constructor() {
    super("number");
  }
}
class SBoolean extends SBase<boolean> {
  constructor() {
    super("boolean");
  }
}
class SUUID extends SBase<string> {
  constructor() {
    super("uuid");
  }
}
class SEmail extends SBase<string> {
  constructor() {
    super("email");
  }
}
class SURL extends SBase<string> {
  constructor() {
    super("url");
  }
}
class SDate extends SBase<string> {
  constructor() {
    super("date");
  }
}
class SEnum<T extends string | number | boolean> extends SBase<T> {
  constructor(values: Array<EnumValue<T>>) {
    super("enum");
    if (!Array.isArray(values) || values.length === 0) {
      throw new SyntexError(
        "Enum must have at least one value.",
        "MISSING_ENUM_VALUES"
      );
    }
    this._field.enum = values;
  }
}
class SArray<TItem extends SBase> extends SBase<Array<InferSBase<TItem>>> {
  constructor(item: TItem) {
    super("array");
    this._field.items = item.build();
  }
}

/**
 * Helper type to extract the inferred type from a `SBase` instance.
 * `typeof m.string().infer` would be `string`.
 */
type InferSBase<T extends SBase> = T extends SBase<infer U> ? U : never;

/**
 * Maps a record of SBase types to their inferred TypeScript types.
 * Used for `SObject` to get the final inferred type.
 */
type MapSBaseToInfer<T extends Record<string, SBase>> = {
  [K in keyof T]: InferSBase<T[K]> extends SchemaForm<infer O>
    ? O
    : InferSBase<T[K]>;
};

class SObject<
  TFields extends Record<string, SBase>,
  TInferred = MapSBaseToInfer<TFields>,
> extends SBase<TInferred> {
  private _fields: TFields;
  constructor(fields: TFields) {
    super("object");
    this._fields = fields;
    this._field.properties = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, v.build()])
    );
  }
  /**
   * Extends the current object schema with additional fields.
   * @param additionalFields A record of new SBase fields to add.
   */
  extend<TExtraFields extends Record<string, SBase>>(
    additionalFields: TExtraFields
  ): SObject<
    TFields & TExtraFields,
    TInferred & MapSBaseToInfer<TExtraFields>
  > {
    const extendedFields = {
      ...this._fields,
      ...additionalFields,
    } as TFields & TExtraFields;
    const newObj = new SObject(extendedFields);
    return newObj as SObject<
      TFields & TExtraFields,
      TInferred & MapSBaseToInfer<TExtraFields>
    >;
  }
  /**
   * Creates a new object schema with only the specified fields.
   * @param keys An array of keys to pick from the current schema.
   */
  pick<K extends keyof TFields>(keys: K[]): SObject<Pick<TFields, K>, unknown> {
    const pickedFields: Partial<TFields> = {};
    for (const key of keys) {
      if (key in this._fields) {
        pickedFields[key] = this._fields[key];
      }
    }
    const newObj = new SObject(pickedFields as Pick<TFields, K>);
    return newObj as SObject<Pick<TFields, K>, unknown>;
  }
  /**
   * Creates a new object schema by omitting the specified fields.
   * @param keys An array of keys to omit from the current schema.
   */
  omit<K extends keyof TFields>(keys: K[]): SObject<Omit<TFields, K>, unknown> {
    const omittedFields: Partial<TFields> = { ...this._fields };
    for (const key of keys) {
      delete omittedFields[key];
    }
    const newObj = new SObject(omittedFields as Omit<TFields, K>);
    return newObj as SObject<Omit<TFields, K>, unknown>;
  }
  /** Returns the compiled SchemaField object. */
  build(name?: string, version?: string): SchemaForm<TInferred> {
    const compiledFields: Record<string, SchemaField<any>> = Object.fromEntries(
      Object.entries(this._fields).map(([k, v]) => [k, v.build()])
    );
    const schema = new SchemaForm<TInferred>({
      name,
      version,
      fields: compiledFields,
      properties: compiledFields,
    });
    return schema as SchemaForm<TInferred> & { readonly infer: TInferred };
  }
}

class SUnion<TTypes extends SBase[]> extends SBase<InferSBase<TTypes[number]>> {
  constructor(types: TTypes) {
    super("union");
    this._field.unionTypes = types.map((t) => t.build());
  }
  build(): SchemaField<InferSBase<TTypes[number]>> & {
    readonly infer: InferSBase<TTypes[number]>;
  } {
    return { ...this._field } as SchemaField<InferSBase<TTypes[number]>> & {
      readonly infer: InferSBase<TTypes[number]>;
    };
  }
}

class SIntersection<TTypes extends SBase[]> extends SBase<
  InferSBase<TTypes[number]>
> {
  constructor(types: TTypes) {
    super("intersection");
    this._field.intersectionTypes = types.map((t) => t.build());
  }
  build(): SchemaField<InferSBase<TTypes[number]>> & {
    readonly infer: InferSBase<TTypes[number]>;
  } {
    return { ...this._field } as SchemaField<InferSBase<TTypes[number]>> & {
      readonly infer: InferSBase<TTypes[number]>;
    };
  }
}

class SNullable<TType extends SBase> extends SBase<InferSBase<TType> | null> {
  constructor(type: TType) {
    super("nullable");
    this._field.nullableType = type.build();
  }
  build(): SchemaField<InferSBase<TType> | null> & {
    readonly infer: InferSBase<TType> | null;
  } {
    return { ...this._field } as SchemaField<InferSBase<TType> | null> & {
      readonly infer: InferSBase<TType> | null;
    };
  }
}
class SReference extends SBase<any> {
  constructor(ref: string) {
    super("reference");
    this._field.reference = ref;
  }
}

class SnapshotUtils {
  static toSnapshot(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  static compareSnapshot(data: any, snapshot: string): boolean {
    return SnapshotUtils.toSnapshot(data) === snapshot;
  }
}

class DocGenerator {
  static toMarkdown(schema: SchemaForm): string {
    const lines: string[] = [
      `# ${schema.name || "Unnamed"} Schema`,
      `\n| Field | Type | Required | Description |`,
      `|-------|------|----------|-------------|`,
    ];
    for (const [fieldName, field] of Object.entries(schema.fields)) {
      lines.push(
        `| ${fieldName} | ${DocGenerator.fieldType(field)} | ${field.required !== false ? "Yes" : "No"} | |`
      );
    }
    return lines.join("\n");
  }

  static fieldType(field: SchemaField): string {
    switch (field.type) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "uuid":
        return "uuid";
      case "email":
        return "email";
      case "url":
        return "url";
      case "date":
        return `date(${field.format || "date"})`;
      case "enum":
        const enumValues = field.enum
          ? field.enum.map((v) =>
              typeof v === "object" && "value" in v
                ? JSON.stringify(v.value)
                : JSON.stringify(v)
            )
          : [];
        return `Enum<${enumValues.join(" | ")}>`;
      case "array":
        return `Array<${DocGenerator.fieldType(field.items!)}>`;
      case "object":
        return "object";
      case "union":
        return field.unionTypes
          ? field.unionTypes.map(DocGenerator.fieldType).join(" | ")
          : "any";
      case "intersection":
        return field.intersectionTypes
          ? field.intersectionTypes.map(DocGenerator.fieldType).join(" & ")
          : "any";
      case "nullable":
        return `${DocGenerator.fieldType(field.nullableType!)} | null`;
      case "reference":
        return `ref:${field.reference}`;
      default:
        return field.type;
    }
  }
}

/**
 * Creates instances of the MockGenerator with various configurations.
 */
class SyntexFactory {
  static createGenerator(options: MockGeneratorOptions = {}): MockGenerator {
    return new MockGenerator(options);
  }

  static createSeededGenerator(seed: number): MockGenerator {
    return new MockGenerator({ seed });
  }

  static createLocalizedGenerator(
    locale: string,
    options: MockGeneratorOptions = {}
  ): MockGenerator {
    return new MockGenerator({ ...options, locale });
  }
}

class SchemaUtils {
  /**
   * Creates a basic SchemaForm for an object type.
   * @deprecated Use `m.object({...}).build('SchemaName', '1.0.0')` directly for better type inference.
   */
  static createBasicSchema(
    name: string,
    fields: Record<string, SchemaField>
  ): SchemaForm {
    return new SchemaForm({
      name,
      version: "1.0.0",
      fields: fields as Record<string, SchemaField<any>>,
      properties: fields as Record<string, SchemaField<any>>,
    });
  }

  static createCollection(
    name: string,
    schemas: SchemaForm[]
  ): SchemaCollection {
    return {
      name,
      version: "1.0.0",
      schemas,
    };
  }

  /**
   * Merges two SchemaForms (object types). The fields from `extensionSchema` will override those in `baseSchema`.
   * @param baseSchema The base SchemaForm.
   * @param extensionSchema The SchemaForm to extend with.
   * @returns A new SchemaForm with merged fields.
   */
  static mergeSchemas<T1, T2>(
    baseSchema: SchemaForm<T1>,
    extensionSchema: SchemaForm<T2>
  ): SchemaForm<T1 & T2> {
    const mergedFields: Record<string, SBase> = {
      ...baseSchema.fields,
      ...extensionSchema.fields,
    } as any;
    const newSchema = new SObject(mergedFields).build(
      `${baseSchema.name || "Unnamed"}Extended`,
      baseSchema.version || extensionSchema.version
    );
    return newSchema as SchemaForm<T1 & T2>;
  }

  static validateData(data: any, schema: SchemaForm): boolean {
    for (const [fieldName, field] of Object.entries(schema.fields)) {
      if (field.required !== false && !(fieldName in data)) {
        return false;
      }
      if (fieldName in data) {
        if (!SchemaUtils.validateType(data[fieldName], field)) {
          return false;
        }
      }
    }
    return true;
  }

  static validateType(value: any, field: SchemaField): boolean {
    switch (field.type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number";
      case "boolean":
        return typeof value === "boolean";
      case "uuid":
      case "email":
      case "url":
        return typeof value === "string";
      case "date":
        return typeof value === "string" && !isNaN(Date.parse(value));
      case "enum":
        if (!Array.isArray(field.enum)) return false;
        const enumPlainValues = field.enum.map((e) =>
          typeof e === "object" && "value" in e ? e.value : e
        );
        return enumPlainValues.includes(value);
      case "array":
        return (
          Array.isArray(value) &&
          value.every((v) => SchemaUtils.validateType(v, field.items!))
        );
      case "object":
        return (
          typeof value === "object" &&
          value !== null &&
          SchemaUtils.validateData(
            value,
            new SchemaForm({
              fields: field.properties! as Record<string, SchemaField<any>>,
            })
          )
        );
      case "union":
        return (
          Array.isArray(field.unionTypes) &&
          field.unionTypes.some((t) => SchemaUtils.validateType(value, t))
        );
      case "intersection":
        return (
          typeof value === "object" &&
          value !== null &&
          Array.isArray(field.intersectionTypes) &&
          field.intersectionTypes.every((t) =>
            SchemaUtils.validateType(value, t)
          )
        );
      case "nullable":
        return (
          value === null || SchemaUtils.validateType(value, field.nullableType!)
        );
      case "reference":
        return typeof value === "object" && value !== null;
      default:
        return false;
    }
  }
}

/**
 * Utility for generating TypeScript interface strings from schemas.
 */
class TypeInference {
  /**
   * Generates a TypeScript interface string from a compiled SchemaForm.
   * This is provided for documentation/tooling; for direct type inference,
   * use `typeof mySchema.infer`.
   * @param schema The SchemaForm object.
   * @returns A string representing the TypeScript interface.
   */
  static inferType(schema: SchemaForm): string {
    const lines: string[] = [
      `interface ${schema.name || "GeneratedInterface"} {`,
    ];
    for (const [fieldName, field] of Object.entries(schema.fields)) {
      const isOptional =
        field.required === false ||
        (field.probability !== undefined && field.probability < 1);
      lines.push(
        `  ${fieldName}${isOptional ? "?" : ""}: ${TypeInference.fieldType(field)};`
      );
    }
    lines.push("}");
    return lines.join("\n");
  }

  static fieldType(field: SchemaField): string {
    let typeStr: string;
    switch (field.type) {
      case "string":
        typeStr = "string";
        break;
      case "number":
        typeStr = "number";
        break;
      case "boolean":
        typeStr = "boolean";
        break;
      case "uuid":
      case "email":
      case "url":
      case "date":
        typeStr = "string";
        break;
      case "enum":
        typeStr = field.enum
          ? field.enum
              .map((v) =>
                typeof v === "object" && "value" in v
                  ? JSON.stringify(v.value)
                  : JSON.stringify(v)
              )
              .join(" | ")
          : "any";
        break;
      case "array":
        typeStr = `${TypeInference.fieldType(field.items!)}[]`;
        break;
      case "object":
        const properties = Object.entries(field.properties || {})
          .map(([k, v]) => {
            const isOptional =
              v.required === false ||
              (v.probability !== undefined && v.probability < 1);
            return `${k}${isOptional ? "?" : ""}: ${TypeInference.fieldType(v)}`;
          })
          .join("; ");
        typeStr = `{ ${properties} }`;
        break;
      case "union":
        typeStr = field.unionTypes
          ? field.unionTypes.map(TypeInference.fieldType).join(" | ")
          : "any";
        break;
      case "intersection":
        typeStr = field.intersectionTypes
          ? field.intersectionTypes.map(TypeInference.fieldType).join(" & ")
          : "any";
        break;
      case "nullable":
        typeStr = `${TypeInference.fieldType(field.nullableType!)} | null`;
        break;
      case "reference":
        typeStr = field.reference || "any";
        break;
      default:
        typeStr = "any";
        break;
    }
    return typeStr;
  }
}

/**
 * The main entry point for building Syntex schemas.
 */
export const s = {
  string: () => new SString(),
  number: () => new SNumber(),
  boolean: () => new SBoolean(),
  uuid: () => new SUUID(),
  email: () => new SEmail(),
  url: () => new SURL(),
  date: () => new SDate(),
  /**
   * Defines an enum field. Can accept a simple array of values or an array of objects
   * with `value` and `weight` for probabilistic generation.
   * @example
   * m.enum(['red', 'green', 'blue'])
   * m.enum([{ value: 'admin', weight: 0.8 }, { value: 'user', weight: 0.2 }])
   */
  enum: <T extends string | number | boolean>(values: Array<EnumValue<T>>) =>
    new SEnum(values),
  array: <TItem extends SBase>(item: TItem) => new SArray(item),
  /**
   * Defines an object field with nested properties.
   * @example
   * m.object({
   *   id: m.uuid().required(),
   *   name: m.string(),
   * }).build('UserSchema');
   */
  object: <TFields extends Record<string, SBase>>(fields: TFields) =>
    new SObject(fields),
  union: <TTypes extends SBase[]>(types: TTypes) => new SUnion(types),
  intersection: <TTypes extends SBase[]>(types: TTypes) =>
    new SIntersection(types),
  nullable: <TType extends SBase>(type: TType) => new SNullable(type),
  /**
   * Defines a reference to another named schema within a SchemaCollection.
   * The referenced schema must be registered with the MockGenerator or included in a collection.
   * @example
   * m.object({
   *   organization: m.reference('OrganizationSchema')
   * })
   */
  reference: (ref: string) => new SReference(ref),
};

export {
  SchemaField,
  SchemaForm,
  SchemaCollection,
  MockResponse,
  MockGeneratorOptions,
  SyntexError,
  MockGenerator,
  SyntexFactory,
  TypeInference,
  SnapshotUtils,
  DocGenerator,
  SchemaUtils,
  SynthexPlugin,
};
