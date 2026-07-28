import { lstat, mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import type { FileOperation, FilePlan } from "@corporate-code-generator/core";
import {
  FilePlanValidationError,
  validateFilePlanTargetPath,
} from "@corporate-code-generator/core";
import { FileWriteError } from "./FileWriteError.js";

export class NodeFileWriter {
  public async write(plan: FilePlan, outputDirectory: string): Promise<void> {
    const root = await this.resolveOutputRoot(outputDirectory);
    const targets = await this.preflight(plan, root);

    for (const target of targets) {
      try {
        await mkdir(dirname(target.physicalPath), { recursive: true });
        await writeFile(target.physicalPath, target.operation.content, {
          encoding: "utf8",
          flag: "wx",
        });
      } catch (error) {
        if (isNodeError(error) && error.code === "EEXIST") {
          throw new FileWriteError("IO002", "CREATE target already exists.", target.operation.targetPath, target.operationIndex);
        }
        throw new FileWriteError("IO004", "Filesystem mutation failed.", target.operation.targetPath, target.operationIndex);
      }
    }
  }

  private async resolveOutputRoot(outputDirectory: string): Promise<string> {
    if (outputDirectory.trim().length === 0) {
      throw new FileWriteError("IO001", "Output root must exist and be a directory.");
    }
    try {
      const stat = await lstat(outputDirectory);
      if (!stat.isDirectory()) throw new Error("not directory");
      return await realpath(outputDirectory);
    } catch {
      throw new FileWriteError("IO001", "Output root must exist and be a directory.");
    }
  }

  private async preflight(plan: FilePlan, root: string): Promise<readonly PlannedTarget[]> {
    const targets: PlannedTarget[] = [];
    for (const [operationIndex, operation] of plan.operations.entries()) {
      if (operation.kind !== "CREATE") {
        throw new FileWriteError("IO003", `Unsupported file operation '${operation.kind}'.`, operation.targetPath, operationIndex);
      }
      const pathIssue = validateFilePlanTargetPath(operation.targetPath);
      if (pathIssue !== undefined) {
        throw new FilePlanValidationError([{
          code: operation.targetPath.trim().length === 0 ? "FILEPLAN001" : "FILEPLAN003",
          message: pathIssue,
          operationIndex,
        }]);
      }
      const physicalPath = resolve(root, ...operation.targetPath.split("/"));
      const relativePath = relative(root, physicalPath);
      if (relativePath === "" || relativePath === ".." || relativePath.startsWith(`..${"/"}`) || relativePath.startsWith(`..${"\\"}`)) {
        throw new FileWriteError("IO003", "Target path escapes output root.", operation.targetPath, operationIndex);
      }
      await this.validateAncestors(root, dirname(physicalPath), operation, operationIndex);
      try {
        await lstat(physicalPath);
        throw new FileWriteError("IO002", "CREATE target already exists.", operation.targetPath, operationIndex);
      } catch (error) {
        if (error instanceof FileWriteError) throw error;
        if (!isNodeError(error) || error.code !== "ENOENT") {
          throw new FileWriteError("IO004", "Unable to inspect CREATE target.", operation.targetPath, operationIndex);
        }
      }
      targets.push({ operation, operationIndex, physicalPath });
    }
    return targets;
  }

  private async validateAncestors(root: string, parent: string, operation: FileOperation, operationIndex: number): Promise<void> {
    let current = parent;
    while (current !== root) {
      try {
        const stat = await lstat(current);
        if (stat.isSymbolicLink() || !stat.isDirectory()) {
          throw new FileWriteError("IO003", "Parent path is incompatible or unsafe.", operation.targetPath, operationIndex);
        }
      } catch (error) {
        if (error instanceof FileWriteError) throw error;
        if (!isNodeError(error) || error.code !== "ENOENT") {
          throw new FileWriteError("IO004", "Unable to inspect parent path.", operation.targetPath, operationIndex);
        }
      }
      const next = dirname(current);
      if (next === current) throw new FileWriteError("IO003", "Target path escapes output root.", operation.targetPath, operationIndex);
      current = next;
    }
  }
}

interface PlannedTarget { readonly operation: Extract<FileOperation, { kind: "CREATE" }>; readonly operationIndex: number; readonly physicalPath: string; }
function isNodeError(error: unknown): error is NodeJS.ErrnoException { return error instanceof Error && "code" in error; }
