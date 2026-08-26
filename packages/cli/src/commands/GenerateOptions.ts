export interface GenerateOptions {
  readonly modelPath: string;
  readonly profileId: string;
  readonly moduleIds: readonly string[];
  /** Profile option assignments, keyed by option id. */
  readonly optionAssignments: ReadonlyMap<string, string>;
  readonly outputDirectory: string | undefined;
  readonly dryRun: boolean;
}
