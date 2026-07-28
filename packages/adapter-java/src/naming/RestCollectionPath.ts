import { toJavaTypeName } from "./JavaTypeName.js";

export function toRestCollectionPath(entityName: string): string {
  const typeName = toJavaTypeName(entityName);
  const kebab = typeName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `/${kebab}s`;
}
