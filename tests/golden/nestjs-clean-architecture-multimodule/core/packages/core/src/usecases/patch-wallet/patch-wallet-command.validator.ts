import { FieldViolation } from '../../exceptions/field-violation';
import { ValidationException } from '../../exceptions/validation.exception';
import { PatchWalletCommand } from './patch-wallet.command';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PatchWalletCommandValidator {
  public validate(command: PatchWalletCommand): void {
    const violations: FieldViolation[] = [];
    {
      const value = command.id;
      if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) violations.push(new FieldViolation("id", "id is required"));
      if (value !== undefined && value !== null && (typeof value !== "string" || !UUID_PATTERN.test(value))) violations.push(new FieldViolation("id", "id has an invalid value"));
    }

    if (Object.keys(command.changes).length === 0) {
      violations.push(new FieldViolation('changes', 'changes must not be empty'));
    }
    if (Object.prototype.hasOwnProperty.call(command.changes, 'balance')) {
      const value = command.changes.balance;
      if (value === undefined || value === null) {
        violations.push(new FieldViolation('balance', 'balance has an invalid value'));
      }
      if (value === undefined || value === null) violations.push(new FieldViolation("balance", "balance is required"));
      if (value !== undefined && value !== null && (typeof value !== "number" || !Number.isFinite(value))) violations.push(new FieldViolation("balance", "balance has an invalid value"));
    }

    if (violations.length > 0) {
      throw new ValidationException(violations);
    }
  }
}
