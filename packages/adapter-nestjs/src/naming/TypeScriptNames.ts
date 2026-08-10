export function toTypeScriptTypeName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error("TypeScript type name source must not be empty.");
  const parts = trimmed.split(/[\s._-]+/).filter((part) => part.length > 0);
  const result = parts.map((part) => part[0]?.toUpperCase() + part.slice(1)).join("");
  if (!/^[A-Z][A-Za-z0-9]*$/.test(result)) {
    throw new Error(`Cannot derive a valid TypeScript type name from '${value}'.`);
  }
  return result;
}

export function toTypeScriptPropertyName(value: string): string {
  const typeName = toTypeScriptTypeName(value);
  return `${typeName[0]?.toLowerCase() ?? ""}${typeName.slice(1)}`;
}

export function toKebabCaseName(value: string): string {
  return toTypeScriptTypeName(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

export function toPluralKebabCaseName(value: string): string {
  return `${toKebabCaseName(value)}s`;
}

export function toRestCollectionPath(entityName: string): string {
  return `/${toPluralKebabCaseName(entityName)}`;
}
