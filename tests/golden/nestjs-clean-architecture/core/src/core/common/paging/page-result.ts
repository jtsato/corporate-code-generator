export class PageResult<T> {
  public readonly totalPages: number;

  public constructor(
    public readonly items: readonly T[],
    public readonly page: number,
    public readonly size: number,
    public readonly totalItems: number,
  ) {
    this.totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / size);
  }
}
