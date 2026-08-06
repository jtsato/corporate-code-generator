import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const templatePacksDirectory = resolve(rootDirectory, "template-packs");

describe("Template pack Querydsl PathBuilder guard", () => {
  it("never references com.querydsl.core.types.dsl.PathBuilder in any .njk template", async () => {
    const templateFiles = (await readdir(templatePacksDirectory, { recursive: true }))
      .filter((entry) => entry.endsWith(".njk"))
      .map((entry) => join(templatePacksDirectory, entry));

    expect(templateFiles.length).toBeGreaterThan(0);

    // Word-boundary match so an identifier like `noClassesShouldUseQuerydslPathBuilder`
    // (naming the guard itself) doesn't trip this check; quoted string literals are
    // stripped first so an ArchUnit denylist entry such as
    // `.haveFullyQualifiedName("com.querydsl.core.types.dsl.PathBuilder")` is allowed
    // to name the forbidden class without tripping it either. Only actual code usage
    // (import, instantiation, generic type reference) is flagged.
    const pathBuilderUsagePattern = /\bPathBuilder\b/;
    const offenders: string[] = [];
    for (const templateFile of templateFiles) {
      const content = await readFile(templateFile, "utf8");
      const withoutStringLiterals = content.replaceAll(/"[^"]*"/g, "\"\"");
      if (pathBuilderUsagePattern.test(withoutStringLiterals)) offenders.push(templateFile);
    }

    expect(offenders).toEqual([]);
  });
});
