export type FileWriteErrorCode = "IO001" | "IO002" | "IO003" | "IO004";

export class FileWriteError extends Error {
  public constructor(
    public readonly code: FileWriteErrorCode,
    message: string,
    public readonly targetPath: string | undefined = undefined,
    public readonly operationIndex: number | undefined = undefined,
  ) {
    super(message);
    this.name = "FileWriteError";
  }
}
