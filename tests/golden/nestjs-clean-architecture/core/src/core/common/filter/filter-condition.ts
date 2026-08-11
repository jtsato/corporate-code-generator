import { FilterOperator } from './filter-operator';

export class FilterCondition {
  public constructor(
    public readonly field: string,
    public readonly operator: FilterOperator,
    public readonly value: string,
  ) {}
}
