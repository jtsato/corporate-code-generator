import { FieldViolation } from '../../exceptions/field-violation';
import { ValidationException } from '../../exceptions/validation.exception';
import { SortDirection } from './sort-direction';

export class SortOrder {
  public constructor(
    public readonly property: string,
    public readonly direction: SortDirection,
  ) {
    const violations: FieldViolation[] = [];
    if (typeof property !== 'string' || property.trim().length === 0) violations.push(new FieldViolation('property', 'sort property must be non-blank'));
    if (![SortDirection.Asc, SortDirection.Desc].includes(direction)) violations.push(new FieldViolation('direction', 'sort direction must be asc or desc'));
    if (violations.length > 0) throw new ValidationException(violations);
  }
}
