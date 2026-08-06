import type { PrimitiveType } from "./PrimitiveType.js";

export interface Attribute {
  readonly name: string;
  readonly type: PrimitiveType;
  readonly required: boolean;
  readonly identifier: boolean;
  readonly unique?: boolean;
}
