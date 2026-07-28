export interface ModuleResolutionIssue {
  readonly code: string;
  readonly message: string;
  readonly moduleId: string;
}

export class ModuleResolutionError extends Error {
  public constructor(
    public readonly issues: readonly ModuleResolutionIssue[],
  ) {
    super("Module resolution failed.");

    this.name = "ModuleResolutionError";
  }
}
