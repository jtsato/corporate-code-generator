import { readFile } from "node:fs/promises";
import { parse } from "yaml";

import {
  validateOutputPattern,
} from "../generation/OutputPathResolver.js";
import type { TemplatePack, TemplateDefinition, TemplatePackReference } from "./TemplatePack.js";
import {
  TemplatePackValidationError,
  type TemplatePackValidationIssue,
} from "./TemplatePackValidationError.js";

export class TemplatePackLoader {
  public async load(path: string): Promise<TemplatePack> {
    const content = await readFile(path, "utf8");
    const document: unknown = parse(content);

    return parseTemplatePack(document);
  }
}

function parseTemplatePack(document: unknown): TemplatePack {
  const issues: TemplatePackValidationIssue[] = [];
  const pack = recordAt(document, "", issues);
  const id = stringAt(pack, "id", "id", issues);
  const version = stringAt(pack, "version", "version", issues);
  const base = parseExtends(pack, issues);
  const templates = parseTemplates(pack, issues);

  const hasDuplicateTemplateIds = issues.some(
    (issue) => issue.message === "template id must be unique.",
  );

  if (issues.length > 0) {
    throw new TemplatePackValidationError(
      issues,
      hasDuplicateTemplateIds ? "TEMPLATE005" : "TEMPLATE002",
    );
  }

  return {
    id: id as string,
    version: version as string,
    ...(base !== undefined ? { extends: base } : {}),
    templates: templates as readonly TemplateDefinition[],
  };
}

/**
 * `extends` is absent from every pack that stands alone, so a missing key means
 * "borrows nothing" rather than an invalid manifest. A present but malformed one
 * is still an error.
 */
function parseExtends(
  pack: Record<string, unknown> | undefined,
  issues: TemplatePackValidationIssue[],
): TemplatePackReference | undefined {
  const value = pack?.extends;

  if (value === undefined) {
    return undefined;
  }

  const reference = recordAt(value, "extends", issues);
  const id = stringAt(reference, "id", "extends.id", issues);
  const version = stringAt(reference, "version", "extends.version", issues);

  if (id === undefined || version === undefined) {
    return undefined;
  }

  return { id, version };
}

function parseTemplates(
  pack: Record<string, unknown> | undefined,
  issues: TemplatePackValidationIssue[],
): readonly TemplateDefinition[] | undefined {
  const value = pack?.templates;

  if (!Array.isArray(value)) {
    issues.push({ path: "templates", message: "must be an array." });
    return undefined;
  }

  const templates: TemplateDefinition[] = [];
  const seenTemplateIds = new Set<string>();

  value.forEach((entry, index) => {
    const path = `templates[${index}]`;
    const definition = recordAt(entry, path, issues);
    const id = stringAt(definition, "id", `${path}.id`, issues);
    const module = stringAt(definition, "module", `${path}.module`, issues);
    const template = stringAt(definition, "template", `${path}.template`, issues);
    const output = stringAt(definition, "output", `${path}.output`, issues);

    if (id !== undefined) {
      if (seenTemplateIds.has(id)) {
        issues.push({ path: `${path}.id`, message: "template id must be unique." });
      } else {
        seenTemplateIds.add(id);
      }
    }

    if (id !== undefined && module !== undefined && template !== undefined && output !== undefined) {
      if (!isSafeTemplatePath(template)) {
        issues.push({ path: `${path}.template`, message: "must be a relative, non-absolute path without traversal." });
      }

      try {
        validateOutputPattern(output);
      } catch {
        issues.push({
          path: `${path}.output`,
          message: "must be a structurally safe output pattern.",
        });
      }

      templates.push({ id, module, template, output });
    }
  });

  return templates;
}

function recordAt(
  value: unknown,
  path: string,
  issues: TemplatePackValidationIssue[],
): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  issues.push({ path: path || "/", message: "must be an object." });
  return undefined;
}

function stringAt(
  record: Record<string, unknown> | undefined,
  key: string,
  path: string,
  issues: TemplatePackValidationIssue[],
): string | undefined {
  const value = record?.[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  issues.push({ path, message: "must be a non-empty string." });
  return undefined;
}

function isSafeTemplatePath(value: string): boolean {
  if (value.trim().length === 0) {
    return false;
  }

  if (value.includes("\\")) {
    return false;
  }

  if (value.startsWith("/")) {
    return false;
  }

  if (value.includes("..")) {
    return false;
  }

  return !/^[A-Za-z]:/.test(value);
}

