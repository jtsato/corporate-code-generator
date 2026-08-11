import { FieldViolation } from '../../exceptions/field-violation';
import { ValidationException } from '../../exceptions/validation.exception';
import { GetWalletByIdQuery } from './get-wallet-by-id.query';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetWalletByIdQueryValidator {
  public validate(query: GetWalletByIdQuery): void {
    const violations: FieldViolation[] = [];
    const value = query.id;
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) violations.push(new FieldViolation("id", "id is required"));
    if (value !== undefined && value !== null && (typeof value !== "string" || !UUID_PATTERN.test(value))) violations.push(new FieldViolation("id", "id has an invalid value"));

    if (violations.length > 0) {
      throw new ValidationException(violations);
    }
  }
}
