import {
  describe,
  expect,
  it,
} from "vitest";

import {
  JavaSpringCleanDomainArtifactProducer,
} from "../src/index.js";

describe("JavaSpringCleanDomainArtifactProducer", () => {
  it("should produce a Java domain artifact for each entity", () => {
    const producer = new JavaSpringCleanDomainArtifactProducer();

    const artifacts = producer.produce({
      application: {
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
            ],
          },
        ],
      },
      profile: {
        id: "java-spring-clean",
        version: "0.1.0",
        technology: {
          language: "java",
          languageVersion: "25",
          framework: "spring-boot",
        },
        architecture: {
          style: "clean-architecture",
        },
        templatePack: {
          id: "java-spring-clean",
          version: "0.1.0",
        },
        modules: [
          { id: "domain", requires: [] },
        ],
      },
      modules: [
        { id: "domain", requires: [] },
      ],
    });

    expect(producer.profileId).toBe("java-spring-clean");
    expect(producer.moduleId).toBe("domain");
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({
      templateId: "domain-entity",
      model: {
        packageName: "io.github.jtsato.walletservice.domain",
        className: "Wallet",
      },
      outputVariables: {
        packagePath: "io/github/jtsato/walletservice",
        className: "Wallet",
      },
    });
  });
});
