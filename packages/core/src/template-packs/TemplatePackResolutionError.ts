export type TemplatePackResolutionCode =
  | "TEMPLATE001"
  | "TEMPLATE003"
  | "TEMPLATE004"
  | "TEMPLATE006";

export class TemplatePackResolutionError extends Error {
  public readonly code: TemplatePackResolutionCode;

  public constructor(
    code: TemplatePackResolutionCode,
    message: string,
  ) {
    super(message);
    this.name = "TemplatePackResolutionError";
    this.code = code;
  }
}
