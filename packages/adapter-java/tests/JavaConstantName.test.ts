import { describe, expect, it } from "vitest";
import { toJavaConstantName } from "../src/index.js";

describe("toJavaConstantName", () => {
  it.each([
    ["Wallet_id", "WALLET_ID"],
    ["Wallet_balance", "WALLET_BALANCE"],
    ["OrderItem_createdAt", "ORDER_ITEM_CREATED_AT"],
    ["HTTPResult_responseURL", "HTTP_RESULT_RESPONSE_URL"],
  ])("converts %s to %s", (value, expected) => {
    expect(toJavaConstantName(value)).toBe(expected);
  });
});
