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
          uniqueGroups: [],
          attributes: [
            {
              name: "id",
              type: "uuid",
              identifier: true,
              required: true,
              unique: false,
            },
            {
              name: "balance",
              type: "decimal",
              required: true,
              unique: true,
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
          uniqueGroups: [],
          audited: false,
          attributes: [
            {
              name: "id",
              type: "uuid",
              identifier: true,
              required: true,
              unique: false,
            },
            {
              name: "balance",
              type: "decimal",
              identifier: false,
              required: true,
              unique: true,
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
      unique: false,
    });
    expect(model.entities[0]?.uniqueGroups).toEqual([]);
  });

  it("should parse unique attributes", () => {
    const document: ApplicationModelDocument = {
      schemaVersion: "1.0",
      application: { name: "catalog" },
      entities: [{
        name: "Product",
        attributes: [{ name: "name", type: "string", unique: true }],
      }],
    };

    expect(new ModelParser().parse(document).entities[0]?.attributes[0]).toEqual({
      name: "name",
      type: "string",
      required: false,
      identifier: false,
      unique: true,
    });
  });

  it("should default audited to false when omitted", () => {
    const document: ApplicationModelDocument = {
      schemaVersion: "1.0",
      application: { name: "wallet-service" },
      entities: [{
        name: "Wallet",
        attributes: [{ name: "balance", type: "decimal" }],
      }],
    };

    expect(new ModelParser().parse(document).entities[0]?.audited).toBe(false);
  });

  it("should parse an explicit audited flag", () => {
    const document: ApplicationModelDocument = {
      schemaVersion: "1.0",
      application: { name: "wallet-service" },
      entities: [{
        name: "Wallet",
        attributes: [{ name: "balance", type: "decimal" }],
        audited: true,
      }],
    };

    expect(new ModelParser().parse(document).entities[0]?.audited).toBe(true);
  });

  it("should parse composite unique groups", () => {
    const document: ApplicationModelDocument = {
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

    expect(new ModelParser().parse(document).entities[0]?.uniqueGroups).toEqual([
      ["tenantId", "externalId"],
    ]);
  });
});
