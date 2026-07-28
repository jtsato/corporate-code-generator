export function formatCliError(error: unknown): readonly string[] {
  const candidate = error as { readonly code?: unknown; readonly message?: unknown };
  if (typeof candidate.code === "string" && typeof candidate.message === "string") {
    return [`Error ${candidate.code}: ${candidate.message}`];
  }
  if (error instanceof Error) return [`Error: ${error.message}`];
  return ["An unexpected error occurred."];
}
