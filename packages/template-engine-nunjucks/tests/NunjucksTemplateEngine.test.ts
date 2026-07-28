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
  NunjucksTemplateEngine,
} from "../src/index.js";

const currentDirectory = dirname(
  fileURLToPath(import.meta.url),
);

const templateDirectory = resolve(
  currentDirectory,
  "templates",
);

describe("NunjucksTemplateEngine", () => {
  it("should render a template", async () => {
    const engine =
      new NunjucksTemplateEngine([
        templateDirectory,
      ]);

    const result = await engine.render(
      "hello.njk",
      {
        name: "Corporate Code Generator",
      },
    );

    expect(result.trim()).toBe(
      "Hello Corporate Code Generator!",
    );
  });

  it("should fail when a template variable is undefined", async () => {
    const engine =
      new NunjucksTemplateEngine([
        templateDirectory,
      ]);

    await expect(
      engine.render(
        "hello.njk",
        {},
      ),
    ).rejects.toThrow();
  });
});