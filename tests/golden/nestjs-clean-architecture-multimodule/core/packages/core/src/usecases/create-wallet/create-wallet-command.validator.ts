import { FieldViolation } from '../../exceptions/field-violation';
import { ValidationException } from '../../exceptions/validation.exception';
import { CreateWalletCommand } from './create-wallet.command';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateWalletCommandValidator {
  public validate(command: CreateWalletCommand): void {
    const violations: FieldViolation[] = [];
    {
      const value = command.id;
      if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) violations.push(new FieldViolation("id", "id is required"));
      if (value !== undefined && value !== null && (typeof value !== "string" || !UUID_PATTERN.test(value))) violations.push(new FieldViolation("id", "id has an invalid value"));
    }
    {
      const value = command.balance;
      if (value === undefined || value === null) violations.push(new FieldViolation("balance", "balance is required"));
      if (value !== undefined && value !== null && (typeof value !== "number" || !Number.isFinite(value))) violations.push(new FieldViolation("balance", "balance has an invalid value"));
    }

    if (violations.length > 0) {
      throw new ValidationException(violations);
    }
  }
}
