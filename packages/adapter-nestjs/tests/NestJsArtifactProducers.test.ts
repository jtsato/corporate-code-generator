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

function requestWith(persistence: string, audited = false): GenerationRequest {
  return {
    application: {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [
        {
          name: "Wallet",
          audited,
          attributes: [
            { name: "id", type: "uuid", required: true, identifier: true },
            { name: "balance", type: "decimal", required: true, identifier: false },
          ],
        },
      ],
    },
    options: new Map([["persistence", persistence]]),
  } as GenerationRequest;
}

const request = requestWith("memory");
const typeormRequest = requestWith("typeorm");
const auditedRequest = requestWith("memory", true);

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
      "build-github-actions-ci",
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

  it("emits the clock once per application and only when something is audited", () => {
    const plain = new NestJsCleanArchitectureCoreArtifactProducer().produce(request)
      .map((invocation) => invocation.templateId);
    const audited = new NestJsCleanArchitectureCoreArtifactProducer().produce(auditedRequest)
      .map((invocation) => invocation.templateId);

    expect(plain).not.toContain("core-clock");
    expect(plain).not.toContain("core-clock-test");
    // Once, not once per entity: there is one clock for the application, and two
    // audited entities reading two instances would be confusing the moment
    // anyone wanted to control time in a test.
    expect(audited.filter((id) => id === "core-clock")).toHaveLength(1);
    expect(audited.filter((id) => id === "core-clock-test")).toHaveLength(1);

    const plainBootstrap = new NestJsCleanArchitectureBootstrapArtifactProducer().produce(request)
      .map((invocation) => invocation.templateId);
    const auditedBootstrap = new NestJsCleanArchitectureBootstrapArtifactProducer().produce(auditedRequest)
      .map((invocation) => invocation.templateId);

    expect(plainBootstrap).not.toContain("bootstrap-clock-module");
    expect(auditedBootstrap.filter((id) => id === "bootstrap-clock-module")).toHaveLength(1);
  });

  it("carries the audited flag into the models that branch on it", () => {
    const invocations = [
      ...new NestJsCleanArchitectureCoreArtifactProducer().produce(auditedRequest),
      ...new NestJsCleanArchitectureWebApiArtifactProducer().produce(auditedRequest),
      ...new NestJsCleanArchitectureInfraPersistenceArtifactProducer().produce(auditedRequest),
    ];
    const entityModels = invocations
      .map((invocation) => invocation.model as { readonly audited?: boolean; readonly className?: string })
      .filter((model) => model.className !== undefined);

    expect(entityModels.length).toBeGreaterThan(0);
    for (const model of entityModels) {
      expect(model.audited).toBe(true);
    }
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
      "infra-persistence-restore-provider",
      "infra-persistence-get-deleted-by-id-provider",
      "infra-persistence-page-deleted-provider",
    ]);
  });

  it("swaps only the entity, repository and repository test when persistence is TypeORM", () => {
    const invocations = new NestJsCleanArchitectureInfraPersistenceArtifactProducer().produce(typeormRequest);

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      // Emitted once per project rather than once per entity, so it leads.
      "infra-persistence-column-transformers",
      "infra-persistence-typeorm-entity-model",
      "infra-persistence-mapper",
      "infra-persistence-typeorm-repository",
      "infra-persistence-typeorm-repository-test",
      "infra-persistence-create-provider",
      "infra-persistence-get-by-id-provider",
      "infra-persistence-page-provider",
      "infra-persistence-update-provider",
      "infra-persistence-delete-provider",
      "infra-persistence-restore-provider",
      "infra-persistence-get-deleted-by-id-provider",
      "infra-persistence-page-deleted-provider",
    ]);
  });

  it("refuses to produce when the persistence option was never resolved", () => {
    // A producer that defaulted here could emit TypeORM artifacts while another
    // emitted the in-memory wiring for the same run.
    const unresolved = { ...request, options: new Map() } as GenerationRequest;

    expect(() => new NestJsCleanArchitectureInfraPersistenceArtifactProducer().produce(unresolved))
      .toThrow(/resolved 'persistence' option/);
    expect(() => new NestJsCleanArchitectureBuildArtifactProducer().produce(unresolved))
      .toThrow(/resolved 'persistence' option/);
    expect(() => new NestJsCleanArchitectureBootstrapArtifactProducer().produce(unresolved))
      .toThrow(/resolved 'persistence' option/);
  });

  it("carries the resolved persistence option into every model that branches on it", () => {
    const build = new NestJsCleanArchitectureBuildArtifactProducer().produce(typeormRequest);
    const bootstrap = new NestJsCleanArchitectureBootstrapArtifactProducer().produce(typeormRequest);

    for (const invocation of [...build, ...bootstrap]) {
      expect((invocation.model as { readonly persistence?: string }).persistence, invocation.templateId)
        .toBe("typeorm");
    }
  });

  it("declares repository update, soft-delete, restore, and uniqueness contracts", async () => {
    const repositoryTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "infra-persistence", "repositories", "repository.ts.njk"),
      "utf8",
    );

    expect(repositoryTemplate).toContain(
      "public async updateById({{ identifier.name }}: {{ identifier.type }}, entity: {{ className }}Entity): Promise<{{ className }}Entity | undefined>",
    );
    expect(repositoryTemplate).toContain("if (index < 0) return undefined;");
    expect(repositoryTemplate).toContain("this.{{ propertyName }}s[index] = entity;");
    expect(repositoryTemplate).toContain("return entity;");
    // Soft delete, not removal: the row is marked and kept, and every active read
    // filters on the marker.
    expect(repositoryTemplate).toContain(
      "public async softDeleteById({{ identifier.name }}: {{ identifier.type }}, deletedAt: Date): Promise<boolean>",
    );
    expect(repositoryTemplate).not.toContain("this.{{ propertyName }}s.splice(");
    expect(repositoryTemplate).toContain("entity.deletedAt = deletedAt;");
    expect(repositoryTemplate).toContain(
      "public async restoreById({{ identifier.name }}: {{ identifier.type }}): Promise<boolean>",
    );
    expect(repositoryTemplate).toContain("entity.deletedAt = null;");
    expect(repositoryTemplate).toContain(
      "public async findAnyById({{ identifier.name }}: {{ identifier.type }}): Promise<{{ className }}Entity | undefined>",
    );
    expect(repositoryTemplate).toContain(
      "public async findDeletedById({{ identifier.name }}: {{ identifier.type }}): Promise<{{ className }}Entity | undefined>",
    );
    expect(repositoryTemplate).toContain(
      "public async existsById({{ identifier.name }}: {{ identifier.type }}): Promise<boolean>",
    );
    expect(repositoryTemplate).toContain(
      "public async existsAnyById({{ identifier.name }}: {{ identifier.type }}): Promise<boolean>",
    );
    expect(repositoryTemplate).toContain("public async hasUniqueConflict(");
    expect(repositoryTemplate).toContain("ignoredIdentifier?: {{ identifier.type }}");
    // Uniqueness is scoped to active rows, which is what releases a unique value
    // once the row holding it is deleted.
    expect(repositoryTemplate).toContain("if (!isActive(current)) continue;");
    expect(repositoryTemplate).toContain("!isNullish(candidate.{{ attribute.name }})");

    const createProviderTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "infra-persistence", "providers", "create.provider.ts.njk"),
      "utf8",
    );
    expect(createProviderTemplate).toContain("import { ConflictException } from '../../core/exceptions/conflict.exception';");
    // Tombstones included: a soft delete releases a unique business value but not
    // the identifier, so creating over a tombstone is a conflict.
    expect(createProviderTemplate).toContain("const identifierConflict = await this.repository.existsAnyById(entity.{{ identifier.name }});");
    expect(createProviderTemplate).toContain("if (identifierConflict");

    const restoreProviderTemplate = await readFile(
      join(repoRoot, "template-packs", "nestjs-clean-architecture", "infra-persistence", "providers", "restore.provider.ts.njk"),
      "utf8",
    );
    // Restore has to tell three cases apart, and the REST contract gives each a
    // different answer: absent is 404, already active is 409, and a taken unique
    // value is 409.
    expect(restoreProviderTemplate).toContain("const entity = await this.repository.findAnyById({{ identifier.name }});");
    expect(restoreProviderTemplate).toContain("if (entity === undefined) {\n      return false;");
    expect(restoreProviderTemplate).toContain("if (entity.deletedAt === null || entity.deletedAt === undefined) {");
    expect(restoreProviderTemplate).toContain("throw new ConflictException('{{ propertyName }}.already-exists'");
    expect(restoreProviderTemplate).toContain("await this.repository.hasUniqueConflict(entity, {{ identifier.name }});");
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

  it("selects the ORM environment test and adds the end-to-end environment setup", () => {
    const invocations = new NestJsCleanArchitectureBootstrapArtifactProducer().produce(typeormRequest);

    expect(invocations.map((invocation) => invocation.templateId)).toEqual([
      "bootstrap-main",
      "bootstrap-app-module",
      "bootstrap-environment-config",
      "bootstrap-typeorm-environment-config-test",
      "bootstrap-e2e-test",
      "bootstrap-e2e-environment-setup",
      "bootstrap-entity-module",
    ]);
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
      "useFactory: (getByIdGateway: IGet{{ className }}ByIdGateway, updateGateway: IUpdate{{ className }}Gateway{% if audited %}, clock: IClock{% endif %}): Patch{{ className }}UseCase =>",
    );
    expect(moduleTemplate).toContain(
      "inject: [IGet{{ className }}ByIdGatewaySymbol, IUpdate{{ className }}GatewaySymbol{% if audited %}, IClockSymbol{% endif %}],",
    );
    expect(moduleTemplate).toContain(
      "useFactory: (gateway: IDelete{{ className }}Gateway): Delete{{ className }}UseCase =>",
    );
    expect(moduleTemplate).toContain("inject: [IDelete{{ className }}GatewaySymbol],");
  });
});
