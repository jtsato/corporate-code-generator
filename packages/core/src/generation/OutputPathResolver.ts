export interface OutputPathResolver {
  resolve(
    pattern: string,
    variables: Readonly<Record<string, string>>,
  ): string;
}

export class SimpleOutputPathResolver implements OutputPathResolver {
  public resolve(
    pattern: string,
    variables: Readonly<Record<string, string>>,
  ): string {
    validateOutputPattern(pattern);

    const resolved = pattern.replace(
      /\{\{\s*([A-Za-z_]\w*)\s*\}\}/g,
      (_match, identifier: string) => {
        const value = variables[identifier];

        if (value === undefined) {
          throw new OutputPathResolutionError(
            `Missing output variable '${identifier}'.`,
          );
        }

        return value;
      },
    );

    ensureSafeRelativePath(resolved);

    return resolved;
  }
}

export class OutputPathResolutionError extends Error {
  public readonly code = "TEMPLATE008";

  public constructor(message: string) {
    super(message);
    this.name = "OutputPathResolutionError";
  }
}

export function validateOutputPattern(pattern: string): void {
  ensureSafeRelativePath(pattern);

  const withoutPlaceholders = pattern.replace(
    /\{\{\s*([A-Za-z_]\w*)\s*\}\}/g,
    "",
  );

  if (withoutPlaceholders.includes("{") || withoutPlaceholders.includes("}")) {
    throw new OutputPathResolutionError(
      "Output pattern contains unsupported placeholder syntax.",
    );
  }
}

function ensureSafeRelativePath(path: string): void {
  if (path.trim().length === 0) {
    throw new OutputPathResolutionError("Output path must not be empty.");
  }

  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) {
    throw new OutputPathResolutionError("Output path must be relative.");
  }

  if (path.includes("\\")) {
    throw new OutputPathResolutionError(
      "Output path must use POSIX separators.",
    );
  }

  if (path.split("/").some((segment) => segment === "." || segment === "..")) {
    throw new OutputPathResolutionError(
      "Output path must not contain traversal segments.",
    );
  }
}
