import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer", () => {
  it("produces controller then response in the reference REST package", () => {
    const artifacts = new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer().produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [
        { name: "Wallet", attributes: [{ name: "id", type: "uuid", identifier: true }, { name: "balance", type: "decimal", identifier: false }] },
      ] },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "entrypoints-rest", requires: [] }],
    });
    expect(artifacts.map((artifact) => artifact.templateId)).toEqual(["entrypoints-rest-controller", "entrypoints-rest-response"]);
    expect(artifacts).toMatchObject([
      { outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletController" }, model: { packageName: "io.github.jtsato.walletservice.entrypoint.rest.domains.wallet", requestMapping: "/wallets" } },
      { outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletResponse" }, model: { components: [{ name: "id", type: "UUID" }, { name: "balance", type: "BigDecimal" }] } },
    ]);
  });
});
