import type { ErrorObject } from "ajv";

export class SchemaValidationError extends Error {
  public readonly code = "MODEL001";

  public constructor(
    public readonly validationErrors: readonly ErrorObject[],
  ) {
    super("Application model failed structural validation.");

    this.name = "SchemaValidationError";
  }
}