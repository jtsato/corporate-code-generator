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
      "core-find-usecase",
      "core-find-usecase-interactor",
      "core-application-exception", "core-field-violation", "core-validation-exception", "core-not-found-exception",
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
      "entrypoints-rest-response-status",
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
      "configuration-application",
      "configuration-domain-wiring",
      "configuration-global-exception-handler",
      "configuration-cors-properties", "configuration-cors-web-configuration",
      "configuration-openapi-configuration",
      "configuration-application-yaml", "configuration-application-local-yaml", "configuration-application-test-yaml", "configuration-application-prod-yaml",
      "configuration-messages", "configuration-messages-pt-br",
      "configuration-application-test",
      "configuration-architecture-test",
      "configuration-global-exception-handler-test",
      "configuration-cors-smoke-test",
      "configuration-openapi-smoke-test",
      "configuration-http-smoke-test",
      "configuration-http-persistence-read-test",
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
