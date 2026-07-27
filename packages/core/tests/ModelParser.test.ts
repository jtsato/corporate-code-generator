import { describe, expect, it } from "vitest";

import {
  ModelParser,
  type ApplicationModelDocument,
} from "../src/index.js";

describe("ModelParser", () => {
  it("should parse an application model document into the IR", () => {
    const document: ApplicationModelDocument = {
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
            },
            {
              name: "balance",
              type: "decimal",
              required: true,
            },
          ],
        },
      ],
    };

    const parser = new ModelParser();

    const model = parser.parse(document);

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

  it("should apply attribute defaults", () => {
    const document: ApplicationModelDocument = {
      schemaVersion: "1.0",
      application: {
        name: "wallet-service",
      },
      entities: [
        {
          name: "Wallet",
          attributes: [
            {
              name: "balance",
              type: "decimal",
            },
          ],
        },
      ],
    };

    const parser = new ModelParser();

    const model = parser.parse(document);

    expect(model.entities[0]?.attributes[0]).toEqual({
      name: "balance",
      type: "decimal",
      required: false,
      identifier: false,
    });
  });
});
