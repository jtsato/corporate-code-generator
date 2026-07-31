import { describe, expect, it } from "vitest";
import { JavaTestFixtureValueResolver } from "../src/index.js";

describe("JavaTestFixtureValueResolver", () => {
  const resolver = new JavaTestFixtureValueResolver();

  it.each([
    ["string", 0, { javaExpression: "\"sample\"", jsonLiteral: "\"sample\"" }],
    ["boolean", 0, { javaExpression: "true", jsonLiteral: "true" }],
    ["int32", 0, { javaExpression: "42", jsonLiteral: "42" }],
    ["int64", 0, { javaExpression: "42L", jsonLiteral: "42" }],
    ["decimal", 0, { javaExpression: "new BigDecimal(\"123.45\")", jsonLiteral: "123.45" }],
    ["uuid", 0, {
      javaExpression: "UUID.fromString(\"11111111-1111-1111-1111-111111111111\")",
      jsonLiteral: "\"11111111-1111-1111-1111-111111111111\"",
    }],
    ["date", 0, {
      javaExpression: "LocalDate.parse(\"2026-01-15\")",
      jsonLiteral: "\"2026-01-15\"",
    }],
    ["datetime", 0, {
      javaExpression: "OffsetDateTime.parse(\"2026-01-15T10:30:00Z\")",
      jsonLiteral: "\"2026-01-15T10:30:00Z\"",
    }],
  ] as const)("resolves %s fixtures deterministically", (type, occurrenceIndex, expected) => {
    expect(resolver.resolve(type, occurrenceIndex)).toEqual(expected);
  });

  it.each([
    ["string", { javaExpression: "\"sample-2\"", jsonLiteral: "\"sample-2\"" }],
    ["boolean", { javaExpression: "false", jsonLiteral: "false" }],
    ["int32", { javaExpression: "43", jsonLiteral: "43" }],
    ["int64", { javaExpression: "43L", jsonLiteral: "43" }],
    ["decimal", { javaExpression: "new BigDecimal(\"124.45\")", jsonLiteral: "124.45" }],
    ["uuid", {
      javaExpression: "UUID.fromString(\"11111111-1111-1111-1111-111111111112\")",
      jsonLiteral: "\"11111111-1111-1111-1111-111111111112\"",
    }],
    ["date", {
      javaExpression: "LocalDate.parse(\"2026-01-16\")",
      jsonLiteral: "\"2026-01-16\"",
    }],
    ["datetime", {
      javaExpression: "OffsetDateTime.parse(\"2026-01-15T10:31:00Z\")",
      jsonLiteral: "\"2026-01-15T10:31:00Z\"",
    }],
  ] as const)("varies repeated %s fixtures by occurrence", (type, expected) => {
    expect(resolver.resolve(type, 1)).toEqual(expected);
  });

  it.each([-1, 1.5])("rejects invalid occurrence index %s", (occurrenceIndex) => {
    expect(() => resolver.resolve("string", occurrenceIndex)).toThrow(
      "Java test fixture occurrence index must be a non-negative integer.",
    );
  });
});
