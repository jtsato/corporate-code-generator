export interface JavaSpringDataRepositoryTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly interfaceName: string;
  readonly entityType: string;
  readonly identifierType: string;
  readonly baseRepositoryType: string;
}
