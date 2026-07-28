export class SchemaVersionDetector {
  public detect(document: unknown): string | undefined {
    if (
      typeof document !== "object" ||
      document === null
    ) {
      return undefined;
    }

    if (!("schemaVersion" in document)) {
      return undefined;
    }

    const schemaVersion = document.schemaVersion;

    return typeof schemaVersion === "string"
      ? schemaVersion
      : undefined;
  }
}