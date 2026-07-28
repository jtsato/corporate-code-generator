import { describe, expect, it } from "vitest";
import { JavaSpringCleanApiRestArtifactProducer, toRestCollectionPath } from "../src/index.js";

describe("JavaSpringCleanApiRestArtifactProducer", () => {
  it("produces controller then response per entity", () => {
    const producer = new JavaSpringCleanApiRestArtifactProducer();
    const artifacts = producer.produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [{ name: "Wallet", attributes: [{ name: "id", type: "uuid", required: true, identifier: true }, { name: "balance", type: "decimal", required: true }] }] },
      profile: {
        id: "java-spring-clean", version: "0.1.0",
        technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean", version: "0.1.0" }, modules: [],
      }, modules: [],
    });
    expect(producer.profileId).toBe("java-spring-clean");
    expect(producer.moduleId).toBe("api-rest");
    expect(artifacts).toEqual([
      {
        templateId: "rest-controller",
        model: {
          packageName: "io.github.jtsato.walletservice.api",
          imports: ["java.util.List", "org.springframework.web.bind.annotation.GetMapping", "org.springframework.web.bind.annotation.RequestMapping", "org.springframework.web.bind.annotation.RestController"],
          className: "WalletController",
          requestMapping: "/wallets",
          responseClassName: "WalletResponse",
          findAllMethodName: "findAll",
        },
        outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "WalletController" },
      },
      {
        templateId: "rest-response",
        model: {
          packageName: "io.github.jtsato.walletservice.api",
          imports: ["java.math.BigDecimal", "java.util.UUID"],
          recordName: "WalletResponse",
          components: [{ name: "id", type: "UUID" }, { name: "balance", type: "BigDecimal" }],
        },
        outputVariables: { packagePath: "io/github/jtsato/walletservice", className: "WalletResponse" },
      },
    ]);
  });

  it("uses intentionally naive collection pluralization", () => {
    expect(toRestCollectionPath("OrderItem")).toBe("/order-items");
    expect(toRestCollectionPath("Address")).toBe("/addresss");
  });
});
