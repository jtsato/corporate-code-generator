export interface TemplatePackValidationIssue {
  readonly path: string;
  readonly message: string;
}

export class TemplatePackValidationError extends Error {
  public readonly code: "TEMPLATE002" | "TEMPLATE005";

  public constructor(
    public readonly issues: readonly TemplatePackValidationIssue[],
    code: "TEMPLATE002" | "TEMPLATE005" = "TEMPLATE002",
  ) {
    super("Template pack manifest failed structural validation.");

    this.name = "TemplatePackValidationError";
    this.code = code;
  }
}
