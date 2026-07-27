export interface SemanticValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path: string;
}

export class SemanticValidationError extends Error {
  public constructor(
    public readonly issues: readonly SemanticValidationIssue[],
  ) {
    super("Application model failed semantic validation.");

    this.name = "SemanticValidationError";
  }
}