export interface JavaRestSortFieldTemplateModel {
  readonly publicName: string;
  readonly domainName: string;
}

export interface JavaRestSortTemplateModel {
  readonly packageName: string;
  readonly exceptionPackage: string;
  readonly corePagingPackage?: string;
  readonly className: string;
  readonly fields?: readonly JavaRestSortFieldTemplateModel[];
  readonly commonSortPackage?: string;
  readonly definitionName?: string;
}
