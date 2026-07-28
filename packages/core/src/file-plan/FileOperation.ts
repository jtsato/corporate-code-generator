export interface CreateFileOperation {
  readonly kind: "CREATE";
  readonly targetPath: string;
  readonly content: string;
}

export type FileOperation =
  | CreateFileOperation;
