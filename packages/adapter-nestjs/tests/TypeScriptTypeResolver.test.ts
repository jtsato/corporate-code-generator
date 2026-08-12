import { describe, expect, it } from "vitest";
import type { PrimitiveType } from "@corporate-code-generator/core";
import { TypeScriptTypeResolver } from "../src/index.js";

describe("TypeScriptTypeResolver", () => {
  const resolver = new TypeScriptTypeResolver();

  it.each<[PrimitiveType, string, string, string]>([
    ["string", "string", "IsString", "String"],
    ["boolean", "boolean", "IsBoolean", "Boolean"],
    ["int32", "number", "IsInt", "Number"],
    ["int64", "number", "IsInt", "Number"],
    ["decimal", "number", "IsNumber", "Number"],
    ["uuid", "string", "IsUUID", "String"],
    ["date", "Date", "IsDate", "Date"],
    ["datetime", "Date", "IsDate", "Date"],
  ])(
    "resolves %s to %s with %s and %s",
    (type, name, validationDecorator, swaggerType) => {
      expect(resolver.resolve(type)).toEqual({
        name,
        validationDecorator,
        swaggerType,
      });
    },
  );
});
