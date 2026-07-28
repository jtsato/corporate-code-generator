import type { FileOperation } from "./FileOperation.js";
import {
  FilePlanValidationError,
  type FilePlanValidationIssue,
} from "./FilePlanValidationError.js";
import { validateFilePlanTargetPath } from "./FilePlanTargetPath.js";

export class FilePlan {
  public readonly operations: readonly FileOperation[];

  private constructor(
    operations: readonly FileOperation[],
  ) {
    this.operations = Object.freeze([
      ...operations,
    ]);
  }

  public static create(
    operations: readonly FileOperation[],
  ): FilePlan {
    const issues = validate(operations);

    if (issues.length > 0) {
      throw new FilePlanValidationError(issues);
    }

    return new FilePlan(operations);
  }
}

function validate(
  operations: readonly FileOperation[],
): readonly FilePlanValidationIssue[] {
  const issues: FilePlanValidationIssue[] = [];
  const targetPaths = new Set<string>();

  operations.forEach((operation, index) => {
    const pathIssue = validateFilePlanTargetPath(operation.targetPath);
    if (pathIssue !== undefined) {
      issues.push({
        code: operation.targetPath.trim().length === 0 ? "FILEPLAN001" : "FILEPLAN003",
        message: pathIssue,
        operationIndex: index,
      });
    }

    if (targetPaths.has(operation.targetPath)) {
      issues.push({
        code: "FILEPLAN002",
        message:
          `Multiple file operations target '${operation.targetPath}'.`,
        operationIndex: index,
      });
    }

    targetPaths.add(operation.targetPath);
  });

  return issues;
}
