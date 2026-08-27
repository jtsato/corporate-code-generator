import { ValidationException } from '../../exceptions/validation.exception';
import { SortDirection } from './sort-direction';
import { SortOrder } from './sort-order';
import { PageRequest } from './page-request';

describe('PageRequest', () => {
  it('defaults to the first page, the default size, and no sorting', () => {
    const request = new PageRequest();

    expect(request.page).toBe(0);
    expect(request.size).toBe(20);
    expect(request.sort).toEqual([]);
  });

  it('accepts multiple sort orders and copies the caller array', () => {
    const sort = [
      new SortOrder('balance', SortDirection.Desc),
      new SortOrder('id', SortDirection.Asc),
    ];
    const request = new PageRequest(0, 20, sort);

    sort.length = 0;

    expect(request.sort).toHaveLength(2);
    expect(request.sort[0]).toEqual(new SortOrder('balance', SortDirection.Desc));
    expect(request.sort[1]).toEqual(new SortOrder('id', SortDirection.Asc));
  });

  it('preserves invalid page and size validation', () => {
    expect(() => new PageRequest(-1)).toThrow(ValidationException);
    expect(() => new PageRequest(0, 0)).toThrow(ValidationException);
    expect(() => new PageRequest(0, 101)).toThrow(ValidationException);
    expect(() => new PageRequest(0.5)).toThrow(ValidationException);
    expect(() => new PageRequest(0, 1.5)).toThrow(ValidationException);
  });
});
