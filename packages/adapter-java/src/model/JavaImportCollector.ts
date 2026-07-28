export class JavaImportCollector {
  private readonly imports =
    new Set<string>();

  public add(value: string | undefined): void {
    if (value === undefined) {
      return;
    }

    this.imports.add(value);
  }

  public values(): readonly string[] {
    return [...this.imports].sort(
      (left, right) =>
        left.localeCompare(right),
    );
  }
}