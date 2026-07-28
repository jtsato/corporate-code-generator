export interface Module {
  readonly id: string;
  readonly requires: readonly string[];
}
