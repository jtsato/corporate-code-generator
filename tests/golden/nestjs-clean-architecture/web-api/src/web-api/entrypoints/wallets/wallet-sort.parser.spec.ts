import { ValidationException } from '../../../core/exceptions/validation.exception';
import { SortDirection } from '../../../core/common/paging/sort-direction';
import { SortOrder } from '../../../core/common/paging/sort-order';
import { WalletSortParser } from './wallet-sort.parser';

describe('WalletSortParser', () => {
  it('returns no sort orders when sort is missing', () => {
    expect(WalletSortParser.parse(undefined)).toEqual([]);
  });

  it('parses an ascending sort order', () => {
    expect(WalletSortParser.parse('balance:asc')).toEqual([
      new SortOrder('balance', SortDirection.Asc),
    ]);
  });

  it('parses a descending sort order', () => {
    expect(WalletSortParser.parse('balance:desc')).toEqual([
      new SortOrder('balance', SortDirection.Desc),
    ]);
  });

  it('preserves repeated sort order and precedence', () => {
    expect(WalletSortParser.parse(['balance:desc', 'id:asc'])).toEqual([
      new SortOrder('balance', SortDirection.Desc),
      new SortOrder('id', SortDirection.Asc),
    ]);
  });

  it.each([
    'unknown:asc',
    'balance:sideways',
    ':asc',
    'balance:',
    'balance',
    'balance:asc:extra',
    ' balance:asc',
    'balance:asc ',
    'balance :asc',
    'balance: asc',
    'balance:\tasc',
  ])('rejects invalid sort syntax: %s', (value) => {
    expect(() => WalletSortParser.parse(value)).toThrow(ValidationException);
  });

  it('rejects a non-string and non-array input with a validation exception', () => {
    expect(() => WalletSortParser.parse(42 as unknown)).toThrow(ValidationException);
  });

  it('rejects an array when any element is invalid', () => {
    expect(() => WalletSortParser.parse(['balance:asc', 'balance:sideways'])).toThrow(ValidationException);
  });
});
