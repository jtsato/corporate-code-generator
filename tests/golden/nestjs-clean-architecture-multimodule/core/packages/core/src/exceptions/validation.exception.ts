import { FieldViolation } from './field-violation';
import { CoreException } from './core.exception';

export class ValidationException extends CoreException {
  public constructor(public readonly violations: readonly FieldViolation[]) {
    super('Validation failed');
  }
}
