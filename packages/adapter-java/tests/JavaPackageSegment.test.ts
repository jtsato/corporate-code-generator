import { describe, expect, it } from "vitest";
import { toJavaPackageSegment } from "../src/index.js";

describe("toJavaPackageSegment", () => {
  it("normalizes Java type names into lower-case package segments", () => {
    expect(toJavaPackageSegment("Wallet")).toBe("wallet");
    expect(toJavaPackageSegment("OrderItem")).toBe("orderitem");
  });

  it("rejects invalid Java naming sources", () => {
    expect(() => toJavaPackageSegment(" ")).toThrow("must not be empty");
  });
});
