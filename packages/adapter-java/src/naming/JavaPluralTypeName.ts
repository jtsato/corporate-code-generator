import { toJavaTypeName } from "./JavaTypeName.js";
export function toJavaPluralTypeName(value: string): string { return `${toJavaTypeName(value)}s`; }
