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