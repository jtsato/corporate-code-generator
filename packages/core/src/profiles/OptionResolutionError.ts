export interface OptionResolutionIssue {
  readonly code: string;
  readonly message: string;
  readonly optionId: string;
}

export class OptionResolutionError extends Error {
  public constructor(
    public readonly issues: readonly OptionResolutionIssue[],
  ) {
    super("Option resolution failed.");

    this.name = "OptionResolutionError";
  }
}
