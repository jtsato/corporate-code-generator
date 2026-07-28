export class MissingSchemaVersionError extends Error {
  public readonly code = "MODEL005";

  public constructor() {
    super(
      "Application model does not declare a valid schemaVersion.",
    );

    this.name = "MissingSchemaVersionError";
  }
}