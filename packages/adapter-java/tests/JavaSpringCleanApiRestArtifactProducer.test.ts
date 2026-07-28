import { describe, expect, it } from "vitest";
import { JavaSpringCleanApiRestArtifactProducer, toRestCollectionPath } from "../src/index.js";

describe("JavaSpringCleanApiRestArtifactProducer", () => {
  it("produces a structural controller per entity", () => {
    const producer = new JavaSpringCleanApiRestArtifactProducer();
    const artifacts = producer.produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [{ name: "Wallet", attributes: [] }] },
      profile: {
        id: "java-spring-clean", version: "0.1.0",
        technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean", version: "0.1.0" }, modules: [],
      }, modules: [],
    });
    expect(producer.profileId).toBe("java-spring-clean");
    expect(producer.moduleId).toBe("api-rest");
    expect(artifacts).toEqual([{
      templateId: "rest-controller",
      model: { packageName: "io.github.jtsato.walletservice.api", className: "WalletController", requestMapping: "/wallets" },
      outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "WalletController" },
    }]);
  });

  it("uses intentionally naive collection pluralization", () => {
    expect(toRestCollectionPath("OrderItem")).toBe("/order-items");
    expect(toRestCollectionPath("Address")).toBe("/addresss");
  });
});
