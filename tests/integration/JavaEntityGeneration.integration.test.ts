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
  ModelLoader,
  ModelParser,
  ModelSchemaRegistry,
  SchemaValidator,
  SchemaVersionDetector,
  SemanticValidator,
} from "@corporate-code-generator/core";

import {
  JavaEntityTransformer,
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

    const wallet =
      application.entities.find(
        (entity) => entity.name === "Wallet",
      );

    expect(wallet).toBeDefined();

    if (wallet === undefined) {
      throw new Error(
        "Expected Wallet entity.",
      );
    }

    const transformer =
      new JavaEntityTransformer();

    const templateModel =
      transformer.transform(
        application,
        wallet,
      );

    const templateDirectory = resolve(
      rootDirectory,
      "template-packs",
      "java-spring-clean",
    );

    const engine =
      new NunjucksTemplateEngine([
        templateDirectory,
      ]);

    const actual = await engine.render(
      "domain/entity.java.njk",
      templateModel,
    );

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

    expect(normalize(actual)).toBe(
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