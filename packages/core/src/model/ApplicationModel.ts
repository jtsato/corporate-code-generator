import type { Entity } from "./Entity.js";

export interface ApplicationModel {
  readonly schemaVersion: string;
  readonly name: string;
  readonly namespace?: string;
  readonly entities: readonly Entity[];
}