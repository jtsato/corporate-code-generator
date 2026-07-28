import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { UnsupportedSchemaVersionError } from "./UnsupportedSchemaVersionError.js";

export class ModelSchemaRegistry {
  public async get(
    version: string,
  ): Promise<object> {
    if (!this.isSupported(version)) {
      throw new UnsupportedSchemaVersionError(version);
    }

    const currentDirectory = dirname(
      fileURLToPath(import.meta.url),
    );

    const schemaPath = join(
      currentDirectory,
      "..",
      "..",
      "schemas",
      version,
      "model.schema.json",
    );

    const content = await readFile(schemaPath, "utf8");

    return JSON.parse(content) as object;
  }

  public isSupported(version: string): boolean {
    return version === "1.0";
  }

  public supportedVersions(): readonly string[] {
    return ["1.0"];
  }
}