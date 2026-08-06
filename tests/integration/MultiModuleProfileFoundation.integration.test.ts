import {
  dirname,
  resolve,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ModuleResolver,
  ProfileLoader,
  ProfileResolver,
  TemplatePackResolver,
} from "@corporate-code-generator/core";

const rootDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

describe("Java multi-module profile foundation", () => {
  it("loads and resolves both Java profiles with their declared identities", async () => {
    const profilesDirectory = resolve(rootDirectory, "profiles");
    const loaded = await new ProfileLoader().load(resolve(
      profilesDirectory,
      "java-spring-clean-multimodule",
      "profile.yaml",
    ));
    const resolver = new ProfileResolver(profilesDirectory);
    const singleModule = await resolver.resolve("java-spring-clean");
    const multiModule = await resolver.resolve("java-spring-clean-multimodule");

    expect(loaded).toMatchObject({
      id: "java-spring-clean-multimodule",
      version: "0.1.0",
      templatePack: {
        id: "java-spring-clean-multimodule",
        version: "0.1.0",
      },
    });
    expect(multiModule).toEqual(loaded);
    expect(singleModule.id).toBe("java-spring-clean");
    expect(singleModule.templatePack.id).toBe("java-spring-clean");
  });

  it("resolves the multi-module template pack and its modules deterministically", async () => {
    const profile = await new ProfileResolver(
      resolve(rootDirectory, "profiles"),
    ).resolve("java-spring-clean-multimodule");
    const templatePack = await new TemplatePackResolver(
      resolve(rootDirectory, "template-packs"),
    ).resolve(profile.templatePack);
    const resolver = new ModuleResolver();

    expect(templatePack.templatePack.id).toBe(profile.templatePack.id);
    expect(templatePack.templatePack.version).toBe(profile.templatePack.version);
    expect(templatePack.templatePack.templates.map((template) => template.id)).toEqual([
      "parent-pom",
      "core-pom",
      "entrypoints-rest-pom",
      "infra-database-pom",
      "configuration-pom",
      "build-github-actions-java-ci",
      "core-domain-entity",
      "core-gateway",
      "core-create-command",
      "core-create-usecase",
      "core-create-usecase-interactor",
      "core-create-usecase-interactor-test",
      "core-update-command",
      "core-update-usecase",
      "core-update-usecase-interactor",
      "core-update-usecase-interactor-test",
      "core-delete-command",
      "core-delete-usecase",
      "core-delete-usecase-interactor",
      "core-delete-usecase-interactor-test",
      "core-find-usecase",
      "core-find-usecase-interactor",
      "core-find-usecase-by-id",
      "core-find-usecase-by-id-interactor",
      "core-find-usecase-by-id-interactor-test",
      "core-find-usecase-by-filter",
      "core-find-usecase-by-filter-interactor",
      "core-find-usecase-by-filter-interactor-test",
      "core-find-usecase-by-filter-page",
      "core-find-usecase-by-filter-page-interactor",
      "core-find-usecase-by-filter-page-interactor-test",
      "core-find-usecase-page",
      "core-find-usecase-page-interactor",
      "core-find-usecase-page-interactor-test",
      "core-application-exception", "core-field-violation", "core-validation-exception", "core-not-found-exception", "core-conflict-exception",
      "core-self-validating",
      "core-sort-direction",
      "core-sort-order",
      "core-page-request",
      "core-page-result",
      "core-domain-validation-test",
      "core-sort-order-test",
      "core-page-request-test",
      "core-page-result-test",
      "core-filter-operator",
      "core-filter-condition",
      "core-filter-group-operator",
      "core-filter-group",
      "core-filter-expression",
      "core-filter-condition-test",
      "core-filter-group-test",
      "core-filter-expression-test",
      "entrypoints-rest-controller",
      "entrypoints-rest-response",
      "entrypoints-rest-domain-create-request",
      "entrypoints-rest-domain-update-request",
      "entrypoints-rest-response-status",
      "entrypoints-rest-page-response",
      "entrypoints-rest-common-sort-field-definition",
      "entrypoints-rest-common-sort-definition",
      "entrypoints-rest-common-sort-parser",
      "entrypoints-rest-common-sort-parser-test",
      "entrypoints-rest-domain-sort-definition",
      "entrypoints-rest-domain-sort-definition-test",
      "entrypoints-rest-filter-operator",
      "entrypoints-rest-filter-field-definition",
      "entrypoints-rest-filter-definition",
      "entrypoints-rest-filter-parser",
      "entrypoints-rest-domain-filter-definition",
      "entrypoints-rest-filter-parser-test",
      "entrypoints-rest-domain-filter-definition-test",
      "infra-database-gateway-provider",
      "infra-database-persistence-entity",
      "infra-database-persistence-mapper",
      "infra-database-repository",
      "infra-database-spring-data-page-request-mapper",
      "infra-database-spring-data-page-result-mapper",
      "infra-database-spring-data-page-request-mapper-test",
      "infra-database-spring-data-page-result-mapper-test",
      "infra-database-querydsl-predicate-builder",
      "infra-database-querydsl-predicate-builder-test",
      "infra-database-querydsl-filter-field-definition",
      "infra-database-querydsl-filter-definition",
      "infra-database-querydsl-filter-value-converter",
      "infra-database-querydsl-filter-mapper",
      "infra-database-querydsl-domain-filter-definition",
      "infra-database-querydsl-filter-value-converter-test",
      "infra-database-querydsl-filter-mapper-test",
      "infra-database-querydsl-domain-filter-definition-test",
      "configuration-application",
      "configuration-domain-wiring",
      "configuration-global-exception-handler",
      "configuration-cors-properties", "configuration-cors-web-configuration", "configuration-rest-filter-web-configuration",
      "configuration-openapi-configuration",
      "configuration-application-yaml", "configuration-application-local-yaml", "configuration-application-test-yaml", "configuration-application-prod-yaml",
      "configuration-messages", "configuration-messages-pt-br",
      "configuration-application-test",
      "configuration-architecture-test",
      "configuration-global-exception-handler-test",
      "configuration-cors-smoke-test",
      "configuration-openapi-smoke-test",
      "configuration-http-smoke-test",
      "configuration-querydsl-filter-persistence-test",
      "configuration-http-persistence-read-test",
      "configuration-find-by-id-persistence-test",
      "configuration-create-persistence-test",
      "configuration-http-find-by-id-test",
      "configuration-http-create-test",
      "configuration-http-update-test",
      "configuration-http-delete-test",
      "configuration-http-filter-test",
      "configuration-paging-persistence-test",
      "configuration-querydsl-filter-paging-persistence-test",
      "configuration-update-persistence-test",
      "configuration-delete-persistence-test",
    ]);
    expect(resolver.resolveAll(profile.modules).map((module) => module.id)).toEqual([
      "build",
      "core",
      "entrypoints-rest",
      "infra-database",
      "configuration",
    ]);
    expect(resolver.resolveSelected(profile.modules, ["core"]).map((module) => module.id)).toEqual([
      "core",
    ]);
    expect(resolver.resolveSelected(profile.modules, ["entrypoints-rest"]).map((module) => module.id)).toEqual([
      "core",
      "entrypoints-rest",
    ]);
    expect(resolver.resolveSelected(profile.modules, ["infra-database"]).map((module) => module.id)).toEqual([
      "core",
      "infra-database",
    ]);
    expect(resolver.resolveSelected(profile.modules, ["configuration"]).map((module) => module.id)).toEqual([
      "build",
      "core",
      "entrypoints-rest",
      "infra-database",
      "configuration",
    ]);
  });
});
