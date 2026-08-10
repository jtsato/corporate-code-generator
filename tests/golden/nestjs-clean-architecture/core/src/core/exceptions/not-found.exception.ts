import { CoreException } from './core.exception';

export class NotFoundException extends CoreException {
  public constructor(message: string) {
    super(message);
  }
}
