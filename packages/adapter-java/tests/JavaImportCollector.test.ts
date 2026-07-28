import {
  describe,
  expect,
  it,
} from "vitest";

import {
  JavaImportCollector,
} from "../src/index.js";

describe("JavaImportCollector", () => {
  it("should deduplicate and sort imports", () => {
    const imports =
      new JavaImportCollector();

    imports.add("java.util.UUID");
    imports.add("java.math.BigDecimal");
    imports.add("java.util.UUID");

    expect(imports.values()).toEqual([
      "java.math.BigDecimal",
      "java.util.UUID",
    ]);
  });

  it("should ignore undefined imports", () => {
    const imports =
      new JavaImportCollector();

    imports.add(undefined);

    expect(imports.values()).toEqual([]);
  });
});