import {
  readFile,
} from "node:fs/promises";

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

import {
  JavaSpringCleanDomainArtifactProducer,
} from "@corporate-code-generator/adapter-java";

import {
  NunjucksTemplateEngine,
} from "@corporate-code-generator/template-engine-nunjucks";

describe("Java entity generation", () => {
  it("should generate Wallet.java", async () => {
    const currentDirectory = dirname(
      fileURLToPath(import.meta.url),
    );

    const rootDirectory = resolve(
      currentDirectory,
      "..",
      "..",
    );

    const modelPath = resolve(
      rootDirectory,
      "examples",
      "wallet-service",
      "model.yaml",
    );

    const loader: ModelLoader =
      new ModelLoader();

    const document =
      await loader.load(modelPath);

    const versionDetector: SchemaVersionDetector =
      new SchemaVersionDetector();

    const schemaVersion =
      versionDetector.detect(document);

    expect(schemaVersion).toBeDefined();

    if (schemaVersion === undefined) {
      throw new Error(
        "Expected schemaVersion.",
      );
    }

    const registry: ModelSchemaRegistry =
      new ModelSchemaRegistry();

    const schema =
      await registry.get(schemaVersion);

    const schemaValidator: SchemaValidator =
      new SchemaValidator(schema);

    schemaValidator.validate(document);

    const parser: ModelParser =
      new ModelParser();

    const application =
      parser.parse(document);

    const semanticValidator: SemanticValidator =
      new SemanticValidator();

    semanticValidator.validate(application);

    const profile = await new ProfileResolver(
      resolve(rootDirectory, "profiles"),
    ).resolve("java-spring-clean");

    const modules = new ModuleResolver().resolveAll(profile.modules);

    expect(modules.map((module) => module.id)).toEqual([
      "build",
      "domain",
      "application",
    ]);

    const resolvedTemplatePack = await new TemplatePackResolver(
      resolve(rootDirectory, "template-packs"),
    ).resolve(profile.templatePack);

    const engine =
      new NunjucksTemplateEngine([
        resolvedTemplatePack.directory,
      ]);

    const plan = await new GenerationPlanner(
      engine,
      new JavaSpringCleanDomainArtifactProducer(),
      resolvedTemplatePack.templatePack,
    ).plan({
      application,
      profile,
      modules,
    });

    const expectedPath = resolve(
      rootDirectory,
      "tests",
      "golden",
      "java-spring-clean",
      "domain",
      "Wallet.java",
    );

    const expected =
      await readFile(expectedPath, "utf8");

    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]).toMatchObject({
      kind: "CREATE",
      targetPath:
        "src/main/java/io/github/jtsato/walletservice/domain/Wallet.java",
    });

    expect(normalize(plan.operations[0]?.content ?? "")).toBe(
      normalize(expected),
    );

  });
});

function normalize(
  value: string,
): string {
  return value
    .replace(/\r\n/g, "\n")
    .trim();
}
