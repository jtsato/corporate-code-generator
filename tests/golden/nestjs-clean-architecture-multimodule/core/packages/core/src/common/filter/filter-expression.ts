import { FilterCondition } from './filter-condition';

export class FilterExpression {
  public constructor(public readonly conditions: readonly FilterCondition[] = []) {}
}
