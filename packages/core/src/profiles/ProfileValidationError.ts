export interface ProfileValidationIssue {
  readonly path: string;
  readonly message: string;
}

export class ProfileValidationError extends Error {
  public readonly code = "PROFILE002";

  public constructor(
    public readonly issues: readonly ProfileValidationIssue[],
  ) {
    super("Profile manifest failed structural validation.");

    this.name = "ProfileValidationError";
  }
}
