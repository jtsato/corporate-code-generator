import { describe, expect, it } from "vitest";

import {
  SemanticValidationError,
  SemanticValidator,
  type ApplicationModel,
} from "../src/index.js";

describe("SemanticValidator", () => {
  it("should accept a semantically valid model", () => {
    const model: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "id",
              type: "uuid",
              required: true,
              identifier: true,
            },
            {
              name: "balance",
              type: "decimal",
              required: true,
              identifier: false,
            },
          ],
        },
      ],
    };

    const validator = new SemanticValidator();

    expect(() => validator.validate(model)).not.toThrow();
  });

  it("should reject duplicate entities", () => {
    const model: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [
        {
          name: "Wallet",
          attributes: [],
        },
        {
          name: "Wallet",
          attributes: [],
        },
      ],
    };

    const validator = new SemanticValidator();

    expect(() => validator.validate(model))
      .toThrow(SemanticValidationError);
  });

  it("should reject duplicate attributes", () => {
    const model: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "id",
              type: "uuid",
              required: true,
              identifier: true,
            },
            {
              name: "id",
              type: "uuid",
              required: true,
              identifier: false,
            },
          ],
        },
      ],
    };

    const validator = new SemanticValidator();

    expect(() => validator.validate(model))
      .toThrow(SemanticValidationError);
  });

  it("should accept a composite unique group referencing existing attributes", () => {
    const model: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [{
        name: "Wallet",
        attributes: [
          { name: "tenantId", type: "uuid", required: true, identifier: false },
          { name: "externalId", type: "string", required: true, identifier: false },
        ],
        uniqueGroups: [["tenantId", "externalId"]],
      }],
    };

    expect(() => new SemanticValidator().validate(model)).not.toThrow();
  });

  it("should reject malformed composite unique groups deterministically", () => {
    const model: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [{
        name: "Wallet",
        attributes: [
          { name: "tenantId", type: "uuid", required: true, identifier: false },
          { name: "externalId", type: "string", required: true, identifier: false },
        ],
        uniqueGroups: [
          ["tenantId"],
          ["externalId", "externalId"],
          ["tenantId", "missing"],
        ],
      }],
    };

    try {
      new SemanticValidator().validate(model);
      expect.fail("Expected semantic validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(SemanticValidationError);
      expect((error as SemanticValidationError).issues).toEqual([
        {
          code: "MODEL006",
          message: "Unique group in entity 'Wallet' must contain at least two attributes.",
          path: "entities.Wallet.uniqueGroups[0]",
        },
        {
          code: "MODEL007",
          message: "Duplicate attribute 'externalId' in unique group for entity 'Wallet'.",
          path: "entities.Wallet.uniqueGroups[1][1]",
        },
        {
          code: "MODEL008",
          message: "Unique group in entity 'Wallet' references unknown attribute 'missing'.",
          path: "entities.Wallet.uniqueGroups[2][1]",
        },
      ]);
    }
  });

  it("should reject equivalent composite unique groups", () => {
    const model: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [{
        name: "Wallet",
        attributes: [
          { name: "tenantId", type: "uuid", required: true, identifier: false },
          { name: "externalId", type: "string", required: true, identifier: false },
        ],
        uniqueGroups: [
          ["tenantId", "externalId"],
          ["externalId", "tenantId"],
        ],
      }],
    };

    expect(() => new SemanticValidator().validate(model)).toThrow(
      expect.objectContaining({
        issues: [{
          code: "MODEL009",
          message: "Duplicate unique group in entity 'Wallet'; it is equivalent to group 0.",
          path: "entities.Wallet.uniqueGroups[1]",
        }],
      }),
    );
  });
  
  it("should report all semantic validation issues", () => {
      const model: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [
          {
          name: "Wallet",
          attributes: [
              {
              name: "id",
              type: "uuid",
              required: true,
              identifier: true,
              },
              {
              name: "id",
              type: "uuid",
              required: true,
              identifier: false,
              },
          ],
          },
          {
          name: "Wallet",
          attributes: [],
          },
      ],
      };
  
      const validator = new SemanticValidator();
  
      try {
      validator.validate(model);
  
      expect.fail("Expected semantic validation to fail.");
      } catch (error) {
      expect(error).toBeInstanceOf(SemanticValidationError);
  
      const validationError =
          error as SemanticValidationError;
  
      expect(validationError.issues).toEqual([
          {
          code: "MODEL002",
          message: "Duplicate entity 'Wallet'.",
          path: "entities[1].name",
          },
          {
          code: "MODEL003",
          message: "Duplicate attribute 'id' in entity 'Wallet'.",
          path: "entities.Wallet.attributes[1].name",
          },
      ]);
      }
  });  
});
