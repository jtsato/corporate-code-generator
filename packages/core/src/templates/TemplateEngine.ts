export interface TemplateEngine {
  render(
    template: string,
    model: object,
  ): Promise<string>;
}