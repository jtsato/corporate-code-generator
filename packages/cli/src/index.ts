#!/usr/bin/env node

import { resolve } from "node:path";

import { ValidateCommand } from "./commands/ValidateCommand.js";
import { GenerateCommand } from "./commands/GenerateCommand.js";
import type { GenerateOptions } from "./commands/GenerateOptions.js";

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (command === undefined) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  switch (command) {
    case "validate":
      await executeValidate(args);
      return;

    case "generate":
      await executeGenerate(args);
      return;

    case "--help":
    case "-h":
    case "help":
      printUsage();
      return;

    default:
      console.error(`Unknown command: ${command}`);
      console.error();
      printUsage();
      process.exitCode = 1;
  }
}

async function executeValidate(
  args: readonly string[],
): Promise<void> {
  const modelPath = args[0];

  if (modelPath === undefined) {
    console.error("Missing application model path.");
    console.error();
    printUsage();
    process.exitCode = 1;
    return;
  }

  const command = new ValidateCommand();

  const result = await command.execute(
    resolve(process.cwd(), modelPath),
  );

  process.exitCode = result.exitCode;
}

async function executeGenerate(args: readonly string[]): Promise<void> {
  try {
    const options = parseGenerateOptions(args);
    process.exitCode = await new GenerateCommand().execute(options);
  } catch (error) {
    console.error(`Error CLI001: ${error instanceof Error ? error.message : "Invalid command usage."}`);
    process.exitCode = 1;
  }
}

function parseGenerateOptions(args: readonly string[]): GenerateOptions {
  const modelPath = args[0];
  if (modelPath === undefined || modelPath.startsWith("-")) throw new Error("Missing application model path.");
  let profileId: string | undefined;
  let outputDirectory: string | undefined;
  const moduleIds: string[] = [];
  let dryRun = false;
  for (let index = 1; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--dry-run") { dryRun = true; continue; }
    if (option === "--profile" || option === "--output" || option === "--module") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("-")) throw new Error(`Option '${option}' requires a value.`);
      index += 1;
      if (option === "--profile") profileId = value;
      else if (option === "--output") outputDirectory = value;
      else moduleIds.push(value);
      continue;
    }
    throw new Error(`Unknown option '${option}'.`);
  }
  if (profileId === undefined) throw new Error("Option '--profile' is required.");
  return { modelPath: resolve(process.cwd(), modelPath), profileId, moduleIds, outputDirectory, dryRun };
}

function printUsage(): void {
  console.log(`
Corporate Code Generator

Usage:
  codegen validate <model>
  codegen generate <model> --profile <profile-id> [--module <module-id> ...] [--output <directory>] [--dry-run]

Commands:
  validate <model>    Validate an application model
  generate <model>    Generate files or print a dry-run plan

Options:
  -h, --help          Show help
`);
}

await main();
