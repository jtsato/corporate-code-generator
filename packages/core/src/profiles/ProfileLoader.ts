import { readFile } from "node:fs/promises";

import { parse } from "yaml";

import type {
  Module,
} from "./Module.js";
import type {
  Profile,
  ProfileArchitecture,
  ProfileTechnology,
  ProfileTemplatePackReference,
} from "./Profile.js";
import type { ProfileOption } from "./ProfileOption.js";
import {
  ProfileValidationError,
  type ProfileValidationIssue,
} from "./ProfileValidationError.js";

export class ProfileLoader {
  public async load(path: string): Promise<Profile> {
    const content = await readFile(path, "utf8");
    const document: unknown = parse(content);

    return parseProfile(document);
  }
}

function parseProfile(document: unknown): Profile {
  const issues: ProfileValidationIssue[] = [];
  const profile = recordAt(document, "", issues);
  const id = stringAt(profile, "id", "id", issues);
  const version = stringAt(profile, "version", "version", issues);
  const technology = parseTechnology(profile, issues);
  const architecture = parseArchitecture(profile, issues);
  const modules = parseModules(profile, issues);
  const options = parseOptions(profile, issues);
  const templatePack = parseTemplatePack(profile, issues);

  if (issues.length > 0) {
    throw new ProfileValidationError(issues);
  }

  return {
    id: id as string,
    version: version as string,
    technology: technology as ProfileTechnology,
    architecture: architecture as ProfileArchitecture,
    modules: modules as readonly Module[],
    options: options as readonly ProfileOption[],
    templatePack: templatePack as ProfileTemplatePackReference,
  };
}

function parseTechnology(
  profile: Record<string, unknown> | undefined,
  issues: ProfileValidationIssue[],
): ProfileTechnology | undefined {
  const technology = recordAt(profile?.technology, "technology", issues);
  const language = stringAt(
    technology,
    "language",
    "technology.language",
    issues,
  );
  const languageVersion = stringAt(
    technology,
    "languageVersion",
    "technology.languageVersion",
    issues,
  );
  const framework = optionalStringAt(
    technology,
    "framework",
    "technology.framework",
    issues,
  );

  if (language === undefined || languageVersion === undefined) {
    return undefined;
  }

  return {
    language,
    languageVersion,
    ...(framework !== undefined ? { framework } : {}),
  };
}

function parseArchitecture(
  profile: Record<string, unknown> | undefined,
  issues: ProfileValidationIssue[],
): ProfileArchitecture | undefined {
  const architecture = recordAt(
    profile?.architecture,
    "architecture",
    issues,
  );
  const style = stringAt(
    architecture,
    "style",
    "architecture.style",
    issues,
  );

  return style === undefined ? undefined : { style };
}

function parseTemplatePack(
  profile: Record<string, unknown> | undefined,
  issues: ProfileValidationIssue[],
): ProfileTemplatePackReference | undefined {
  const templatePack = recordAt(profile?.templatePack, "templatePack", issues);
  const id = stringAt(templatePack, "id", "templatePack.id", issues);
  const version = stringAt(templatePack, "version", "templatePack.version", issues);

  if (id === undefined || version === undefined) {
    return undefined;
  }

  return { id, version };
}

function parseModules(
  profile: Record<string, unknown> | undefined,
  issues: ProfileValidationIssue[],
): readonly Module[] | undefined {
  const value = profile?.modules;

  if (!Array.isArray(value)) {
    issues.push({
      path: "modules",
      message: "must be an array.",
    });
    return undefined;
  }

  const modules: Module[] = [];

  value.forEach((entry, index) => {
    const path = `modules[${index}]`;
    const module = recordAt(entry, path, issues);
    const id = stringAt(module, "id", `${path}.id`, issues);
    const requires = stringArrayAt(
      module,
      "requires",
      `${path}.requires`,
      issues,
    );

    if (id !== undefined && requires !== undefined) {
      modules.push({ id, requires });
    }
  });

  return modules;
}

/**
 * `options` is absent from every profile that predates the option mechanism, so
 * a missing key means "declares no options" rather than an invalid profile. A
 * present but malformed key is still an error.
 */
function parseOptions(
  profile: Record<string, unknown> | undefined,
  issues: ProfileValidationIssue[],
): readonly ProfileOption[] | undefined {
  const value = profile?.options;

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    issues.push({ path: "options", message: "must be an array." });
    return undefined;
  }

  const options: ProfileOption[] = [];

  value.forEach((entry, index) => {
    const path = `options[${index}]`;
    const option = recordAt(entry, path, issues);
    const id = stringAt(option, "id", `${path}.id`, issues);
    const values = stringArrayAt(option, "values", `${path}.values`, issues);
    const defaultValue = stringAt(option, "default", `${path}.default`, issues);

    if (values !== undefined && values.length === 0) {
      issues.push({ path: `${path}.values`, message: "must not be empty." });
      return;
    }

    if (id !== undefined && values !== undefined && defaultValue !== undefined) {
      options.push({ id, values, defaultValue });
    }
  });

  return options;
}

function recordAt(
  value: unknown,
  path: string,
  issues: ProfileValidationIssue[],
): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  issues.push({
    path: path || "/",
    message: "must be an object.",
  });
  return undefined;
}

function stringAt(
  record: Record<string, unknown> | undefined,
  key: string,
  path: string,
  issues: ProfileValidationIssue[],
): string | undefined {
  const value = record?.[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  issues.push({ path, message: "must be a non-empty string." });
  return undefined;
}

function optionalStringAt(
  record: Record<string, unknown> | undefined,
  key: string,
  path: string,
  issues: ProfileValidationIssue[],
): string | undefined {
  const value = record?.[key];

  if (value === undefined) {
    return undefined;
  }

  return stringAt(record, key, path, issues);
}

function stringArrayAt(
  record: Record<string, unknown> | undefined,
  key: string,
  path: string,
  issues: ProfileValidationIssue[],
): readonly string[] | undefined {
  const value = record?.[key];

  if (!Array.isArray(value)) {
    issues.push({ path, message: "must be an array." });
    return undefined;
  }

  const values: string[] = [];

  value.forEach((entry, index) => {
    if (typeof entry === "string" && entry.trim().length > 0) {
      values.push(entry);
      return;
    }

    issues.push({
      path: `${path}[${index}]`,
      message: "must be a non-empty string.",
    });
  });

  return values;
}
