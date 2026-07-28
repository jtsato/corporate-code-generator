export class TemplatePackResolutionError extends Error {
  public readonly code:
    | "TEMPLATE001"
    | "TEMPLATE003"
    | "TEMPLATE004";

  public constructor(
    code: "TEMPLATE001" | "TEMPLATE003" | "TEMPLATE004",
    message: string,
  ) {
    super(message);
    this.name = "TemplatePackResolutionError";
    this.code = code;
  }
}
