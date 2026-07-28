export type OutputPathVariables = Readonly<Record<string, string>>;

export interface TemplateInvocation {
  readonly templateId: string;
  readonly model: object;
  readonly outputVariables: OutputPathVariables;
}
