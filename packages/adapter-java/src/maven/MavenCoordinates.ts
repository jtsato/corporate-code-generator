export function deriveMavenGroupId(namespace: string | undefined): string {
  if (namespace === undefined) {
    throw new Error("Maven project generation requires an application namespace.");
  }

  const namespaceSegments = namespace.split(".");
  if (namespaceSegments.length < 2 || namespaceSegments.some((segment) => segment.length === 0)) {
    throw new Error(
      `Cannot derive Maven groupId from namespace '${namespace}': namespace must contain at least two non-empty segments.`,
    );
  }

  return namespaceSegments.slice(0, -1).join(".");
}
