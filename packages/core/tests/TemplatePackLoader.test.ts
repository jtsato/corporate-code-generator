import { fileURLToPath } from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  TemplatePackLoader,
  TemplatePackValidationError,
} from "../src/index.js";

describe("TemplatePackLoader", () => {
  it("should load a valid template pack manifest", async () => {
    const loader = new TemplatePackLoader();
    const pack = await loader.load(fixturePath("valid-pack/manifest.yaml"));

    expect(pack).toEqual({
      id: "java-spring-clean",
      version: "0.1.0",
      templates: [
        {
          id: "domain-entity",
          module: "domain",
          template: "domain/entity.java.njk",
          output: "src/main/java/{{ packagePath }}/domain/{{ className }}.java",
        },
      ],
    });
  });

  it("should reject structural template pack issues", async () => {
    const loader = new TemplatePackLoader();

    await expect(loader.load(fixturePath("invalid-pack/manifest.yaml")))
      .rejects.toBeInstanceOf(TemplatePackValidationError);
  });

  it("should reject duplicate template identifiers with TEMPLATE005", async () => {
    const loader = new TemplatePackLoader();

    try {
      await loader.load(fixturePath("duplicate-pack/manifest.yaml"));
      expect.fail("Expected template pack validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(TemplatePackValidationError);
      expect((error as TemplatePackValidationError).code).toBe(
        "TEMPLATE005",
      );
    }
  });

  it("should reject a template traversal path", async () => {
    const loader = new TemplatePackLoader();

    await expect(loader.load(fixturePath("traversal-pack/manifest.yaml")))
      .rejects.toBeInstanceOf(TemplatePackValidationError);
  });
});

function fixturePath(fileName: string): string {
  return fileURLToPath(new URL(
    `./fixtures/template-packs/${fileName}`,
    import.meta.url,
  ));
}
