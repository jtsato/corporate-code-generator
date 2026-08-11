import { describe, expect, it } from "vitest";

import type { ApplicationModel, Entity } from "@corporate-code-generator/core";

import { NestJsEntityTransformer } from "../src/transformers/NestJsEntityTransformer.js";

function entity(overrides: Partial<Entity> = {}): Entity {
  return {
    name: "Wallet",
    attributes: [
      { name: "id", type: "uuid", required: true, identifier: true },
      { name: "balance", type: "decimal", required: true, identifier: false },
    ],
    ...overrides,
  } as Entity;
}

describe("NestJsEntityTransformer", () => {
  const transformer = new NestJsEntityTransformer();

  it("derives class, property, file, and REST naming from the entity name", () => {
    const model = transformer.transform(entity({ name: "wallet_account" }));

    expect(model.className).toBe("WalletAccount");
    expect(model.propertyName).toBe("walletAccount");
    expect(model.fileName).toBe("wallet-account");
    expect(model.pluralFileName).toBe("wallet-accounts");
    expect(model.restCollectionPath).toBe("/wallet-accounts");
  });

  it("maps semantic primitive types to TypeScript types and validation decorators", () => {
    const model = transformer.transform(entity());

    expect(model.properties).toEqual([
      expect.objectContaining({
        name: "id",
        type: "string",
        validationDecorator: "IsUUID",
        testValue: '"00000000-0000-0000-0000-000000000001"',
        coreValidationStatements: expect.arrayContaining([
          expect.stringContaining("UUID_PATTERN"),
        ]),
      }),
      expect.objectContaining({
        name: "balance",
        type: "number",
        validationDecorator: "IsNumber",
        testValue: "1.5",
        coreValidationStatements: expect.arrayContaining([
          expect.stringContaining("Number.isFinite"),
        ]),
      }),
    ]);
  });

  it("exposes the identifier attribute separately", () => {
    const model = transformer.transform(entity());

    expect(model.identifier.name).toBe("id");
    expect(model.identifier.type).toBe("string");
  });

  it("collects sorted unique request validation imports including IsNotEmpty", () => {
    const model = transformer.transform(entity());

    expect(model.requestValidationImports).toEqual(["IsNotEmpty", "IsNumber", "IsUUID"]);
  });

  it("omits IsNotEmpty when no attribute is required", () => {
    const model = transformer.transform(entity({
      attributes: [{ name: "id", type: "uuid", required: false, identifier: true }],
    }));

    expect(model.requestValidationImports).toEqual(["IsUUID"]);
  });

  it("rejects an entity without an identifier attribute", () => {
    expect(() => transformer.transform(entity({
      attributes: [{ name: "balance", type: "decimal", required: true, identifier: false }],
    }))).toThrow("NestJS generation requires an identifier attribute on entity 'Wallet'.");
  });

  it("transforms every entity of an application model", () => {
    const application = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [entity(), entity({ name: "Ledger" })],
    } as ApplicationModel;

    const model = transformer.transformApplication(application);

    expect(model.applicationName).toBe("wallet-service");
    expect(model.entities.map((current) => current.className)).toEqual(["Wallet", "Ledger"]);
  });
});
