import type { PrimitiveType } from "../PrimitiveType.js";

export interface ApplicationModelDocument {
  readonly schemaVersion: string;
  readonly application: ApplicationDocument;
  readonly entities: readonly EntityDocument[];
}

export interface ApplicationDocument {
  readonly name: string;
  readonly namespace?: string;
}

export interface EntityDocument {
  readonly name: string;
  readonly attributes: readonly AttributeDocument[];
  readonly uniqueGroups?: readonly (readonly string[])[];
}

export interface AttributeDocument {
  readonly name: string;
  readonly type: PrimitiveType;
  readonly required?: boolean;
  readonly identifier?: boolean;
  readonly unique?: boolean;
}
