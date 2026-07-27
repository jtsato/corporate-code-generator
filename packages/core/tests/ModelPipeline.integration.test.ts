import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import modelSchema from "../../../schemas/model.schema.json";

import {
  ModelLoader,
  ModelParser,
  SchemaValidationError,
  SchemaValidator,
  SemanticValidator,
} from "../src/index.js";

describe("Application Model Pipeline", () => {
  it("should load, validate and parse the wallet service model", async () => {
    const modelPath = fileURLToPath(
      new URL(
        "../../../examples/wallet-service/model.yaml",
        import.meta.url,
      ),
    );

    const loader: ModelLoader = new ModelLoader();
    const validator: SchemaValidator = new SchemaValidator(modelSchema);
    const parser: ModelParser = new ModelParser();

    const document = await loader.load(modelPath);

    validator.validate(document);

    const model = parser.parse(document);

    const semanticValidator: SemanticValidator = new SemanticValidator();
    semanticValidator.validate(model);    

    expect(model).toEqual({
      schemaVersion: "1.0",
      name: "wallet-service",
      namespace: "io.github.jtsato.walletservice",
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "id",
              type: "uuid",
              identifier: true,
              required: true,
            },
            {
              name: "balance",
              type: "decimal",
              identifier: false,
              required: true,
            },
          ],
        },
      ],
    });
  });

  it("should reject technology-specific primitive types", async () => {
    const modelPath = fileURLToPath(
      new URL("./fixtures/invalid-model.yaml", import.meta.url),
    );

    const loader: ModelLoader = new ModelLoader();
    const validator: SchemaValidator = new SchemaValidator(modelSchema);

    const document = await loader.load(modelPath);

    expect(() => validator.validate(document))
      .toThrow(SchemaValidationError);
  });
});