const databaseIdentifierLimit = 63;

export function toJavaDatabaseUniqueConstraintName(
  tableName: string,
  columnNames: readonly string[],
): string {
  const segment =
    columnNames.length > 1 ? `g${columnNames.length}_${columnNames.join("_")}` : columnNames.join("_");
  const baseName = `uk_${tableName}_${segment}_active_scope`;
  if (baseName.length <= databaseIdentifierLimit) return baseName;

  const hash = stableHash(baseName);
  const prefixLength = databaseIdentifierLimit - hash.length - 1;
  return `${baseName.slice(0, prefixLength)}_${hash}`;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
