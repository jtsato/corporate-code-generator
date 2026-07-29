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
import { JavaSpringCleanMultimoduleCoreDomainArtifactProducer } from "@corporate-code-generator/adapter-java";
import { JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer } from "@corporate-code-generator/adapter-java";
import { NunjucksTemplateEngine } from "@corporate-code-generator/template-engine-nunjucks";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("Java multi-module build generation", () => {
  it("renders the Maven reactor and core domain artifacts", async () => {
    const modelPath = resolve(rootDirectory, "examples", "wallet-service", "model.yaml");
    const document = await new ModelLoader().load(modelPath);
    const schemaVersion = new SchemaVersionDetector().detect(document);
    if (schemaVersion === undefined) throw new Error("Expected schema version.");
    new SchemaValidator(await new ModelSchemaRegistry().get(schemaVersion)).validate(document);
    const application = new ModelParser().parse(document);
    new SemanticValidator().validate(application);
    const profile = await new ProfileResolver(resolve(rootDirectory, "profiles")).resolve("java-spring-clean-multimodule");
    const modules = new ModuleResolver().resolveSelected(profile.modules, ["build", "core", "entrypoints-rest"]);
    const resolvedPack = await new TemplatePackResolver(resolve(rootDirectory, "template-packs")).resolve(profile.templatePack);
    const buildPlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleBuildArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const corePlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleCoreDomainArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const restPlan = await new GenerationPlanner(
      new NunjucksTemplateEngine([resolvedPack.directory]),
      new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer(),
      resolvedPack.templatePack,
    ).plan({ application, profile, modules });
    const operations = [...buildPlan.operations, ...corePlan.operations, ...restPlan.operations];

    expect(operations.map((operation) => operation.targetPath)).toEqual([
      "pom.xml", "core/pom.xml", "entrypoints/rest/pom.xml", "configuration/pom.xml",
      "core/src/main/java/io/github/jtsato/walletservice/core/domains/wallet/model/Wallet.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletController.java",
      "entrypoints/rest/src/main/java/io/github/jtsato/walletservice/entrypoint/rest/domains/wallet/WalletResponse.java",
    ]);
    for (const operation of operations) {
      const goldenModule = operation.targetPath.includes("entrypoints/rest/src") ? "entrypoints-rest" : operation.targetPath.endsWith("Wallet.java") ? "core" : "build";
      const golden = await readFile(resolve(
        rootDirectory,
        "tests",
        "golden",
        "java-spring-clean-multimodule",
        goldenModule,
        operation.targetPath,
      ), "utf8");
      expect(normalize(operation.content)).toBe(normalize(golden));
    }
  });
});

function normalize(value: string): string {
  return value.replaceAll("\r\n", "\n");
}
