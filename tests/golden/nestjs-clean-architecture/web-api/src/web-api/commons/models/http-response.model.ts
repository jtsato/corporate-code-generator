export class HttpResponse<T> {
  public constructor(
    public readonly status: number,
    public readonly headers: Readonly<Record<string, string>>,
    public readonly body: T,
  ) {}
}
