import { execFile, spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { createServer } from "node:net";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const npmInstallTimeoutMs = 600_000;
export const npmBuildTimeoutMs = 300_000;
export const serverReadinessTimeoutMs = 60_000;
export const serverShutdownTimeoutMs = 15_000;

const readinessPollIntervalMs = 250;
const readinessProbeTimeoutMs = 2_000;
const capturedOutputLimit = 256 * 1024;

export function getNpmCommand(args: readonly string[]): { readonly command: string; readonly args: readonly string[] } {
  return process.platform === "win32"
    ? { command: "cmd.exe", args: ["/d", "/s", "/c", "npm", ...args] }
    : { command: "npm", args };
}

export interface NpmRegistryProbe {
  readonly available: boolean;
  readonly reason: string;
}

/**
 * Unlike `mvn`, `npm` is always present: this repository runs on it. The honest
 * availability question for an npm-based gate is therefore not "is npm installed"
 * but "can the configured registry actually serve packages from this directory".
 *
 * `npm view` is used rather than `npm ping` or a raw fetch of the public registry.
 * `npm ping` hits `/-/ping`, which many corporate registry mirrors do not implement,
 * and a raw fetch ignores `.npmrc`, mirrors, proxies, TLS settings, and auth tokens
 * entirely. `npm view` exercises the same configuration and network path a subsequent
 * install needs, and asserting the semver shape additionally catches a captive portal
 * that answers 200 with an HTML page.
 *
 * `cwd` must be the generated project rather than the repository root: npm discovers
 * `.npmrc` by walking up from `cwd`, and the two locations can resolve different
 * registries. Probing where the install will run is the only honest ordering.
 */
export async function detectNpmRegistry(cwd: string): Promise<NpmRegistryProbe> {
  const version = getNpmCommand(["--version"]);
  try {
    await execFileAsync(version.command, version.args, { cwd, timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
  } catch (error) {
    const failure = error as { readonly code?: string | number; readonly stdout?: string; readonly stderr?: string };
    const output = `${failure.stdout ?? ""}\n${failure.stderr ?? ""}`;
    if (failure.code === "ENOENT" || output.includes("não é reconhecido") || output.includes("is not recognized")) {
      return { available: false, reason: "The npm executable was not found." };
    }
    throw new Error(`npm was found but 'npm --version' failed (code ${String(failure.code ?? "unknown")}).\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
  }

  const registry = await readConfiguredRegistry(cwd);
  // Retries are disabled for the probe only. A reachability question deserves a fast
  // answer; the install that follows keeps npm's normal retry behaviour.
  const probe = getNpmCommand(["view", "@nestjs/core", "version", "--fetch-retries=0"]);
  try {
    const result = await execFileAsync(probe.command, probe.args, { cwd, timeout: 30_000, maxBuffer: 2 * 1024 * 1024, env: sanitizedNpmEnv() });
    if (!/^\d+\.\d+\.\d+/.test(result.stdout.trim())) {
      return { available: false, reason: `The registry at ${registry} did not answer with a package version.` };
    }
    return { available: true, reason: `The registry at ${registry} served @nestjs/core metadata.` };
  } catch (error) {
    return { available: false, reason: `The registry at ${registry} could not be reached (${describeNpmFailure(error)}).` };
  }
}

function describeNpmFailure(error: unknown): string {
  const failure = error as { readonly code?: string | number; readonly killed?: boolean; readonly stderr?: string; readonly message?: string };
  const errorLine = (failure.stderr ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("npm error") && line !== "npm error");
  if (errorLine !== undefined) return errorLine.replace(/^npm error\s*/, "");
  if (failure.killed === true || failure.code === "ETIMEDOUT") return "the probe timed out";
  if (failure.code !== undefined) return `exit code ${String(failure.code)}`;
  return failure.message ?? "unknown error";
}

async function readConfiguredRegistry(cwd: string): Promise<string> {
  const command = getNpmCommand(["config", "get", "registry"]);
  try {
    const result = await execFileAsync(command.command, command.args, { cwd, timeout: 30_000, maxBuffer: 1024 * 1024 });
    return result.stdout.trim();
  } catch {
    return "an undetermined registry";
  }
}

/**
 * `npm install` rather than `npm ci`: the profile generates no lockfile, and `npm ci`
 * fails without one. Development dependencies are required, because `nest build` runs
 * through the generated project's own `@nestjs/cli` and `typescript`.
 */
export async function installNpmDependencies(cwd: string): Promise<void> {
  await runNpm(cwd, ["install", "--no-audit", "--no-fund", "--loglevel", "error"], "dependency installation", npmInstallTimeoutMs);
}

/** Runs a script declared by the generated `package.json`, validating that contract too. */
export async function runNpmScript(cwd: string, scriptName: string, timeoutMs: number = npmBuildTimeoutMs): Promise<void> {
  await runNpm(cwd, ["run", scriptName], `npm run ${scriptName}`, timeoutMs);
}

/**
 * Runs a generated script that is expected to fail, returning its combined output.
 *
 * A guardrail that never fires is indistinguishable from an absent one, so a suite
 * asserting that a generated lint rule holds must also assert that the same rule
 * rejects a deliberate violation.
 */
export async function runFailingNpmScript(
  cwd: string,
  scriptName: string,
  timeoutMs: number = npmBuildTimeoutMs,
): Promise<{ readonly failed: boolean; readonly output: string }> {
  const command = getNpmCommand(["run", scriptName]);
  try {
    const result = await execFileAsync(command.command, command.args, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, env: sanitizedNpmEnv() });
    return { failed: false, output: `${result.stdout}
${result.stderr}` };
  } catch (error) {
    const failure = error as { readonly stdout?: string; readonly stderr?: string; readonly killed?: boolean };
    if (failure.killed === true) throw new Error(`Generated project npm run ${scriptName} exceeded the ${timeoutMs}ms timeout.`);
    return { failed: true, output: `${failure.stdout ?? ""}
${failure.stderr ?? ""}` };
  }
}

/**
 * Removes the configuration the parent npm injects when this suite is invoked through
 * `npm run`, which would otherwise decide how the generated project installs. The
 * three demonstrated failure modes are `NODE_ENV=production` and `npm_config_omit`,
 * which each reduce the install to runtime dependencies and so remove the
 * `@nestjs/cli` and `typescript` that `nest build` needs, and
 * `npm_config_allow_scripts`, which a project-scoped install rejects outright.
 *
 * Removal is by denylist rather than by dropping every `npm_config_*` variable,
 * because registry, proxy, certificate, and authentication settings are also carried
 * that way. Dropping those would silently redirect an operator's mirror to the public
 * registry, which is precisely the dishonesty the availability probe exists to avoid.
 *
 * Key comparison is case-insensitive on purpose. Windows delivers these names to a
 * test worker upper-cased, while `process.env` lookups stay case-insensitive, so a
 * case-sensitive prefix test silently keeps every variable it claims to remove.
 */
function sanitizedNpmEnv(): NodeJS.ProcessEnv {
  const discardedKeys = new Set([
    // Which project npm operates on.
    "npm_config_local_prefix",
    "npm_config_workspace",
    "npm_config_workspaces",
    // Which dependencies npm selects.
    "npm_config_omit",
    "npm_config_include",
    "npm_config_production",
    "npm_config_dev",
    "npm_config_only",
    "node_env",
    // Script permission semantics.
    "npm_config_allow_scripts",
    // Identity of the invoking script.
    "npm_config_user_agent",
    "npm_lifecycle_event",
    "npm_lifecycle_script",
    "npm_execpath",
    "npm_node_execpath",
    "npm_command",
  ]);
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.startsWith("npm_package_")) continue;
    if (discardedKeys.has(normalizedKey)) continue;
    env[key] = value;
  }
  env["NO_UPDATE_NOTIFIER"] = "1";
  return env;
}

async function runNpm(cwd: string, args: readonly string[], operation: string, timeoutMs: number): Promise<void> {
  const command = getNpmCommand(args);
  try {
    await execFileAsync(command.command, command.args, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, env: sanitizedNpmEnv() });
  } catch (error) {
    const failure = error as { readonly code?: string | number; readonly stdout?: string; readonly stderr?: string; readonly killed?: boolean };
    if (failure.killed || failure.code === "ETIMEDOUT") throw new Error(`Generated project ${operation} exceeded the ${timeoutMs}ms timeout.\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
    throw new Error(`Generated project ${operation} failed (code ${String(failure.code ?? "unknown")}).\nstdout:\n${failure.stdout ?? ""}\nstderr:\n${failure.stderr ?? ""}`);
  }
}

/**
 * Binds port zero, reads the port the operating system assigned, and releases it.
 * A fixed port would collide with a locally running development server; `PORT=0`
 * would leave the assigned port discoverable only inside the generated process.
 */
export async function reserveEphemeralPort(): Promise<number> {
  return await new Promise<number>((resolvePort, rejectPort) => {
    const probe = createServer();
    probe.once("error", rejectPort);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close((error) => (error ? rejectPort(error) : resolvePort(port)));
    });
  });
}

export interface GeneratedServer {
  readonly pid: number;
  readonly port: number;
  readonly baseUrl: string;
  /** Interleaved stdout and stderr captured so far, capped to the most recent output. */
  readonly output: () => string;
  readonly hasExited: () => boolean;
  /** How the process ended, or undefined while it is still running. */
  readonly describeExit: () => string | undefined;
}

export interface GeneratedServerOptions {
  readonly cwd: string;
  readonly entryPoint: string;
  readonly port: number;
}

export interface ServerReadinessOptions {
  readonly path?: string;
  readonly timeoutMs?: number;
}

/**
 * Starts the compiled entry point directly rather than through an npm script, so that
 * the reported process id is the server itself and not an npm shim wrapping it.
 *
 * Spawning and waiting for readiness are separate calls on purpose. The caller owns
 * the handle from the moment the process exists, so a caller whose own timeout fires
 * during startup can still shut the process down; returning the handle only once the
 * server answers would strand it.
 */
export function spawnGeneratedNodeServer(options: GeneratedServerOptions): GeneratedServer {
  let captured = "";
  let exitInfo: { readonly code: number | null; readonly signal: NodeJS.Signals | null } | undefined;

  const child = spawn(process.execPath, [options.entryPoint], {
    cwd: options.cwd,
    env: { ...sanitizedNpmEnv(), PORT: String(options.port) },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });

  const capture = (chunk: Buffer): void => {
    captured += chunk.toString("utf8");
    if (captured.length > capturedOutputLimit) captured = captured.slice(captured.length - capturedOutputLimit);
  };
  child.stdout?.on("data", capture);
  child.stderr?.on("data", capture);
  child.once("exit", (code, signal) => { exitInfo = { code, signal }; });
  child.once("error", (error) => { captured += `\nspawn error: ${error.message}\n`; });

  return {
    pid: child.pid ?? -1,
    port: options.port,
    baseUrl: `http://127.0.0.1:${String(options.port)}`,
    output: () => captured,
    hasExited: () => exitInfo !== undefined,
    describeExit: () => (exitInfo === undefined ? undefined : `code ${String(exitInfo.code)}, signal ${String(exitInfo.signal)}`),
  };
}

/**
 * Waits until the server answers an HTTP request, rather than until it prints a
 * particular line. Framework startup banners are configurable, version dependent, and
 * emitted around rather than strictly after the listener opens; an answered request is
 * the contract actually under test. The default path is answered by the framework's
 * own not-found handler, which proves the listener and router are live without
 * depending on any generated route.
 *
 * Teardown belongs to the caller, which already holds the handle.
 */
export async function awaitServerReadiness(server: GeneratedServer, options: ServerReadinessOptions = {}): Promise<void> {
  const readinessPath = options.path ?? "/";
  const readinessTimeout = options.timeoutMs ?? serverReadinessTimeoutMs;
  const target = `${server.baseUrl}${readinessPath}`;
  const deadline = Date.now() + readinessTimeout;

  while (Date.now() < deadline) {
    const exitDescription = server.describeExit();
    if (exitDescription !== undefined) {
      throw new Error(`The generated server exited before becoming ready (${exitDescription}).\noutput:\n${server.output()}`);
    }
    try {
      const response = await fetch(target, { signal: AbortSignal.timeout(readinessProbeTimeoutMs) });
      await response.arrayBuffer();
      return;
    } catch {
      await delay(readinessPollIntervalMs);
    }
  }

  throw new Error(`The generated server did not answer ${target} within ${String(readinessTimeout)}ms.\noutput:\n${server.output()}`);
}

/**
 * Never throws: this runs during teardown, where an exception would mask the failure
 * that is actually under investigation. On Windows a process handle kill leaves the
 * spawned tree behind, so the tree is terminated through taskkill instead.
 */
export async function stopGeneratedNodeServer(server: GeneratedServer | undefined): Promise<void> {
  if (server === undefined || server.hasExited() || server.pid <= 0) return;

  if (process.platform === "win32") {
    await execFileAsync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { timeout: serverShutdownTimeoutMs }).catch(() => undefined);
  } else {
    try { process.kill(-server.pid, "SIGTERM"); } catch { /* already reaped */ }
    if (!(await waitForExit(server, 5_000))) {
      try { process.kill(-server.pid, "SIGKILL"); } catch { /* already reaped */ }
    }
  }

  await waitForExit(server, serverShutdownTimeoutMs);
}

/**
 * Removes a generated project tree without letting cleanup decide the result of the
 * run. An installed `node_modules` tree is large and, on Windows, briefly held open by
 * the processes that just touched it, so removal is retried; if it still fails the
 * directory is left to the operating system's temporary storage and reported, never
 * thrown, because a cleanup error would otherwise mask the finding under test.
 */
export async function removeGeneratedProject(projectRoot: string | undefined): Promise<void> {
  if (projectRoot === undefined) return;
  try {
    await rm(projectRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  } catch (error) {
    console.warn(`Could not remove the generated project at ${projectRoot}: ${String((error as Error).message)}`);
  }
}

async function waitForExit(server: GeneratedServer, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.hasExited()) return true;
    await delay(50);
  }
  return server.hasExited();
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}
