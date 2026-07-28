import type { Module } from "./Module.js";
import {
  ModuleResolutionError,
  type ModuleResolutionIssue,
} from "./ModuleResolutionError.js";

export class ModuleResolver {
  public resolveAll(
    modules: readonly Module[],
  ): readonly Module[] {
    return this.resolve(modules, modules.map((module) => module.id));
  }

  public resolveSelected(
    modules: readonly Module[],
    requestedModuleIds: readonly string[],
  ): readonly Module[] {
    return this.resolve(modules, requestedModuleIds);
  }

  private resolve(
    modules: readonly Module[],
    requestedModuleIds: readonly string[],
  ): readonly Module[] {
    const modulesById = new Map<string, Module>();
    const issues: ModuleResolutionIssue[] = [];

    for (const module of modules) {
      if (modulesById.has(module.id)) {
        issues.push({
          code: "MODULE001",
          message: `Duplicate module '${module.id}'.`,
          moduleId: module.id,
        });
        continue;
      }

      modulesById.set(module.id, module);
    }

    for (const module of modules) {
      for (const requiredModuleId of module.requires) {
        if (!modulesById.has(requiredModuleId)) {
          issues.push({
            code: "MODULE002",
            message:
              `Module '${module.id}' requires unknown module ` +
              `'${requiredModuleId}'.`,
            moduleId: module.id,
          });
        }
      }
    }

    for (const requestedModuleId of requestedModuleIds) {
      if (!modulesById.has(requestedModuleId)) {
        issues.push({
          code: "MODULE004",
          message: `Requested module '${requestedModuleId}' does not exist.`,
          moduleId: requestedModuleId,
        });
      }
    }

    if (issues.length > 0) {
      throw new ModuleResolutionError(issues);
    }

    const states = new Map<string, "visiting" | "visited">();
    const resolved: Module[] = [];
    const stack: string[] = [];

    const visit = (moduleId: string): void => {
      const state = states.get(moduleId);

      if (state === "visited") {
        return;
      }

      if (state === "visiting") {
        const cycle = [
          ...stack.slice(stack.indexOf(moduleId)),
          moduleId,
        ];

        throw new ModuleResolutionError([
          {
            code: "MODULE003",
            message: `Circular module dependency: ${cycle.join(" -> ")}.`,
            moduleId,
          },
        ]);
      }

      const module = modulesById.get(moduleId);

      if (module === undefined) {
        throw new Error(`Module '${moduleId}' is not available.`);
      }

      states.set(moduleId, "visiting");
      stack.push(moduleId);

      for (const requiredModuleId of module.requires) {
        visit(requiredModuleId);
      }

      stack.pop();
      states.set(moduleId, "visited");
      resolved.push(module);
    };

    for (const requestedModuleId of requestedModuleIds) {
      visit(requestedModuleId);
    }

    return resolved;
  }
}
