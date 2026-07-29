import { toJavaTypeName } from "./JavaTypeName.js";

export function toJavaDatabaseTableName(value: string): string {
  return toSnakeCase(toJavaTypeName(value));
}

export function toJavaDatabaseColumnName(value: string): string {
  return toSnakeCase(toJavaTypeName(value));
}

function toSnakeCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
