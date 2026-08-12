import {
  describe,
  expect,
  it,
} from "vitest";

import { SchemaVersionDetector } from "../src/index.js";

describe("SchemaVersionDetector", () => {
  const detector = new SchemaVersionDetector();

  it("should detect a declared string schema version", () => {
    expect(detector.detect({ schemaVersion: "1.0.0" })).toBe("1.0.0");
  });

  it("should not detect a version on a document without the property", () => {
    expect(detector.detect({ application: { name: "wallet" } })).toBeUndefined();
  });

  it("should not detect a non-string version", () => {
    expect(detector.detect({ schemaVersion: 1 })).toBeUndefined();
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "1.0.0"],
    ["a number", 1],
  ])("should not detect a version on %s", (_label, document) => {
    expect(detector.detect(document)).toBeUndefined();
  });
});
