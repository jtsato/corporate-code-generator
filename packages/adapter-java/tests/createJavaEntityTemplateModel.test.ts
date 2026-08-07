import { describe, expect, it } from "vitest";
import { createJavaEntityTemplateModel } from "../src/transformers/createJavaEntityTemplateModel.js";
import type { Entity } from "@corporate-code-generator/core";

describe("createJavaEntityTemplateModel", () => {
  it("appends extra fields without a validation annotation", () => {
    const entity: Entity = {
      name: "Wallet",
      attributes: [{ name: "balance", type: "decimal", required: true, identifier: false }],
    };

    const model = createJavaEntityTemplateModel(entity, "io.github.jtsato.walletservice.core.domains.wallet.model", undefined, true, [
      { name: "createdAt", type: "LocalDateTime", import: "java.time.LocalDateTime" },
      { name: "updatedAt", type: "LocalDateTime", import: "java.time.LocalDateTime" },
    ]);

    expect(model.fields).toEqual([
      { name: "balance", type: "BigDecimal", modifiers: ["private", "final"], validationAnnotation: "@NotNull" },
      { name: "createdAt", type: "LocalDateTime", modifiers: ["private", "final"] },
      { name: "updatedAt", type: "LocalDateTime", modifiers: ["private", "final"] },
    ]);
    expect(model.constructorParameters).toEqual([
      { name: "balance", type: "BigDecimal" },
      { name: "createdAt", type: "LocalDateTime" },
      { name: "updatedAt", type: "LocalDateTime" },
    ]);
    expect(model.getters).toEqual([
      { name: "getBalance", returnType: "BigDecimal", fieldName: "balance" },
      { name: "getCreatedAt", returnType: "LocalDateTime", fieldName: "createdAt" },
      { name: "getUpdatedAt", returnType: "LocalDateTime", fieldName: "updatedAt" },
    ]);
    expect(model.imports).toContain("java.time.LocalDateTime");
  });

  it("defaults extraFields to empty and stays identical to today's behavior", () => {
    const entity: Entity = {
      name: "Wallet",
      attributes: [{ name: "balance", type: "decimal", required: true, identifier: false }],
    };

    const model = createJavaEntityTemplateModel(entity, "io.github.jtsato.walletservice.core.domains.wallet.model", undefined, true);

    expect(model.fields).toEqual([
      { name: "balance", type: "BigDecimal", modifiers: ["private", "final"], validationAnnotation: "@NotNull" },
    ]);
  });
});
