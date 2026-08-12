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

  it("names a single column constraint without a group segment", () => {
    expect(toJavaDatabaseUniqueConstraintName("wallet", ["document_number"]))
      .toBe("uk_wallet_document_number_active_scope");
  });

  it("names a multi column constraint with a group segment", () => {
    expect(toJavaDatabaseUniqueConstraintName("wallet", ["tenant_id", "document_number"]))
      .toBe("uk_wallet_g2_tenant_id_document_number_active_scope");
  });

  it("keeps a name that exactly reaches the identifier limit unhashed", () => {
    const column = "external_reference_identifier_for_scopes";
    const name = toJavaDatabaseUniqueConstraintName("wallet", [column]);

    expect(name).toBe("uk_wallet_external_reference_identifier_for_scopes_active_scope");
    expect(name).toHaveLength(63);
  });

  it("truncates an over-long name and appends a zero padded hash", () => {
    const name = toJavaDatabaseUniqueConstraintName(
      "tenant_scoped_customer_account",
      ["external_reference_identifier", "document_number_1"],
    );

    expect(name).toBe("uk_tenant_scoped_customer_account_g2_external_referenc_064d739e");
    expect(name).toHaveLength(63);
  });
});
