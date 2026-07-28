import {
  describe,
  expect,
  it,
} from "vitest";

import {
  TemplatePack,
  TemplatePackLoader,
  TemplatePackResolver,
  findTemplateDefinition,
} from "../src/index.js";

describe("TemplateDefinition lookup", () => {
  it("should find an existing definition", async () => {
    const loader = new TemplatePackLoader();
    const pack = await loader.load(
      "./packages/core/tests/fixtures/template-packs/valid-pack/manifest.yaml",
    );

    expect(findTemplateDefinition(pack, "domain-entity")).toBeDefined();
  });

  it("should fail for a missing definition", async () => {
    const loader = new TemplatePackLoader();
    const pack = await loader.load(
      "./packages/core/tests/fixtures/template-packs/valid-pack/manifest.yaml",
    );

    expect(() => findTemplateDefinition(pack, "missing-definition"))
      .toThrow("Template definition 'missing-definition' was not found.");
  });
});
