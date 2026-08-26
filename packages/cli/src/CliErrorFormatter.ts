interface IssueLike {
  readonly code?: unknown;
  readonly message?: unknown;
}

/**
 * Errors that carry an `issues` array say what actually went wrong there rather
 * than in their own message, which is a summary. Printing only the summary turns
 * "Option 'persistence' does not accept 'sqlite'. Allowed values: memory,
 * typeorm." into "Option resolution failed.", so the issues are printed too.
 */
function issueLines(error: unknown): readonly string[] {
  const issues = (error as { readonly issues?: unknown }).issues;

  if (!Array.isArray(issues)) return [];

  return issues
    .filter((issue): issue is IssueLike => typeof issue === "object" && issue !== null)
    .filter((issue) => typeof issue.message === "string")
    .map((issue) =>
      typeof issue.code === "string"
        ? `  ${issue.code}: ${String(issue.message)}`
        : `  ${String(issue.message)}`,
    );
}

export function formatCliError(error: unknown): readonly string[] {
  const candidate = error as { readonly code?: unknown; readonly message?: unknown };
  if (typeof candidate.code === "string" && typeof candidate.message === "string") {
    return [`Error ${candidate.code}: ${candidate.message}`, ...issueLines(error)];
  }
  if (error instanceof Error) return [`Error: ${error.message}`, ...issueLines(error)];
  return ["An unexpected error occurred."];
}
