import { fileURLToPath } from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  TemplatePackResolver,
  TemplatePackResolutionError,
} from "../src/index.js";

describe("TemplatePackResolver", () => {
  it("should resolve a local template pack", async () => {
    const resolver = new TemplatePackResolver(
      fixturePath("template-pack-root"),
    );

    const resolved = await resolver.resolve({
      id: "java-spring-clean",
      version: "0.1.0",
    });

    expect(resolved.templatePack.id).toBe("java-spring-clean");
    expect(resolved.templatePack.version).toBe("0.1.0");
  });

  it("should reject a missing template pack", async () => {
    const resolver = new TemplatePackResolver(fixturePath("template-pack-root"));

    await expect(resolver.resolve({ id: "missing-pack", version: "0.1.0" }))
      .rejects.toBeInstanceOf(TemplatePackResolutionError);
  });

  it("should reject a different requested version", async () => {
    const resolver = new TemplatePackResolver(fixturePath("template-pack-root"));

    try {
      await resolver.resolve({ id: "java-spring-clean", version: "9.0.0" });
      expect.fail("Expected template pack resolution to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(TemplatePackResolutionError);
      expect((error as TemplatePackResolutionError).code).toBe("TEMPLATE004");
    }
  });

  it("should reject an identifier mismatch", async () => {
    const resolver = new TemplatePackResolver(
      fixturePath("template-pack-id-mismatch"),
    );

    try {
      await resolver.resolve({ id: "java-spring-clean", version: "0.1.0" });
      expect.fail("Expected template pack resolution to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(TemplatePackResolutionError);
      expect((error as TemplatePackResolutionError).code).toBe("TEMPLATE003");
    }
  });
});

function fixturePath(fileName: string): string {
  return fileURLToPath(new URL(
    `./fixtures/${fileName}`,
    import.meta.url,
  ));
}
