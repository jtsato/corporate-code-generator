import { toJavaTypeName } from "./JavaTypeName.js";

export function toJavaPackageSegment(value: string): string {
  return toJavaTypeName(value).toLowerCase();
}
