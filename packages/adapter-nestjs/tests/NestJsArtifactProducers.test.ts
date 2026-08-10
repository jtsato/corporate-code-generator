import { describe, expect, it } from "vitest";

import type { GenerationRequest } from "@corporate-code-generator/core";

import { NestJsCleanArchitectureBootstrapArtifactProducer } from "../src/generation/NestJsCleanArchitectureBootstrapArtifactProducer.js";
import { NestJsCleanArchitectureBuildArtifactProducer } from "../src/generation/NestJsCleanArchitectureBuildArtifactProducer.js";
import { NestJsCleanArchitectureCoreArtifactProducer } from "../src/generation/NestJsCleanArchitectureCoreArtifactProducer.js";
import { NestJsCleanArchitectureInfraPersistenceArtifactProducer } from "../src/generation/NestJsCleanArchitectureInfraPersistenceArtifactProducer.js";
import { NestJsCleanArchitectureWebApiArtifactProducer } from "../src/generation/NestJsCleanArchitectureWebApiArtifactProducer.js";

const request = {
  application: {
    schemaVersion: "1.0",
    name: "wallet-service",
    entities: [
      {
        name: "Wallet",
        attributes: [
          { name: "id", type: "uuid", required: true, identifier: true },
          { name: "balance", type: "decimal", required: true, identifier: false },
        ],
      },
    ],
  },
} as GenerationRequest;

describe("NestJS clean architecture artifact producers", () => {
  it("declares the expected profile and module identifiers", () => {
    expect(new NestJsCleanArchitectureBuildArtifactProducer().profileId).toBe("nestjs-clean-architecture");
    expect(new NestJsCleanArchitectureBuildArtifactProducer().moduleId).toBe("build");
    expect(new NestJsCleanArchitectureCoreArtifactProducer().moduleId).toBe("core");
    expect(new NestJsCleanArchitectureInfraPersistenceArtifactProducer().moduleId).toBe("infra-persistence");
    expect(new NestJsCleanArchitectureWebApiArtifactProducer().moduleId).toBe("web-api");
    expect(new NestJsCleanArchitectureBootstrapArtifactProducer().moduleId).toBe("bootstrap");
  });

  it("produces application-scoped build artifacts once", () => {
    const invocations = new NestJsCleanArchitectureBuildArtifactProducer().produce(request);

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      "package-json",
      "tsconfig-json",
      "tsconfig-build-json",
      "nest-cli-json",
    ]);
  });

  it("produces application-scoped exceptions once and use-case artifacts per entity", () => {
    const invocations = new NestJsCleanArchitectureCoreArtifactProducer().produce(request);
    const templateIds = invocations.map((invocation) => invocation.templateId);

    expect(templateIds.filter((id) => id === "core-exception")).toHaveLength(1);
    expect(templateIds.filter((id) => id === "core-domain-model")).toHaveLength(1);
    expect(templateIds).toContain("core-create-usecase");
    expect(templateIds).toContain("core-get-by-id-usecase");
    expect(invocations.at(-1)?.outputVariables).toEqual({ fileName: "wallet" });
  });

  it("passes both file-name variables to web-api templates", () => {
    const invocations = new NestJsCleanArchitectureWebApiArtifactProducer().produce(request);
    const controller = invocations.find((invocation) => invocation.templateId === "web-api-controller");

    expect(controller?.outputVariables).toEqual({ fileName: "wallet", pluralFileName: "wallets" });
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-not-found-exception-filter");
  });

  it("produces persistence artifacts per entity", () => {
    const invocations = new NestJsCleanArchitectureInfraPersistenceArtifactProducer().produce(request);

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      "infra-persistence-entity-model",
      "infra-persistence-mapper",
      "infra-persistence-repository",
      "infra-persistence-create-provider",
      "infra-persistence-get-by-id-provider",
    ]);
  });

  it("produces a single bootstrap composition root", () => {
    const invocations = new NestJsCleanArchitectureBootstrapArtifactProducer().produce(request);

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      "bootstrap-main",
      "bootstrap-app-module",
    ]);
  });
});
