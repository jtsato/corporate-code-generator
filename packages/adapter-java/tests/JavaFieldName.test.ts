import { describe, expect, it } from "vitest";
import { toJavaFieldName } from "../src/index.js";

describe("toJavaFieldName", () => {
  it.each([
    ["FindWalletsUseCase", "findWalletsUseCase"],
    ["Wallet", "wallet"],
    ["OrderItem", "orderItem"],
  ])("converts %s to %s", (value, expected) => {
    expect(toJavaFieldName(value)).toBe(expected);
  });

  it("rejects invalid Java type names", () => {
    expect(() => toJavaFieldName("123 invalid")).toThrow(
      "Cannot derive a valid Java type name",
    );
  });
});
