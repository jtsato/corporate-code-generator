import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ApplicationModel,
} from "@corporate-code-generator/core";

import {
  JavaEntityTransformer,
} from "../src/index.js";

describe("JavaEntityTransformer", () => {
  it("should transform a domain entity into a Java class template model", () => {
    const application: ApplicationModel = {
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

    const entity = application.entities[0];

    expect(entity).toBeDefined();

    if (entity === undefined) {
      throw new Error(
        "Expected Wallet entity.",
      );
    }

    const transformer =
      new JavaEntityTransformer();

    const model = transformer.transform(
      application,
      entity,
    );

    expect(model).toEqual({
      packageName:
        "io.github.jtsato.walletservice.domain",

      imports: [
        "java.math.BigDecimal",
        "java.util.UUID",
      ],

      className: "Wallet",

      modifiers: [
        "public",
      ],

      fields: [
        {
          name: "id",
          type: "UUID",
          modifiers: [
            "private",
            "final",
          ],
        },
        {
          name: "balance",
          type: "BigDecimal",
          modifiers: [
            "private",
            "final",
          ],
        },
      ],

      constructorParameters: [
        { name: "id", type: "UUID" },
        { name: "balance", type: "BigDecimal" },
      ],

      getters: [
        { name: "getId", returnType: "UUID", fieldName: "id" },
        { name: "getBalance", returnType: "BigDecimal", fieldName: "balance" },
      ],
    });
  });
});
