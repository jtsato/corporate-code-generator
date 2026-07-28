import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ModelSchemaRegistry,
  UnsupportedSchemaVersionError,
} from "../src/index.js";

describe("ModelSchemaRegistry", () => {
  it("should report supported schema versions", () => {
    const registry = new ModelSchemaRegistry();

    expect(registry.supportedVersions()).toEqual([
      "1.0",
    ]);
  });

  it("should identify supported schema versions", () => {
    const registry = new ModelSchemaRegistry();

    expect(registry.isSupported("1.0")).toBe(true);
    expect(registry.isSupported("2.0")).toBe(false);
  });

  it("should load a supported schema", async () => {
    const registry = new ModelSchemaRegistry();

    const schema = await registry.get("1.0");

    expect(schema).toBeDefined();

    expect(schema).toMatchObject({
      title: "Corporate Code Generator Application Model",
    });
  });

  it("should reject unsupported schema versions", async () => {
    const registry = new ModelSchemaRegistry();

    await expect(
      registry.get("99.0"),
    ).rejects.toBeInstanceOf(
      UnsupportedSchemaVersionError,
    );
  });
});