import {
  describe,
  expect,
  it,
} from "vitest";

import {
  SimpleOutputPathResolver,
} from "../src/index.js";

describe("SimpleOutputPathResolver", () => {
  it("should resolve simple placeholders", () => {
    const resolver = new SimpleOutputPathResolver();

    expect(resolver.resolve("src/{{ packagePath }}/{{ className }}.java", {
      packagePath: "io/company",
      className: "Wallet",
    })).toBe("src/io/company/Wallet.java");
  });

  it("should resolve whitespace and multiple placeholders deterministically", () => {
    const resolver = new SimpleOutputPathResolver();

    expect(resolver.resolve("src/{{packagePath}}/{{ className }}.java", {
      packagePath: "io/company",
      className: "Wallet",
    })).toBe("src/io/company/Wallet.java");
  });

  it("should reject missing variables", () => {
    const resolver = new SimpleOutputPathResolver();

    expect(() => resolver.resolve("src/{{ className }}.java", {})).toThrow("Missing output variable 'className'.");
  });

  it("should reject unsupported syntax", () => {
    const resolver = new SimpleOutputPathResolver();

    expect(() => resolver.resolve("src/{{ foo.bar }}.java", { "foo.bar": "x" }))
      .toThrow("Output pattern contains unsupported placeholder syntax.");
  });

  it("should reject absolute paths and traversals in patterns", () => {
    const resolver = new SimpleOutputPathResolver();

    expect(() => resolver.resolve("/src/{{ className }}.java", {
      className: "Wallet",
    })).toThrow("Output path must be relative.");
    expect(() => resolver.resolve("src/{{ packagePath }}/../safe.java", {
      packagePath: "io/company",
    })).toThrow("Output path must not contain traversal segments.");
  });

  it("should reject traversal introduced by a variable", () => {
    const resolver = new SimpleOutputPathResolver();

    expect(() => resolver.resolve("src/{{ packagePath }}/Wallet.java", {
      packagePath: "../../outside",
    })).toThrow("Output path must not contain traversal segments.");
  });
});
