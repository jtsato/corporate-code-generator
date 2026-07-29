export interface JavaPersistenceMapperTemplateModel {
  readonly packageName: string; readonly imports: readonly string[]; readonly className: string; readonly constructorName: string;
  readonly domainType: string; readonly entityType: string; readonly domainParameterName: string; readonly entityParameterName: string;
  readonly toEntityMethodName: string; readonly toDomainMethodName: string; readonly toEntityArguments: readonly string[]; readonly toDomainArguments: readonly string[];
}
