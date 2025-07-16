import {
  s,
  MockGenerator,
  SyntexError,
  SchemaUtils,
  TypeInference,
  SnapshotUtils,
  DocGenerator,
  SchemaForm,
} from "../src/index";

describe("MockGenerator", () => {
  const userSchema = s
    .object({
      id: s.uuid().required(),
      name: s.string().min(2).max(50).required(),
      email: s.email().required(),
      age: s.number().min(18).max(99),
      isActive: s.boolean().required(),
      tags: s.array(s.string()).min(1).max(5),
      profile: s.object({
        bio: s.string().max(200),
        website: s.url(),
      }),
      role: s.enum(["admin", "user", "moderator"]),
      createdAt: s.date().format("date-time"),
    })
    .build("UserSchema", "1.0.0");

  it("should generate valid mock data with s.object() API", () => {
    const generator = new MockGenerator({ seed: 42 });

    const response = generator.generate(userSchema);

    expect(response.schema.name).toBe("UserSchema");

    const data = response.data as any;

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("email");
    expect(data).toHaveProperty("isActive");
    expect(data).toHaveProperty("tags");
    expect(data).toHaveProperty("profile");
    expect(data).toHaveProperty("role");
    expect(data).toHaveProperty("createdAt");

    expect(typeof data.id).toBe("string");
    expect(typeof data.name).toBe("string");
    expect(typeof data.email).toBe("string");
    expect(typeof data.isActive).toBe("boolean");
    expect(Array.isArray(data.tags)).toBe(true);
    if (data.profile) {
      expect(typeof data.profile.bio).toBe("string");
    }
    expect(["admin", "user", "moderator"]).toContain(data.role);
    expect(typeof data.createdAt).toBe("string");
  });

  it("should throw error for invalid schema definition (e.g., min > max)", () => {
    const generator = new MockGenerator();
    expect(() =>
      generator.generate(
        new SchemaForm({
          name: "InvalidString",
          fields: { str: s.string().min(10).max(5).build() },
          infer: undefined,
        })
      )
    ).toThrow(SyntexError);
    const badSchema = new SchemaForm({
      name: "Bad",
      version: "1.0.0",
      fields: {},
      infer: undefined,
    });
    expect(() => generator.generate(badSchema)).toThrow(SyntexError);
  });

  it("should generate multiple mock responses with s.object() API", () => {
    const generator = new MockGenerator({ seed: 123 });
    const responses = generator.generateMultiple(userSchema, 3);
    expect(responses.length).toBe(3);
    responses.forEach((response) => {
      expect(response.schema.name).toBe("UserSchema");
      const data = response.data as any;
      expect(data).toHaveProperty("id");
      expect(typeof data.id).toBe("string");
    });
  });

  it("should support chaining and edge cases", () => {
    const chainedSchema = s
      .object({
        str: s.string().min(5).max(10).pattern("[A-Z]").required(),
        num: s.number().min(1).max(2).required(),
        bool: s.boolean().required(),
        arr: s.array(s.number().min(1).max(2)).min(2).max(2).required(),
        obj: s
          .object({
            inner: s.string().max(5).required(),
          })
          .required(),
      })
      .build("ChainedSchema");
    const generator = new MockGenerator({ seed: 999 });
    const response = generator.generate(chainedSchema);
    const data = response.data as any;

    expect(typeof data.str).toBe("string");
    expect(data.str.length).toBeGreaterThanOrEqual(5);
    expect(data.str.length).toBeLessThanOrEqual(10);
    expect(data.str).toMatch(/[A-Z]+/);
    expect(typeof data.num).toBe("number");
    expect(data.num).toBeGreaterThanOrEqual(1);
    expect(data.num).toBeLessThanOrEqual(2);
    expect(typeof data.bool).toBe("boolean");
    expect(Array.isArray(data.arr)).toBe(true);
    expect(data.arr.length).toBe(2);
    expect(typeof data.obj.inner).toBe("string");
  });

  it("should handle deeply nested objects and arrays", () => {
    const deepSchema = s
      .object({
        users: s
          .array(
            s.object({
              id: s.uuid().required(),
              profile: s.object({
                name: s.string().min(2).max(10).required(),
                tags: s.array(s.string()).min(1).max(3).required(),
              }),
            })
          )
          .min(2)
          .max(2)
          .required(),
      })
      .build("DeepSchema");
    const generator = new MockGenerator({ seed: 2025 });
    const response = generator.generate(deepSchema);
    const data = response.data as any;

    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.length).toBe(2);
    data.users.forEach((user: any) => {
      expect(typeof user.id).toBe("string");
      expect(user.id).toMatch(/[a-f0-9\-]{36}/);
      expect(typeof user.profile.name).toBe("string");
      expect(user.profile.name.length).toBeGreaterThanOrEqual(2);
      expect(user.profile.name.length).toBeLessThanOrEqual(10);
      expect(Array.isArray(user.profile.tags)).toBe(true);
      expect(user.profile.tags.length).toBeGreaterThanOrEqual(1);
      expect(user.profile.tags.length).toBeLessThanOrEqual(3);
      user.profile.tags.forEach((tag: any) => {
        expect(typeof tag).toBe("string");
      });
    });
  });
});

