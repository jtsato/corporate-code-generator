import { FieldViolation } from '../../exceptions/field-violation';
import { ValidationException } from '../../exceptions/validation.exception';

export const DEFAULT_PAGE = 0;
export const DEFAULT_SIZE = 20;
export const MAX_SIZE = 100;

export class PageRequest {
  public constructor(
    public readonly page: number = DEFAULT_PAGE,
    public readonly size: number = DEFAULT_SIZE,
  ) {
    const violations: FieldViolation[] = [];
    if (!Number.isInteger(page) || page < 0) violations.push(new FieldViolation('page', 'page must be a non-negative integer'));
    if (!Number.isInteger(size) || size < 1 || size > MAX_SIZE) violations.push(new FieldViolation('size', `size must be between 1 and ${MAX_SIZE}`));
    if (violations.length > 0) throw new ValidationException(violations);
  }
}
