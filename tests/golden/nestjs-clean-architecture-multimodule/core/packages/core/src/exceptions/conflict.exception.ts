import { CoreException } from './core.exception';

export class ConflictException extends CoreException {
  public constructor(
    messageKey: string,
    defaultMessage: string,
  ) {
    super(messageKey, defaultMessage);
  }
}
