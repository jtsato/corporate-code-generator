import { ValidationException } from '../../exceptions/validation.exception';
import { SortDirection } from './sort-direction';
import { SortOrder } from './sort-order';

describe('SortOrder', () => {
  it('accepts a nonblank property with either supported direction', () => {
    expect(SortDirection.Asc).toBe('asc');
    expect(SortDirection.Desc).toBe('desc');

    const ascending = new SortOrder('balance', SortDirection.Asc);
    const descending = new SortOrder('balance', SortDirection.Desc);

    expect(ascending.property).toBe('balance');
    expect(ascending.direction).toBe(SortDirection.Asc);
    expect(descending.direction).toBe(SortDirection.Desc);
  });

  it('rejects a blank property', () => {
    expect(() => new SortOrder(' ', SortDirection.Asc)).toThrow(ValidationException);
  });

  it('rejects an unsupported direction', () => {
    expect(() => new SortOrder('balance', 'sideways' as unknown as SortDirection)).toThrow(ValidationException);
  });
});
