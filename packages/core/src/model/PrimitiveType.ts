export const primitiveTypes = [
  "string",
  "boolean",
  "int32",
  "int64",
  "decimal",
  "uuid",
  "date",
  "datetime"
] as const;

export type PrimitiveType = (typeof primitiveTypes)[number];
