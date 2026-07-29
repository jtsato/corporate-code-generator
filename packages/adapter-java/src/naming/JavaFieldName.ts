import { toJavaTypeName } from "./JavaTypeName.js";

export function toJavaFieldName(value: string): string {
  const typeName = toJavaTypeName(value);
  return `${typeName[0]?.toLowerCase() ?? ""}${typeName.slice(1)}`;
}
