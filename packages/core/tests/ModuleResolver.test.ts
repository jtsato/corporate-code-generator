import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ModuleResolutionError,
  ModuleResolver,
  type Module,
} from "../src/index.js";

describe("ModuleResolver", () => {
  it("should resolve all modules in deterministic dependency order", () => {
    const modules: readonly Module[] = [
      { id: "api-rest", requires: ["application"] },
      { id: "application", requires: ["domain"] },
      { id: "domain", requires: [] },
    ];

    const resolved = new ModuleResolver().resolveAll(modules);

    expect(resolved.map((module) => module.id)).toEqual([
      "domain",
      "application",
      "api-rest",
    ]);
  });

  it("should resolve requested modules and their transitive requirements", () => {
    const modules: readonly Module[] = [
      { id: "api-rest", requires: ["application"] },
      { id: "application", requires: ["domain"] },
      { id: "domain", requires: [] },
    ];

    const resolved = new ModuleResolver().resolveSelected(
      modules,
      ["api-rest"],
    );

    expect(resolved.map((module) => module.id)).toEqual([
      "domain",
      "application",
      "api-rest",
    ]);
  });

  it("should reject duplicate module identifiers", () => {
    expectResolutionIssue(
      [
        { id: "domain", requires: [] },
        { id: "domain", requires: [] },
      ],
      [],
      "MODULE001",
    );
  });

  it("should reject modules with an unknown requirement", () => {
    expectResolutionIssue(
      [{ id: "api-rest", requires: ["application"] }],
      [],
      "MODULE002",
    );
  });

  it("should reject circular module requirements", () => {
    expectResolutionIssue(
      [
        { id: "application", requires: ["domain"] },
        { id: "domain", requires: ["application"] },
      ],
      ["application"],
      "MODULE003",
    );
  });

  it("should reject a requested module that does not exist", () => {
    expectResolutionIssue([], ["domain"], "MODULE004");
  });
});

function expectResolutionIssue(
  modules: readonly Module[],
  requestedModuleIds: readonly string[],
  expectedCode: string,
): void {
  try {
    new ModuleResolver().resolveSelected(modules, requestedModuleIds);
    expect.fail("Expected module resolution to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(ModuleResolutionError);
    expect((error as ModuleResolutionError).issues[0]?.code)
      .toBe(expectedCode);
  }
}
