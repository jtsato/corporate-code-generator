import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
export const mavenCompileTimeoutMs = 300_000;

export function getMavenCommand(args: readonly string[]): { readonly command: string; readonly args: readonly string[] } {
  return process.platform === "win32"
    ? { command: "cmd.exe", args: ["/d", "/s", "/c", "mvn", ...args] }
    : { command: "mvn", args };
}

export async function detectMaven(cwd: string): Promise<{ readonly available: boolean }> {
  const command = getMavenCommand(["-version"]);
  try {
    await execFileAsync(command.command, command.args, { cwd, timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
    return { available: true };
  } catch (error) {
    const failure = error as { readonly code?: string | number; readonly stdout?: string; readonly stderr?: string };
    const output = `${failure.stdout ?? ""}\n${failure.stderr ?? ""}`;
    if (failure.code === "ENOENT" || output.includes("nÃ£o Ã© reconhecido") || output.includes("is not recognized")) return { available: false };
    throw new Error(`Maven was found but 'mvn -version' failed (code ${String(failure.code ?? "unknown")}).\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
  }
}

export async function compileWithMaven(cwd: string): Promise<void> {
  await runMaven(cwd, ["compile"], "compilation");
}

export async function testWithMaven(cwd: string): Promise<void> {
  await runMaven(cwd, ["test"], "test execution");
}

async function runMaven(cwd: string, args: readonly string[], operation: string): Promise<void> {
  const command = getMavenCommand(args);
  try {
    await execFileAsync(command.command, command.args, { cwd, timeout: mavenCompileTimeoutMs, maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    const failure = error as { readonly code?: string | number; readonly stdout?: string; readonly stderr?: string; readonly killed?: boolean };
    if (failure.killed || failure.code === "ETIMEDOUT") throw new Error(`Maven ${operation} exceeded the ${mavenCompileTimeoutMs}ms timeout.\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
    throw new Error(`Maven ${operation} failed (code ${String(failure.code ?? "unknown")}).\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
  }
}