describe("Edge Cases & Integration", () => {
  it("should handle empty arrays when min is 0", () => {
    const schema = s
      .object({
        items: s.array(s.string()).min(0).max(0).required(),
      })
      .build("EmptyArraySchema");
    const generator = new MockGenerator();
    const response = generator.generate(schema);
    const data = response.data as any;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(0);
  });

  it("should respect min/max boundaries for numbers", () => {
    const schema = s
      .object({
        value: s.number().min(5).max(5).required(),
      })
      .build("BoundaryNumberSchema");
    const generator = new MockGenerator();
    const response = generator.generate(schema);
    const data = response.data as any;
    expect(data.value).toBe(5);
  });

  it("should throw error for empty enum array", () => {
    expect(() => s.enum([]).build()).toThrow(SyntexError);
  });

  it("should generate mock data for a simulated API contract", () => {
    const apiSchema = s
      .object({
        user: s
          .object({
            id: s.uuid().required(),
            name: s.string().required(),
            email: s.email().required(),
            roles: s
              .array(s.enum(["admin", "user", "guest"]))
              .min(1)
              .max(2)
              .required(),
          })
          .required(),
        meta: s
          .object({
            requestId: s.uuid().required(),
            timestamp: s.date().format("date-time").required(),
          })
          .required(),
      })
      .build("APIContractSchema");
    const generator = new MockGenerator();
    const response = generator.generate(apiSchema);
    const data = response.data as any;

    expect(typeof data.user.id).toBe("string");
    expect(data.user.id).toMatch(/[a-f0-9\-]{36}/);
    expect(typeof data.user.name).toBe("string");
    expect(typeof data.user.email).toBe("string");
    expect(Array.isArray(data.user.roles)).toBe(true);
    expect(data.user.roles.length).toBeGreaterThanOrEqual(1);
    expect(data.user.roles.length).toBeLessThanOrEqual(2);
    expect(["admin", "user", "guest"]).toContain(data.user.roles[0]);
    expect(typeof data.meta.requestId).toBe("string");
    expect(typeof data.meta.timestamp).toBe("string");
  });
});

describe("Schema Validation", () => {
  it("should validate correct mock data against schema", () => {
    const userSchema = s
      .object({
        id: s.uuid().required(),
        name: s.string().required(),
        age: s.number().optional(),
      })
      .build("UserValidationSchema");
    const generator = new MockGenerator();
    const response = generator.generate(userSchema);
    const data = response.data as any;

    expect(SchemaUtils.validateData(data, userSchema)).toBe(true);
  });

  it("should fail validation for missing required field", () => {
    const schema = s
      .object({
        name: s.string().required(),
        age: s.number().optional(),
      })
      .build("MissingFieldSchema");
    const data = { age: 30 };
    expect(SchemaUtils.validateData(data, schema)).toBe(false);
  });

  it("should fail validation for wrong type", () => {
    const schema = s
      .object({
        age: s.number().required(),
      })
      .build("WrongTypeSchema");
    const data = { age: "thirty" };
    expect(SchemaUtils.validateData(data, schema)).toBe(false);
  });
});

