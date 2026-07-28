export interface FilePlanValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly operationIndex: number;
}

export class FilePlanValidationError extends Error {
  public constructor(
    public readonly issues: readonly FilePlanValidationIssue[],
  ) {
    super("File plan validation failed.");

    this.name = "FilePlanValidationError";
  }
}
