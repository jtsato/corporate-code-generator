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
      new JavaEntityTransformer(undefined, true);

    const model = transformer.transform(
      application,
      entity,
    );

    expect(model).toEqual({
      packageName:
        "io.github.jtsato.walletservice.domain",

      imports: [
        "io.github.jtsato.walletservice.common.validation.SelfValidating",
        "jakarta.validation.constraints.NotNull",
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
          validationAnnotation: "@NotNull",
        },
        {
          name: "balance",
          type: "BigDecimal",
          modifiers: [
            "private",
            "final",
          ],
          validationAnnotation: "@NotNull",
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
      extendsType: "SelfValidating<Wallet>",
      validateSelf: true,
    });
  });

  it("does not add self-validation when an entity has no required attributes", () => {
    const application: ApplicationModel = {
      schemaVersion: "1.0",
      name: "wallet-service",
      namespace: "io.github.jtsato.walletservice",
      entities: [{ name: "Audit", attributes: [{ name: "id", type: "uuid", identifier: true }] }],
    };
    const entity = application.entities[0];
    if (entity === undefined) throw new Error("Expected Audit entity.");

    const model = new JavaEntityTransformer(undefined, true).transform(application, entity);

    expect(model.imports).toEqual(["java.util.UUID"]);
    expect(model.fields[0]).not.toHaveProperty("validationAnnotation");
    expect(model).not.toHaveProperty("extendsType");
    expect(model).not.toHaveProperty("validateSelf");
  });
});