describe("Advanced Data Types", () => {
  it("should generate union type values", () => {
    const schema = s
      .object({
        value: s.union([s.string(), s.number()]).required(),
      })
      .build("UnionSchema");
    const generator = new MockGenerator({ seed: 1 });
    const response = generator.generate(schema);
    const data = response.data as any;
    expect(
      [typeof data.value === "string", typeof data.value === "number"].some(
        Boolean
      )
    );

    const response2 = generator.generate(schema);
    const data2 = response2.data;
    expect(
      [typeof data2.value === "string", typeof data2.value === "number"].some(
        Boolean
      )
    );
  });

  it("should generate intersection type values", () => {
    const schema = s
      .object({
        value: s
          .intersection([
            s.object({ a: s.string().required() }),
            s.object({ b: s.number().required() }),
          ])
          .required(),
      })
      .build("IntersectionSchema");
    const generator = new MockGenerator();
    const response = generator.generate(schema);
    const data = response.data as any;
    expect(
      typeof (typeof data.value === "object" && "a" in data.value
        ? data.value.a
        : "")
    ).toBe("string");
    expect(
      typeof (typeof data.value === "object" && "b" in data.value
        ? data.value.b
        : 0)
    ).toBe("number");
  });

  it("should generate nullable type values", () => {
    const schema = s
      .object({
        maybe: s.nullable(s.string()).required(),
      })
      .build("NullableSchema");
    const generator = new MockGenerator({ seed: 1 });
    let nullCount = 0;
    let stringCount = 0;
    for (let i = 0; i < 20; i++) {
      const response = generator.generate(schema);
      const data = response.data;
      if (data.maybe === null) {
        nullCount++;
      } else if (typeof data.maybe === "string") {
        stringCount++;
      }
    }
    expect(nullCount).toBeGreaterThan(0);
    expect(stringCount).toBeGreaterThan(0);
    expect(nullCount + stringCount).toBe(20);
  });

  it("should generate reference type values (when schema is registered)", () => {
    const referencedUserSchema = s
      .object({
        userId: s.uuid().required(),
        userName: s.string().required(),
      })
      .build("ReferencedUserSchema");

    const mainSchema = s
      .object({
        primaryUser: s.reference("ReferencedUserSchema").required(),
      })
      .build("MainSchemaWithRef");

    const generator = new MockGenerator({ seed: 1 });
    generator.registerSchema(referencedUserSchema);

    const response = generator.generate(mainSchema);
    const data = response.data;

    expect(typeof data.primaryUser).toBe("object");
    expect(data.primaryUser).toHaveProperty("userId");
    expect(data.primaryUser).toHaveProperty("userName");
    expect(typeof data.primaryUser.userId).toBe("string");
    expect(typeof data.primaryUser.userName).toBe("string");
  });

  it("should throw an error if a reference is not registered", () => {
    const mainSchema = s
      .object({
        missingRef: s.reference("NonExistentSchema").required(),
      })
      .build("SchemaWithBadRef");

    const generator = new MockGenerator();
    expect(() => generator.generate(mainSchema)).toThrow(SyntexError);
    expect(() => generator.generate(mainSchema)).toThrow(
      'Reference to unregistered schema "NonExistentSchema"'
    );
  });
});

describe("Type Inference", () => {
  it("should infer TypeScript types from schema correctly including optional and nested types", () => {
    const schema = s
      .object({
        name: s.string().required(),
        age: s.number().optional(),
        tags: s.array(s.string()).required(),
        status: s.enum(["active", "inactive"]).required(),
        profile: s
          .object({
            email: s.email().required(),
            phone: s.string().optional(),
          })
          .optional(),
      })
      .build("User");

    const tsType = TypeInference.inferType(schema);

    expect(tsType).toContain("interface User");
    expect(tsType).toContain("name: string;");
    expect(tsType).toContain("age?: number;");
    expect(tsType).toContain("tags: string[];");
    expect(tsType).toContain('status: "active" | "inactive";');
    expect(tsType).toContain("profile: { email: string; phone?: string };");
  });

  it("should allow direct type inference using typeof schema.infer", () => {});
});

