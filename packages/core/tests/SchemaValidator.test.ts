import { describe, expect, it } from "vitest";

import modelSchema from "../schemas/1.0/model.schema.json";

import {
  SchemaValidationError,
  SchemaValidator,
} from "../src/index.js";

describe("SchemaValidator", () => {
  const validator = new SchemaValidator(modelSchema);

  it("should accept a structurally valid application model", () => {
    const document: unknown = {
      schemaVersion: "1.0",
      application: {
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
      },
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "id",
              type: "uuid",
              identifier: true,
              required: true,
              unique: true,
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(document)).not.toThrow();
  });

  it("should reject an unknown primitive type", () => {
    const document: unknown = {
      schemaVersion: "1.0",
      application: {
        name: "wallet-service",
      },
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "id",
              type: "Guid",
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(document))
      .toThrow(SchemaValidationError);
  });

  it("should reject unknown properties", () => {
    const document: unknown = {
      schemaVersion: "1.0",
      application: {
        name: "wallet-service",
      },
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "id",
              type: "uuid",
              requred: true,
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(document))
      .toThrow(SchemaValidationError);
  });

  it("should reject a non-boolean unique attribute", () => {
    const document: unknown = {
      schemaVersion: "1.0",
      application: { name: "wallet-service" },
      entities: [{
        name: "Wallet",
        attributes: [{ name: "name", type: "string", unique: "yes" }],
      }],
    };

    expect(() => validator.validate(document)).toThrow(SchemaValidationError);
  });

  it("should accept composite unique groups", () => {
    const document: unknown = {
      schemaVersion: "1.0",
      application: { name: "wallet-service" },
      entities: [{
        name: "Wallet",
        attributes: [
          { name: "tenantId", type: "uuid" },
          { name: "externalId", type: "string" },
        ],
        uniqueGroups: [["tenantId", "externalId"]],
      }],
    };

    expect(() => validator.validate(document)).not.toThrow();
  });

  it("should reject a composite unique group with fewer than two attributes", () => {
    const document: unknown = {
      schemaVersion: "1.0",
      application: { name: "wallet-service" },
      entities: [{
        name: "Wallet",
        attributes: [{ name: "tenantId", type: "uuid" }],
        uniqueGroups: [["tenantId"]],
      }],
    };

    expect(() => validator.validate(document)).toThrow(SchemaValidationError);
  });

  it("should reject a composite unique group with a non-string member", () => {
    const document: unknown = {
      schemaVersion: "1.0",
      application: { name: "wallet-service" },
      entities: [{
        name: "Wallet",
        attributes: [
          { name: "tenantId", type: "uuid" },
          { name: "externalId", type: "string" },
        ],
        uniqueGroups: [["tenantId", 42]],
      }],
    };

    expect(() => validator.validate(document)).toThrow(SchemaValidationError);
  });

  it("should reject an unsupported schema version", () => {
    const document: unknown = {
      schemaVersion: "2.0",
      application: {
        name: "wallet-service",
      },
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "id",
              type: "uuid",
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(document))
      .toThrow(SchemaValidationError);
  });
});
