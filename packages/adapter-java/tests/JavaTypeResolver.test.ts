import {
  describe,
  expect,
  it,
} from "vitest";

import {
  JavaTypeResolver,
} from "../src/index.js";

describe("JavaTypeResolver", () => {
  const resolver = new JavaTypeResolver();

  it("should resolve uuid", () => {
    expect(
      resolver.resolve("uuid"),
    ).toEqual({
      name: "UUID",
      import: "java.util.UUID",
    });
  });

  it("should resolve decimal", () => {
    expect(
      resolver.resolve("decimal"),
    ).toEqual({
      name: "BigDecimal",
      import: "java.math.BigDecimal",
    });
  });

  it("should resolve string without an import", () => {
    expect(
      resolver.resolve("string"),
    ).toEqual({
      name: "String",
    });
  });

  it("should resolve datetime", () => {
    expect(
      resolver.resolve("datetime"),
    ).toEqual({
      name: "OffsetDateTime",
      import: "java.time.OffsetDateTime",
    });
  });
});