import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { FilePlan, FilePlanValidationError } from "@corporate-code-generator/core";
import { NodeFileWriter } from "../src/index.js";

async function withTempRoot(test: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "ccg-file-writer-"));
  try { await test(root); } finally { await rm(root, { recursive: true, force: true }); }
}

describe("NodeFileWriter", () => {
  it("creates nested files", async () => {
    await withTempRoot(async (root) => {
      await new NodeFileWriter().write(FilePlan.create([{ kind: "CREATE", targetPath: "src/Wallet.java", content: "wallet" }]), root);
      await expect(readFile(join(root, "src/Wallet.java"), "utf8")).resolves.toBe("wallet");
    });
  });

  it("fails exclusively when a target exists", async () => {
    await withTempRoot(async (root) => {
      await writeFile(join(root, "existing.txt"), "original");
      await expect(new NodeFileWriter().write(FilePlan.create([{ kind: "CREATE", targetPath: "existing.txt", content: "new" }]), root))
        .rejects.toMatchObject({ code: "IO002", targetPath: "existing.txt", operationIndex: 0 });
      await expect(readFile(join(root, "existing.txt"), "utf8")).resolves.toBe("original");
    });
  });

  it("preflights all operations before mutation", async () => {
    await withTempRoot(async (root) => {
      await writeFile(join(root, "existing.txt"), "original");
      const plan = FilePlan.create([{ kind: "CREATE", targetPath: "first.txt", content: "first" }, { kind: "CREATE", targetPath: "existing.txt", content: "new" }]);
      await expect(new NodeFileWriter().write(plan, root)).rejects.toMatchObject({ code: "IO002" });
      await expect(readFile(join(root, "first.txt"))).rejects.toMatchObject({ code: "ENOENT" });
    });
  });

  it("rejects invalid output roots", async () => {
    await expect(new NodeFileWriter().write(FilePlan.create([]), join(tmpdir(), "ccg-missing-root"))).rejects.toMatchObject({ code: "IO001" });
    await withTempRoot(async (root) => {
      const file = join(root, "file"); await writeFile(file, "x");
      await expect(new NodeFileWriter().write(FilePlan.create([]), file)).rejects.toMatchObject({ code: "IO001" });
    });
  });

  it("rejects incompatible parents", async () => {
    await withTempRoot(async (root) => {
      await writeFile(join(root, "parent"), "x");
      await expect(new NodeFileWriter().write(FilePlan.create([{ kind: "CREATE", targetPath: "parent/file.txt", content: "x" }]), root)).rejects.toMatchObject({ code: "IO003" });
    });
  });

  it("defends against unsafe paths in malformed plans", async () => {
    await withTempRoot(async (root) => {
      const malformed = { operations: [{ kind: "CREATE", targetPath: "../escape.txt", content: "x" }] } as unknown as FilePlan;
      await expect(new NodeFileWriter().write(malformed, root)).rejects.toBeInstanceOf(FilePlanValidationError);
    });
  });

  it("rejects symlink ancestors when supported", async () => {
    await withTempRoot(async (root) => {
      const outside = await mkdtemp(join(tmpdir(), "ccg-file-writer-outside-"));
      try {
        try { await symlink(outside, join(root, "link"), "junction"); } catch { return; }
        await expect(new NodeFileWriter().write(FilePlan.create([{ kind: "CREATE", targetPath: "link/file.txt", content: "x" }]), root)).rejects.toMatchObject({ code: "IO003" });
      } finally { await rm(outside, { recursive: true, force: true }); }
    });
  });
});
