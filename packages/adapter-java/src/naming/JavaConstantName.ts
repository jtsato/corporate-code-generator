import { toJavaTypeName } from "./JavaTypeName.js";

export function toJavaConstantName(value: string): string {
  return toJavaTypeName(value)
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toUpperCase();
}
