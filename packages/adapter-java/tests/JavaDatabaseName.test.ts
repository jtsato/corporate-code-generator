import { describe, expect, it } from "vitest";
import { toJavaDatabaseColumnName, toJavaDatabaseTableName, toJavaDatabaseUniqueConstraintName } from "../src/index.js";

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

  it("keeps unique constraint names deterministic and bounded", () => {
    const columns = ["tenant_identifier_with_a_very_long_name", "external_identifier_with_a_very_long_name"];
    const first = toJavaDatabaseUniqueConstraintName("product", columns);

    expect(first).toHaveLength(63);
    expect(first).toBe(toJavaDatabaseUniqueConstraintName("product", columns));
  });
});