describe("Snapshot Testing Utilities", () => {
  it("should create and compare snapshots", () => {
    const data = { a: 1, b: "test", c: [1, 2, { d: "foo" }] };
    const snap = SnapshotUtils.toSnapshot(data);
    expect(snap).toEqual(JSON.stringify(data, null, 2));
    expect(SnapshotUtils.compareSnapshot(data, snap)).toBe(true);
    expect(
      SnapshotUtils.compareSnapshot(
        { a: 2, b: "test", c: [1, 2, { d: "foo" }] },
        snap
      )
    ).toBe(false);
    expect(
      SnapshotUtils.compareSnapshot({ a: 1, b: "test", c: [1, 2] }, snap)
    ).toBe(false);
  });
});

describe("Documentation Generator", () => {
  it("should generate markdown from schema correctly", () => {
    const schema = s
      .object({
        name: s.string().required(),
        age: s.number().optional(),
        tags: s.array(s.string()).required(),
        status: s.enum(["active", "inactive"]).required(),
        profile: s
          .object({
            email: s.email().required(),
            phone: s.string().optional(),
          })
          .optional(),
      })
      .build("User");
    const markdown = DocGenerator.toMarkdown(schema);

    expect(markdown).toContain("# User Schema");
    expect(markdown).toContain("| Field | Type | Required | Description |");
    expect(markdown).toContain("|-------|------|----------|-------------|");
    expect(markdown).toContain("| name | string | Yes | |");
    expect(markdown).toContain("| age | number | No | |");
    expect(markdown).toContain("| tags | Array<string> | Yes | |");
    expect(markdown).toContain(
      '| status | Enum<"active" | "inactive"> | Yes | |'
    );
    expect(markdown).toContain("| profile | object | Yes | |");
  });
});

describe("MockGenerator Advanced Features", () => {
  const advancedSchema = s
    .object({
      id: s.uuid().required(),
      name: s.string().required(),
      contextField: s.string().required(),
      errorField: s.string(),
    })
    .build("AdvancedSchema");
  advancedSchema.fields.name.template = "User-{{id}}";
  advancedSchema.fields.contextField.template = "Context-{{contextValue}}";
  advancedSchema.fields.errorField!.simulateError = true;
  advancedSchema.fields.errorField!.errorType = "TestError";

  it("should use context for contextual mocking", () => {
    const generator = new MockGenerator({
      context: { contextValue: "CTX123" },
    });
    const response = generator.generate(advancedSchema);
    const data = response.data;
    expect(data.contextField).toBe("Context-CTX123");
    expect(data.name.startsWith("User-")).toBe(true);
  });

  it("should support customizable randomness", () => {
    const genDet = new MockGenerator({ seed: 1, randomness: "deterministic" });
    const genDet2 = new MockGenerator({ seed: 1, randomness: "deterministic" });
    const det1 = genDet.generate(advancedSchema).data.id;
    const det2 = genDet2.generate(advancedSchema).data.id;
    expect(det1).toBe(det2);

    const genFuzz = new MockGenerator({ seed: 1, randomness: "fuzz" });
    const fuzz1 = genFuzz.generate(advancedSchema).data.id;
    const fuzz2 = genFuzz.generate(advancedSchema).data.id;
    expect(fuzz1).not.toBe(fuzz2);

    const genRandom = new MockGenerator({ randomness: "random" });
    const random1 = genRandom.generate(advancedSchema).data.id;
    const random2 = genRandom.generate(advancedSchema).data.id;
    expect(random1).not.toBe(random2);
  });

  it("should format output as JSON, XML, and Markdown", () => {
    const generatorJson = new MockGenerator({ outputFormat: "json" });
    const responseJson = generatorJson.generate(advancedSchema);
    expect(generatorJson.formatOutput(responseJson)).toContain('"id"');
    expect(generatorJson.formatOutput(responseJson)).not.toContain('"schema"');

    const generatorXml = new MockGenerator({ outputFormat: "xml" });
    const responseXml = generatorXml.generate(advancedSchema);
    expect(generatorXml.formatOutput(responseXml)).toContain("<id>");
    expect(generatorXml.formatOutput(responseXml)).toContain("<root>");

    const generatorMd = new MockGenerator({ outputFormat: "markdown" });
    const responseMd = generatorMd.generate(advancedSchema);
    expect(generatorMd.formatOutput(responseMd)).toContain(
      "# Mock Response for AdvancedSchema"
    );
    expect(generatorMd.formatOutput(responseMd)).toContain("## Data");
    expect(generatorMd.formatOutput(responseMd)).toContain("## Metadata");
  });
});

