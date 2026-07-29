import { describe, expect, it } from "vitest";
import { toJavaDatabaseColumnName, toJavaDatabaseTableName } from "../src/index.js";

describe("Java database names", () => {
  it("converts Java type names to singular snake case table names", () => {
    expect(toJavaDatabaseTableName("Wallet")).toBe("wallet");
    expect(toJavaDatabaseTableName("OrderItem")).toBe("order_item");
  });

  it("converts simple Java property names to snake case column names", () => {
    expect(toJavaDatabaseColumnName("id")).toBe("id");
    expect(toJavaDatabaseColumnName("createdAt")).toBe("created_at");
    expect(toJavaDatabaseColumnName("documentNumber")).toBe("document_number");
  });
});
