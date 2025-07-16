describe("types", () => {
  it("should type-check", () => {
    expect(true).toBe(true);
  });
});

import { s, MockGenerator, TypeInference } from "../src/index";

const userSchema = s
  .object({
    id: s.uuid().required(),
    name: s.string().required(),
    email: s.email().required(),
    age: s.number().optional(),
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

type User = typeof userSchema.infer;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _user: User = {
  id: "abc",
  name: "Test",
  email: "test@example.com",
  isActive: true,
  tags: ["a"],
  profile: { bio: "b", website: "https://a.com" },
  role: "admin",
  createdAt: "2025-01-01T00:00:00Z",
  age: 42,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _tsType = TypeInference.inferType(userSchema);
// $ExpectType string
// @ts-expect-no-error

const _generator = new MockGenerator({ seed: 1 });

const _response = _generator.generate(userSchema);
// $ExpectType User
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _data: User = _response.data;

// @ts-expect-error Missing required fields
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _badUser: User = { id: "abc" };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _badUser2: User = {
  // @ts-expect-error Wrong type: id should be string
  id: 123,
  name: "Test",
  email: "a",
  isActive: true,
  tags: [],
  profile: { bio: "", website: "" },
  role: "admin",
  createdAt: "",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _extendedSchema = s
  .object({ foo: s.string().required() })
  .extend({ bar: s.number().optional() })
  .build("X");
type Extended = typeof _extendedSchema.infer;
// @ts-expect-error TS limitation: bar is optional but required in intersection
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ext: Extended = { foo: "a", bar: undefined };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unionSchema = s.union([s.string(), s.number()]).build();
type Union = typeof _unionSchema.infer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _u1: Union = "a";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _u2: Union = 1;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _intersectionSchema = s
  .intersection([
    s.object({ a: s.string().required() }),
    s.object({ b: s.number().required() }),
  ])
  .build();
type Inter = typeof _intersectionSchema.infer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _i: Inter = { a: "a", b: 1 };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _nullableSchema = s.nullable(s.string()).build();
type Nullable = typeof _nullableSchema.infer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _n1: Nullable = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _n2: Nullable = "x";
