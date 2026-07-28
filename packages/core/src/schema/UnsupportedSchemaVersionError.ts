export class UnsupportedSchemaVersionError extends Error {
  public readonly code = "MODEL004";

  public constructor(
    public readonly schemaVersion: string,
  ) {
    super(
      `Unsupported application model schema version '${schemaVersion}'.`,
    );

    this.name = "UnsupportedSchemaVersionError";
  }
}