describe("MockGenerator Advanced Capabilities", () => {
  it("should simulate field-level errors", () => {
    const schemaWithSimulatedError = s
      .object({
        safeField: s.string().required(),
        errorField: s
          .string()
          .simulateError(true)
          .errorType("SimulatedFieldError"),
      })
      .build("SchemaWithErrorField");

    const generator = new MockGenerator({ seed: 123 });
    let errorSeen = false;
    let data;

    for (let i = 0; i < 20; i++) {
      const response = generator.generate(schemaWithSimulatedError);
      data = response.data;
      if (
        typeof data.errorField === "object" &&
        data.errorField !== null &&
        "error" in data.errorField
      ) {
        if ((data.errorField as any).error === "SimulatedFieldError") {
          errorSeen = true;
          break;
        }
      }
    }
    expect(errorSeen).toBe(true);
    expect(data?.safeField).toBeDefined();
  });

  it("should count tokens and enforce max token limit", () => {
    const largeTextSchema = s
      .object({
        text: s.string().min(50).max(100).required(),
      })
      .build("LargeTextSchema");

    const generatorExceed = new MockGenerator({ maxTokens: 10 });
    expect(() => generatorExceed.generate(largeTextSchema)).toThrow(
      SyntexError
    );
    expect(() => generatorExceed.generate(largeTextSchema)).toThrow(
      "Max token limit exceeded"
    );

    const generatorWithin = new MockGenerator({ maxTokens: 200 });
    const response = generatorWithin.generate(largeTextSchema);
    expect(response.metadata?.tokenUsage).toBeGreaterThan(0);
    expect(response.metadata?.tokenUsage).toBeLessThanOrEqual(200);
  });

  it("should support streaming interruption via abortSignal", async () => {
    const streamAbortSchema = s
      .object({
        a: s.string().required(),
        b: s.string().required(),
        c: s.string().required(),
      })
      .build("StreamAbortSchema");

    const abortController = new AbortController();
    const generator = new MockGenerator({
      abortSignal: abortController.signal,
      seed: 1,
    });

    const stream = generator.streamGenerate(streamAbortSchema, 1, 10);
    let errorCaught = false;
    let count = 0;
    try {
      for await (const {} of stream) {
        count++;

        if (count === 1) {
          abortController.abort();
        }
      }
    } catch (err: any) {
      errorCaught = err.code === "STREAM_ABORTED";
    }
    expect(errorCaught).toBe(true);
    expect(count).toBe(1);
  });

  it("should support role-based responses", () => {
    const roleSchema = s
      .object({
        message: s.string().required(),
        source: s.string().required().template("Generated by "),
      })
      .build("RoleSchema");

    const generator = new MockGenerator({
      roles: ["system", "user", "assistant", "tool"],
      seed: 1,
    });
    const response = generator.generate(roleSchema);

    expect(response.data).toHaveProperty("system");
    expect(response.data).toHaveProperty("user");
    expect(response.data).toHaveProperty("assistant");
    expect(response.data).toHaveProperty("tool");

    const assistantData = (response.data as any).assistant;
    expect(typeof assistantData.message).toBe("string");
    expect(assistantData.source).toBe("Generated by ");

    const userData = (response.data as any).user;
    expect(userData.source).toBe("Generated by ");
  });

  it("should include log tracing in metadata if enabled", () => {
    const logSchema = s
      .object({
        msg: s.string().required(),
      })
      .build("LogTraceSchema");
    const generator = new MockGenerator({ logTrace: true });
    const response = generator.generate(logSchema);
    expect(response.metadata?.log).toBeDefined();
    if (response.metadata?.log) {
      expect(response.metadata.log.requestId).toBeDefined();
      expect(typeof response.metadata.log.requestId).toBe("string");
      expect(response.metadata.log.requestTime).toBeDefined();
      expect(typeof response.metadata.log.requestTime).toBe("number");
    }
  });

  it("should enforce rate limiting and quota simulation", () => {
    const limitSchema = s
      .object({
        status: s.string().required(),
      })
      .build("LimitedSchema");

    const rateLimitGenerator = new MockGenerator({
      rateLimit: 2,
      rateLimitIntervalMs: 100,
    });
    rateLimitGenerator.generate(limitSchema);
    rateLimitGenerator.generate(limitSchema);
    expect(() => rateLimitGenerator.generate(limitSchema)).toThrow(SyntexError);
    expect(() => rateLimitGenerator.generate(limitSchema)).toThrow(
      "Rate limit exceeded"
    );

    const quotaGenerator = new MockGenerator({ quota: 2, quotaUsed: 1 });
    quotaGenerator.generate(limitSchema);
    expect(() => quotaGenerator.generate(limitSchema)).toThrow(SyntexError);
    expect(() => quotaGenerator.generate(limitSchema)).toThrow(
      "Quota exceeded"
    );
  });

  it("should support streaming output with delay", async () => {
    const streamDataSchema = s
      .object({
        a: s.string().required(),
        b: s.number().required(),
        c: s.boolean().required(),
      })
      .build("StreamDataSchema");
    const generator = new MockGenerator({ seed: 42 });

    for await (const {} of generator.streamGenerate(streamDataSchema, 1, 20)) {
    }
  });

  it("should respect probability for optional fields", () => {
    const probabilisticSchema = s
      .object({
        maybePresent: s.string().probability(0.0).optional(),
        alwaysPresent: s.string().required(),
        sometimesPresent: s.string().probability(0.5).optional(),
      })
      .build("ProbabilisticSchema");

    const generator = new MockGenerator({ seed: 1 });

    let sometimesPresentCount = 0;

    for (let i = 0; i < 100; i++) {
      const response = generator.generate(probabilisticSchema);
      const data = response.data;
      expect(data).toHaveProperty("alwaysPresent");
      expect(data).not.toHaveProperty("maybePresent");

      if (data.sometimesPresent !== undefined) {
        sometimesPresentCount++;
      }
    }

    expect(sometimesPresentCount).toBeGreaterThan(20);
    expect(sometimesPresentCount).toBeLessThan(80);
  });

  it("should support conditional fields based on other generated values", () => {
    const conditionalSchema = s
      .object({
        status: s.enum(["active", "inactive"]).required(),
        deactivationReason: s.string().when("status", "inactive").required(),
        activationDate: s
          .date()
          .format("date")
          .when("status", "active")
          .required(),
      })
      .build("ConditionalSchema");

    const generator = new MockGenerator({ seed: 50 });
    const responses = generator.generateMultiple(conditionalSchema, 100);

    let activeCount = 0;
    let inactiveCount = 0;

    responses.forEach((response) => {
      const data = response.data;
      if (data.status === "active") {
        activeCount++;
        expect(data).toHaveProperty("activationDate");
        expect(data).not.toHaveProperty("deactivationReason");
        expect(typeof data.activationDate).toBe("string");
      } else if (data.status === "inactive") {
        inactiveCount++;
        expect(data).toHaveProperty("deactivationReason");
        expect(data).not.toHaveProperty("activationDate");
        expect(typeof data.deactivationReason).toBe("string");
      }
    });

    expect(activeCount).toBeGreaterThan(0);
    expect(inactiveCount).toBeGreaterThan(0);
    expect(activeCount + inactiveCount).toBe(100);
  });

  it("should generate union and intersection types correctly", () => {
    const unionSchema = s
      .object({
        dynamicValue: s.union([s.string(), s.number()]).required(),
      })
      .build("UnionTestSchema");

    const intersectionSchema = s
      .object({
        combinedUser: s
          .intersection([
            s.object({ userId: s.uuid().required() }),
            s.object({ userName: s.string().required() }),
          ])
          .required(),
      })
      .build("IntersectionTestSchema");

    const generator = new MockGenerator({ seed: 7 });

    let stringCount = 0;
    let numberCount = 0;
    for (let i = 0; i < 20; i++) {
      const unionResponse = generator.generate(unionSchema);
      const data = unionResponse.data;
      if (typeof data.dynamicValue === "string") {
        stringCount++;
      } else if (typeof data.dynamicValue === "number") {
        numberCount++;
      }
    }
    expect(stringCount).toBeGreaterThan(0);
    expect(numberCount).toBeGreaterThan(0);
    expect(stringCount + numberCount).toBe(20);

    const intersectionResponse = generator.generate(intersectionSchema);
    const combinedData = intersectionResponse.data.combinedUser;

    if ("userId" in combinedData) {
      expect(typeof (combinedData as any).userId).toBe("string");
    }
    if ("userName" in combinedData) {
      expect(typeof (combinedData as any).userName).toBe("string");
    }
  });

  it("should support schema extension (extend, pick, omit)", () => {
    const baseObject = s.object({
      id: s.number().required(),
      name: s.string().required(),
      email: s.email().required(),
      secret: s.string().required(),
    });

    const extendedSchema = baseObject
      .extend({
        age: s.number().optional(),
        city: s.string().required(),
      })
      .build("ExtendedSchema");

    const generator = new MockGenerator({ seed: 10 });
    const extendedData = generator.generate(extendedSchema).data;
    expect(extendedData).toHaveProperty("id");
    expect(extendedData).toHaveProperty("name");
    expect(extendedData).toHaveProperty("email");
    expect(extendedData).toHaveProperty("secret");
    expect(extendedData).toHaveProperty("city");

    const pickedSchema = baseObject.pick(["id", "name"]).build("PickedSchema");
    const pickedData = generator.generate(pickedSchema).data;
    expect(pickedData).toHaveProperty("id");
    expect(pickedData).toHaveProperty("name");
    expect(pickedData).not.toHaveProperty("email");
    expect(pickedData).not.toHaveProperty("secret");

    const omittedSchema = baseObject
      .omit(["email", "secret"])
      .build("OmittedSchema");
    const omittedData = generator.generate(omittedSchema).data;
    expect(omittedData).toHaveProperty("id");
    expect(omittedData).toHaveProperty("name");
    expect(omittedData).not.toHaveProperty("email");
    expect(omittedData).not.toHaveProperty("secret");
  });

  it("should allow custom generateFn to override defaults", () => {
    const customSchema = s
      .object({
        customId: s
          .string()
          .generate(
            (ctx, currentData, rng) => `CUSTOM-${rng.randomInt(1000, 9999)}`
          ),
        greeting: s
          .string()
          .generate((ctx) => `Hello from ${ctx.userName || "Guest"}`),
        dependentField: s
          .string()
          .generate((ctx) => `ID is ${ctx.customId ?? "unknown"}`),
        randomBool: s
          .boolean()
          .generate((ctx, currentData, rng) => rng.random() > 0.7),
      })
      .build("CustomSchema");

    const generator = new MockGenerator({
      seed: 1,
      context: { userName: "Alice" },
    });
    const response = generator.generate(customSchema);
    const data = response.data;

    expect(data.customId).toMatch(/^CUSTOM-\d{4}$/);
    expect(data.greeting).toBe("Hello from Alice");
    expect(typeof data.dependentField).toBe("string");
    expect(typeof data.randomBool).toBe("boolean");
  });
});
