import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  GenerationPlanner,
  ModuleResolver,
  ModelLoader,
  ModelParser,
  ModelSchemaRegistry,
  ProfileResolver,
  SchemaValidator,
  SchemaVersionDetector,
  SemanticValidator,
  TemplatePackResolver,
} from "@corporate-code-generator/core";
import { JavaSpringCleanMultimoduleBuildArtifactProducer } from "@corporate-code-generator/adapter-java";
import { NunjucksTemplateEngine } from "@corporate-code-generator/template-engine-nunjucks";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("Java multi-module build generation", () => {
  it("renders the Maven reactor POMs from the build capability", async () => {
    const modelPath = resolve(rootDirectory, "examples", "wallet-service", "model.yaml");
    const document = await new ModelLoader().load(modelPath);
    const schemaVersion = new SchemaVersionDetector().detect(document);
    if (schemaVersion === undefined) throw new Error("Expected schema version.");
    new SchemaValidator(await new ModelSchemaRegistry().get(schemaVersion)).validate(document);
    const application = new ModelParser().parse(document);
    new SemanticValidator().validate(application);
    const profile = await new ProfileResolver(resolve(rootDirectory, "profiles")).resolve("java-spring-clean-multimodule");
    const modules = new ModuleResolver().resolveSelected(profile.modules, ["build"]);
    const resolvedPack = await new TemplatePackResolver(resolve(rootDirectory, "template-packs")).resolve(profile.templatePack);
    const plan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleBuildArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });

    expect(plan.operations.map((operation) => operation.targetPath)).toEqual([
      "pom.xml", "core/pom.xml", "entrypoints/rest/pom.xml", "configuration/pom.xml",
    ]);
    for (const operation of plan.operations) {
      const golden = await readFile(resolve(
        rootDirectory,
        "tests",
        "golden",
        "java-spring-clean-multimodule",
        "build",
        operation.targetPath,
      ), "utf8");
      expect(normalize(operation.content)).toBe(normalize(golden));
    }
  });
});

function normalize(value: string): string {
  return value.replaceAll("\r\n", "\n");
}
