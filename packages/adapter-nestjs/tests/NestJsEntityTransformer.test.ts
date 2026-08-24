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
        testValue: '"00000000-0000-4000-8000-000000000001"',
        alternateTestValue: '"00000000-0000-4000-8000-000000000002"',
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

  it("prepares a distinct alternate value for generated mutation tests", () => {
    const model = transformer.transform(entity());

    expect(model.properties.find((property) => property.name === "balance")).toEqual(expect.objectContaining({
      testValue: "1.5",
      alternateTestValue: "2.5",
    }));
  });

  it("preserves attribute and composite uniqueness metadata", () => {
    const model = transformer.transform(entity({
      attributes: [
        { name: "id", type: "uuid", required: true, identifier: true, unique: true },
        { name: "tenantId", type: "uuid", required: true, identifier: false },
        { name: "externalId", type: "string", required: false, identifier: false },
      ],
      uniqueGroups: [["tenantId", "externalId"]],
    }));

    expect(model.uniqueAttributes).toEqual([{ name: "id", type: "string", testValue: '"00000000-0000-4000-8000-000000000001"', alternateTestValue: '"00000000-0000-4000-8000-000000000002"' }]);
    expect(model.uniqueGroupChecks).toEqual([{
      attributes: [
        expect.objectContaining({ name: "tenantId", type: "string" }),
        expect.objectContaining({ name: "externalId", type: "string" }),
      ],
    }]);
    expect(model.hasUniqueAttributes).toBe(true);
  });

  it("exposes the identifier attribute separately", () => {
    const model = transformer.transform(entity());

    expect(model.identifier.name).toBe("id");
    expect(model.identifier.type).toBe("string");
    expect(model.identifier.pathValueExpression).toBe("id");
  });

  it("prepares mutable properties and update/patch validation imports", () => {
    const model = transformer.transform(entity());

    expect(model.mutableProperties.map((property) => property.name)).toEqual(["balance"]);
    expect(model.updateRequestValidationImports).toEqual(["IsNotEmpty", "IsNumber"]);
    expect(model.patchRequestValidationImports).toEqual(["IsNumber", "IsOptional"]);
  });

  it("normalizes numeric path identifiers without hiding invalid values from Core validation", () => {
    const model = transformer.transform(entity({
      attributes: [
        { name: "id", type: "int64", required: true, identifier: true },
        { name: "balance", type: "decimal", required: true, identifier: false },
      ],
    }));

    expect(model.identifier.pathValueExpression).toBe("Number(id)");
    expect(model.identifier.coreValidationStatements).toEqual(expect.arrayContaining([
      expect.stringContaining("Number.isSafeInteger"),
    ]));
  });

  it.each(["date", "datetime"] as const)(
    "normalizes %s path identifiers as dates while preserving invalid dates for Core validation",
    (type) => {
      const model = transformer.transform(entity({
        attributes: [
          { name: "id", type, required: true, identifier: true },
          { name: "balance", type: "decimal", required: true, identifier: false },
        ],
      }));

      expect(model.identifier.pathValueExpression).toBe("new Date(id)");
      expect(model.identifier.coreValidationStatements).toEqual(expect.arrayContaining([
        expect.stringContaining("Number.isNaN(value.getTime())"),
      ]));
    },
  );

  it("uses the route parameter directly for UUID path identifiers", () => {
    const model = transformer.transform(entity());

    expect(model.identifier.pathValueExpression).toBe("id");
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
