import type { Attribute } from "./Attribute.js";

export interface Entity {
  readonly name: string;
  readonly attributes: readonly Attribute[];
  readonly uniqueGroups?: readonly (readonly string[])[];
  readonly audited?: boolean;
}
