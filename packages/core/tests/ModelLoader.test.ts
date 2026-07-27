import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ModelLoader } from "../src/index.js";

describe("ModelLoader", () => {
  it("should load and parse a YAML model file", async () => {
    const path = fileURLToPath(
      new URL("./fixtures/simple-model.yaml", import.meta.url),
    );

    const loader = new ModelLoader();

    const document = await loader.load(path);

    expect(document).toEqual({
      schemaVersion: "1.0",
      application: {
        name: "test-service",
      },
      entities: [
        {
          name: "Customer",
          attributes: [
            {
              name: "id",
              type: "uuid",
            },
          ],
        },
      ],
    });
  });
});