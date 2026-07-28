export function validateFilePlanTargetPath(
  targetPath: string,
): string | undefined {
  if (targetPath.trim().length === 0) {
    return "File operation target path must not be empty.";
  }

  if (
    targetPath.startsWith("/") ||
    /^[A-Za-z]:/.test(targetPath)
  ) {
    return "File operation target path must be relative.";
  }

  if (targetPath.includes("\\")) {
    return "File operation target path must use POSIX separators.";
  }

  if (targetPath.split("/").some((segment) => segment === "." || segment === "..")) {
    return "File operation target path must not contain traversal segments.";
  }

  return undefined;
}
