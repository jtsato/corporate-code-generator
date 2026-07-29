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
      "configuration-pom",
      "core-domain-entity",
    ]);
    expect(resolver.resolveAll(profile.modules).map((module) => module.id)).toEqual([
      "build",
      "core",
      "entrypoints-rest",
      "configuration",
    ]);
    expect(resolver.resolveSelected(profile.modules, ["core"]).map((module) => module.id)).toEqual([
      "core",
    ]);
    expect(resolver.resolveSelected(profile.modules, ["entrypoints-rest"]).map((module) => module.id)).toEqual([
      "core",
      "entrypoints-rest",
    ]);
    expect(resolver.resolveSelected(profile.modules, ["configuration"]).map((module) => module.id)).toEqual([
      "core",
      "entrypoints-rest",
      "configuration",
    ]);
  });
});
