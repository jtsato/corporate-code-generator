import { describe, expect, it } from "vitest";
import {
  toKebabCaseName,
  toPluralKebabCaseName,
  toRestCollectionPath,
  toTypeScriptPropertyName,
  toTypeScriptTypeName,
} from "../src/index.js";

describe("toTypeScriptTypeName", () => {
  it.each([
    ["wallet", "Wallet"],
    ["order item", "OrderItem"],
    ["order_item", "OrderItem"],
    ["order-item", "OrderItem"],
    ["order.item", "OrderItem"],
    ["  wallet  ", "Wallet"],
  ])("converts %s to %s", (value, expected) => {
    expect(toTypeScriptTypeName(value)).toBe(expected);
  });

  it("ignores leading and trailing separators", () => {
    expect(toTypeScriptTypeName("_order_item_")).toBe("OrderItem");
  });

  it("rejects a blank source", () => {
    expect(() => toTypeScriptTypeName("   ")).toThrow(
      "TypeScript type name source must not be empty.",
    );
  });

  it("rejects a source with trailing invalid characters", () => {
    expect(() => toTypeScriptTypeName("order!item")).toThrow(
      "Cannot derive a valid TypeScript type name from 'order!item'.",
    );
  });

  it("rejects a source with a leading digit", () => {
    expect(() => toTypeScriptTypeName("1order-item")).toThrow(
      "Cannot derive a valid TypeScript type name from '1order-item'.",
    );
  });
});

describe("toTypeScriptPropertyName", () => {
  it.each([
    ["Wallet", "wallet"],
    ["order_item", "orderItem"],
  ])("converts %s to %s", (value, expected) => {
    expect(toTypeScriptPropertyName(value)).toBe(expected);
  });
});

describe("kebab case names", () => {
  it.each([
    ["Wallet", "wallet"],
    ["OrderItem", "order-item"],
    ["order_item", "order-item"],
  ])("converts %s to %s", (value, expected) => {
    expect(toKebabCaseName(value)).toBe(expected);
  });

  it("pluralises a kebab case name", () => {
    expect(toPluralKebabCaseName("OrderItem")).toBe("order-items");
  });

  it("builds a REST collection path", () => {
    expect(toRestCollectionPath("OrderItem")).toBe("/order-items");
  });
});
