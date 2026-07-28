#!/usr/bin/env node

import { resolve } from "node:path";

import { ValidateCommand } from "./commands/ValidateCommand.js";

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

function printUsage(): void {
  console.log(`
Corporate Code Generator

Usage:
  codegen validate <model>

Commands:
  validate <model>    Validate an application model

Options:
  -h, --help          Show help
`);
}

await main();