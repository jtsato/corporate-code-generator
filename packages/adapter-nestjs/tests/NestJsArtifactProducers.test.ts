import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { GenerationRequest } from "@corporate-code-generator/core";

import { NestJsCleanArchitectureBootstrapArtifactProducer } from "../src/generation/NestJsCleanArchitectureBootstrapArtifactProducer.js";
import { NestJsCleanArchitectureBuildArtifactProducer } from "../src/generation/NestJsCleanArchitectureBuildArtifactProducer.js";
import { NestJsCleanArchitectureCoreArtifactProducer } from "../src/generation/NestJsCleanArchitectureCoreArtifactProducer.js";
import { NestJsCleanArchitectureInfraPersistenceArtifactProducer } from "../src/generation/NestJsCleanArchitectureInfraPersistenceArtifactProducer.js";
import { NestJsCleanArchitectureWebApiArtifactProducer } from "../src/generation/NestJsCleanArchitectureWebApiArtifactProducer.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

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
      "e2e-jest-config",
      "build-gitignore",
      "build-readme",
      "build-eslint-config",
      "build-env-example",
      "build-env-development",
      "build-env-test",
      "build-env-production",
      "build-dockerfile",
      "build-dockerignore",
      "build-docker-compose",
    ]);
  });

  it("produces application-scoped exceptions once and validation artifacts per entity", () => {
    const invocations = new NestJsCleanArchitectureCoreArtifactProducer().produce(request);
    const templateIds = invocations.map((invocation) => invocation.templateId);

    expect(templateIds.filter((id) => id === "core-exception")).toHaveLength(1);
    expect(templateIds).toContain("core-field-violation");
    expect(templateIds).toContain("core-conflict-exception");
    expect(templateIds).toContain("core-i18n-service-interface");
    expect(templateIds).toContain("core-validation-exception");
    expect(templateIds.filter((id) => id === "core-domain-model")).toHaveLength(1);
    expect(templateIds).toContain("core-create-usecase");
    expect(templateIds).toContain("core-create-usecase-test");
    expect(templateIds).toContain("core-create-command-validator");
    expect(templateIds).toEqual(expect.arrayContaining([
      "core-update-command",
      "core-update-command-validator",
      "core-update-gateway",
      "core-update-usecase-interface",
      "core-update-usecase",
      "core-update-usecase-test",
    ]));
    expect(templateIds).toEqual(expect.arrayContaining([
      "core-patch-command",
      "core-patch-changes",
      "core-patch-command-validator",
      "core-patch-usecase-interface",
      "core-patch-usecase",
      "core-patch-usecase-test",
      "core-delete-command",
      "core-delete-gateway",
      "core-delete-usecase-interface",
      "core-delete-usecase",
      "core-delete-usecase-test",
    ]));
    expect(templateIds).toContain("core-get-by-id-usecase");
    expect(templateIds).toContain("core-get-by-id-usecase-test");
    expect(templateIds).toContain("core-get-by-id-query-validator");
    expect(templateIds).toContain("core-sort-direction");
    expect(templateIds).toContain("core-sort-order");
    expect(templateIds).toContain("core-sort-order-test");
    expect(templateIds).toContain("core-page-query");
    expect(templateIds).toContain("core-page-gateway");
    expect(templateIds).toContain("core-page-usecase-interface");
    expect(templateIds).toContain("core-page-usecase");
    expect(templateIds).toContain("core-page-request-test");
    expect(invocations.at(-1)?.outputVariables).toEqual({ fileName: "wallet", pluralFileName: "wallets" });
  });

  it("passes both file-name variables to web-api templates", () => {
    const invocations = new NestJsCleanArchitectureWebApiArtifactProducer().produce(request);
    const controller = invocations.find((invocation) => invocation.templateId === "web-api-controller");

    expect(controller?.outputVariables).toEqual({ fileName: "wallet", pluralFileName: "wallets" });
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-not-found-exception-filter");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-validation-exception-filter");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-http-response");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-http-response-builder");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-response-transformer-interceptor");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-page-request");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-filter-parser");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-sort-parser");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-sort-parser-test");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-page-response");
    expect(invocations.map((invocation) => invocation.templateId)).toEqual(expect.arrayContaining([
      "web-api-update-request",
      "web-api-patch-request",
    ]));
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-health-response");
    expect(invocations.map((invocation) => invocation.templateId)).toContain("web-api-health-controller");
    expect(invocations.map((invocation) => invocation.templateId)).toEqual(expect.arrayContaining([
      "web-api-i18n-messages-en",
      "web-api-i18n-messages-pt",
      "web-api-i18n-language-negotiation",
      "web-api-i18n-language-negotiation-test",
      "web-api-i18n-language-resolver",
      "web-api-i18n-module",
      "web-api-i18n-service",
      "web-api-conflict-exception-filter",
    ]));
  });

  it("passes parsed sort orders to the page request", async () => {
    const controllerTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "web-api", "entrypoints", "controller.ts.njk"),
      "utf8",
    );

    expect(controllerTemplate).toContain(
      "import { {{ className }}SortParser } from './{{ fileName }}-sort.parser';",
    );
    expect(controllerTemplate).toContain(
      "new PageRequest(request.page ?? 0, request.size ?? 20, {{ className }}SortParser.parse(request.sort)),",
    );
    expect(controllerTemplate).toContain(
      "Object.prototype.hasOwnProperty.call(request, '{{ property.name }}') && request.{{ property.name }} !== undefined",
    );
  });

  it("declares repeatable sort metadata on the page request DTO", async () => {
    const pageRequestTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "web-api", "entrypoints", "page-request.model.ts.njk"),
      "utf8",
    );

    expect(pageRequestTemplate).toContain("ApiPropertyOptional");
    expect(pageRequestTemplate).toContain("example: 'balance:desc'");
    expect(pageRequestTemplate).toContain("isArray: true");
    expect(pageRequestTemplate).toContain("public sort?: string | string[];");
  });

  it("keeps artifacts that depend on other modules out of the web-api module", () => {
    const invocations = new NestJsCleanArchitectureWebApiArtifactProducer().produce(request);
    const templateIds = invocations.map((invocation) => invocation.templateId);

    expect(templateIds).not.toContain("bootstrap-entity-module");
    expect(templateIds).not.toContain("web-api-module");
    expect(templateIds).not.toContain("bootstrap-e2e-test");
    expect(templateIds).not.toContain("web-api-e2e-test");
  });

  it("produces persistence artifacts per entity", () => {
    const invocations = new NestJsCleanArchitectureInfraPersistenceArtifactProducer().produce(request);

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      "infra-persistence-entity-model",
      "infra-persistence-mapper",
      "infra-persistence-repository",
      "infra-persistence-repository-test",
      "infra-persistence-create-provider",
      "infra-persistence-get-by-id-provider",
      "infra-persistence-page-provider",
      "infra-persistence-update-provider",
      "infra-persistence-delete-provider",
    ]);
  });

  it("declares repository update, delete, and uniqueness contracts", async () => {
    const repositoryTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "infra-persistence", "repositories", "repository.ts.njk"),
      "utf8",
    );

    expect(repositoryTemplate).toContain(
      "public async updateById({{ identifier.name }}: {{ identifier.type }}, entity: {{ className }}Entity): Promise<{{ className }}Entity | undefined>",
    );
    expect(repositoryTemplate).toContain(
      "const index = this.{{ propertyName }}s.findIndex((current) => current.{{ identifier.name }} === {{ identifier.name }});",
    );
    expect(repositoryTemplate).toContain("if (index < 0) return undefined;");
    expect(repositoryTemplate).toContain("this.{{ propertyName }}s[index] = entity;");
    expect(repositoryTemplate).toContain("return entity;");
    expect(repositoryTemplate).toContain(
      "public async deleteById({{ identifier.name }}: {{ identifier.type }}): Promise<boolean>",
    );
    expect(repositoryTemplate).toContain(
      "public async existsById({{ identifier.name }}: {{ identifier.type }}): Promise<boolean>",
    );
    expect(repositoryTemplate).toContain("if (index < 0) return false;");
    expect(repositoryTemplate).toContain("this.{{ propertyName }}s.splice(index, 1);");
    expect(repositoryTemplate).toContain("return true;");
    expect(repositoryTemplate).toContain("public async hasUniqueConflict(");
    expect(repositoryTemplate).toContain("ignoredIdentifier?: {{ identifier.type }}");
    expect(repositoryTemplate).toContain("if (ignoredIdentifier !== undefined && compareValues(current.{{ identifier.name }}, ignoredIdentifier) === 0) continue;");
    expect(repositoryTemplate).toContain("!isNullish(candidate.{{ attribute.name }})");

    const createProviderTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "infra-persistence", "providers", "create.provider.ts.njk"),
      "utf8",
    );
    expect(createProviderTemplate).toContain("import { ConflictException } from '../../core/exceptions/conflict.exception';");
    expect(createProviderTemplate).toContain("const identifierConflict = await this.repository.existsById(entity.{{ identifier.name }});");
    expect(createProviderTemplate).toContain("if (identifierConflict");
  });

  it("produces a single bootstrap composition root plus one wiring module per entity", () => {
    const invocations = new NestJsCleanArchitectureBootstrapArtifactProducer().produce(request);

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      "bootstrap-main",
      "bootstrap-app-module",
      "bootstrap-environment-config",
      "bootstrap-environment-config-test",
      "bootstrap-e2e-test",
      "bootstrap-entity-module",
    ]);
    expect(invocations.at(-1)?.outputVariables).toEqual({ fileName: "wallet", pluralFileName: "wallets" });
  });

  it("wires CRUD providers and use cases in the generated entity module", async () => {
    const moduleTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "bootstrap", "modules", "module.ts.njk"),
      "utf8",
    );

    expect(moduleTemplate).toContain(
      "provide: IUpdate{{ className }}GatewaySymbol,\n      useClass: Update{{ className }}Provider,",
    );
    expect(moduleTemplate).toContain(
      "provide: IDelete{{ className }}GatewaySymbol,\n      useClass: Delete{{ className }}Provider,",
    );
    expect(moduleTemplate).toContain("provide: IUpdate{{ className }}UseCaseSymbol,");
    expect(moduleTemplate).toContain("provide: IPatch{{ className }}UseCaseSymbol,");
    expect(moduleTemplate).toContain("provide: IDelete{{ className }}UseCaseSymbol,");
    expect(moduleTemplate).toContain(
      "useFactory: (getByIdGateway: IGet{{ className }}ByIdGateway, updateGateway: IUpdate{{ className }}Gateway): Patch{{ className }}UseCase =>",
    );
    expect(moduleTemplate).toContain(
      "inject: [IGet{{ className }}ByIdGatewaySymbol, IUpdate{{ className }}GatewaySymbol],",
    );
    expect(moduleTemplate).toContain(
      "useFactory: (gateway: IDelete{{ className }}Gateway): Delete{{ className }}UseCase =>",
    );
    expect(moduleTemplate).toContain("inject: [IDelete{{ className }}GatewaySymbol],");
  });
});
