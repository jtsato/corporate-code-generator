import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
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

export async function testWithMaven(cwd: string, testPattern?: string): Promise<void> {
  const args = testPattern === undefined
    ? ["test"]
    : ["test", `-Dtest=${testPattern}`, "-Dsurefire.failIfNoSpecifiedTests=false"];
  await runMaven(cwd, args, "test execution");
}

/**
 * Detects a Docker daemon the way Testcontainers does, rather than by shelling out to the CLI.
 * The two differ: a `docker` CLI can be a wrapper that reaches a daemon inside WSL, which a
 * Windows JVM cannot connect to. Probing the endpoint keeps this honest.
 */
export async function detectDocker(): Promise<{ readonly available: boolean; readonly reason: string }> {
  if ((process.env.DOCKER_HOST ?? "") !== "") return { available: true, reason: "DOCKER_HOST is set." };
  const endpoint = process.platform === "win32" ? "\\\\.\\pipe\\docker_engine" : "/var/run/docker.sock";
  try {
    await access(endpoint);
    return { available: true, reason: `${endpoint} is reachable.` };
  } catch {
    return { available: false, reason: `No Docker endpoint at ${endpoint} and DOCKER_HOST is unset.` };
  }
}

export async function integrationTestWithMaven(cwd: string, profileId: string, moduleId: string): Promise<void> {
  // A cold run pulls a database image before the first test starts, which can
  // outlast the compile-oriented default timeout.
  await runMaven(cwd, ["-P", profileId, "-pl", moduleId, "-am", "verify"], "integration test execution", 600_000);
}

export async function mutationTestWithMaven(cwd: string, profileId: string, moduleId: string): Promise<void> {
  await runMaven(cwd, ["-P", profileId, "-pl", moduleId, "verify"], "mutation analysis");
}

async function runMaven(cwd: string, args: readonly string[], operation: string, timeoutMs: number = mavenCompileTimeoutMs): Promise<void> {
  const command = getMavenCommand(args);
  try {
    await execFileAsync(command.command, command.args, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    const failure = error as { readonly code?: string | number; readonly stdout?: string; readonly stderr?: string; readonly killed?: boolean };
    if (failure.killed || failure.code === "ETIMEDOUT") throw new Error(`Maven ${operation} exceeded the ${timeoutMs}ms timeout.\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
    throw new Error(`Maven ${operation} failed (code ${String(failure.code ?? "unknown")}).\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
  }
}
