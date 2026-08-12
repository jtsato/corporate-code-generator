import { describe, expect, it } from "vitest";
import { toJavaTypeName } from "../src/index.js";

describe("toJavaTypeName", () => {
  it.each([
    ["wallet", "Wallet"],
    ["order item", "OrderItem"],
    ["order_item", "OrderItem"],
    ["order-item", "OrderItem"],
    ["order.item", "OrderItem"],
    ["  wallet  ", "Wallet"],
  ])("converts %s to %s", (value, expected) => {
    expect(toJavaTypeName(value)).toBe(expected);
  });

  it("ignores leading and trailing separators", () => {
    expect(toJavaTypeName("_order_item_")).toBe("OrderItem");
  });

  it("rejects a blank source", () => {
    expect(() => toJavaTypeName("   ")).toThrow(
      "Java type name source must not be empty.",
    );
  });

  it("rejects a source with trailing invalid characters", () => {
    expect(() => toJavaTypeName("order!item")).toThrow(
      "Cannot derive a valid Java type name from 'order!item'.",
    );
  });

  it("rejects a source with a leading digit", () => {
    expect(() => toJavaTypeName("1order-item")).toThrow(
      "Cannot derive a valid Java type name from '1order-item'.",
    );
  });
});
