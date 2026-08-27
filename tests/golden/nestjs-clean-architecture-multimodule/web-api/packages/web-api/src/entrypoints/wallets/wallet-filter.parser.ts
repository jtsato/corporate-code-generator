import { FieldViolation } from '@wallet-service/core/exceptions/field-violation';
import { ValidationException } from '@wallet-service/core/exceptions/validation.exception';
import { FilterCondition } from '@wallet-service/core/common/filter/filter-condition';
import { FilterExpression } from '@wallet-service/core/common/filter/filter-expression';
import { FilterOperator } from '@wallet-service/core/common/filter/filter-operator';

export class WalletFilterParser {
  public static parse(value: string | string[] | undefined): FilterExpression {
    if (value === undefined) return new FilterExpression();

    const expressions = Array.isArray(value) ? value : [value];
    return new FilterExpression(expressions.map((expression, index) => this.parseCondition(expression, index)));
  }

  private static parseCondition(expression: string, index: number): FilterCondition {
    const parts = expression.split(':');
    const field = parts[0];
    const operator = parts[1];
    const rawValue = parts.slice(2).join(':');
    const violations: FieldViolation[] = [];

    if (field === undefined || operator === undefined || rawValue.length === 0) {
      violations.push(new FieldViolation(`filter[${index}]`, 'filter must use the field:operator:value format'));
    }

    const supportedFields = new Set([
      'id',
      'balance',
    ]);
    if (field !== undefined && !supportedFields.has(field)) {
      violations.push(new FieldViolation(`filter[${index}]`, `unsupported filter field: ${field}`));
    }
    if (operator !== 'eq' && operator !== 'ne') {
      violations.push(new FieldViolation(`filter[${index}]`, 'filter operator must be eq or ne'));
    }

    if (violations.length > 0) throw new ValidationException(violations);
    return new FilterCondition(field as string, operator as FilterOperator, rawValue);
  }
}
