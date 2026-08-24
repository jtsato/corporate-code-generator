import { ValidationException } from '../../../core/exceptions/validation.exception';
import { SortDirection } from '../../../core/common/paging/sort-direction';
import { SortOrder } from '../../../core/common/paging/sort-order';
import { WalletSortParser } from './wallet-sort.parser';

const sortProperty = 'id';
const alternateSortProperty = 'id';

describe('WalletSortParser', () => {
  it('returns no sort orders when sort is missing', () => {
    expect(WalletSortParser.parse(undefined)).toEqual([]);
  });

  it('parses an ascending sort order', () => {
    expect(WalletSortParser.parse(`${sortProperty}:asc`)).toEqual([
      new SortOrder(sortProperty, SortDirection.Asc),
    ]);
  });

  it('parses a descending sort order', () => {
    expect(WalletSortParser.parse(`${sortProperty}:desc`)).toEqual([
      new SortOrder(sortProperty, SortDirection.Desc),
    ]);
  });

  it('preserves repeated sort order and precedence', () => {
    expect(WalletSortParser.parse([`${sortProperty}:desc`, `${alternateSortProperty}:asc`])).toEqual([
      new SortOrder(sortProperty, SortDirection.Desc),
      new SortOrder(alternateSortProperty, SortDirection.Asc),
    ]);
  });

  it.each([
    'unknown:asc',
    ` ${sortProperty}:asc`,
    `${sortProperty}:sideways`,
    ':asc',
    `${sortProperty}:`,
    sortProperty,
    `${sortProperty}:asc:extra`,
    `${sortProperty}:asc `,
    `${sortProperty} :asc`,
    `${sortProperty}: asc`,
    `${sortProperty}:\tasc`,
  ])('rejects invalid sort syntax: %s', (value) => {
    expect(() => WalletSortParser.parse(value)).toThrow(ValidationException);
  });

  it('rejects a non-string and non-array input with a validation exception', () => {
    expect(() => WalletSortParser.parse(42 as unknown)).toThrow(ValidationException);
  });

  it('rejects an array when any element is invalid', () => {
    expect(() => WalletSortParser.parse([`${sortProperty}:asc`, `${sortProperty}:sideways`])).toThrow(ValidationException);
  });
});
