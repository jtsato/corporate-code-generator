export function toJavaTypeName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error("Java type name source must not be empty.");
  const parts = trimmed.split(/[\s._-]+/).filter((part) => part.length > 0);
  const result = parts.map((part) => part[0]?.toUpperCase() + part.slice(1)).join("");
  if (!/^[A-Z][A-Za-z0-9]*$/.test(result)) {
    throw new Error(`Cannot derive a valid Java type name from '${value}'.`);
  }
  return result;
}
