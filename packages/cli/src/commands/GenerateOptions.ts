export interface GenerateOptions {
  readonly modelPath: string;
  readonly profileId: string;
  readonly moduleIds: readonly string[];
  readonly outputDirectory: string | undefined;
  readonly dryRun: boolean;
}
