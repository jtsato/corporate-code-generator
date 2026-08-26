import { describe, expect, it } from "vitest";

import { OptionResolutionError, OptionResolver, type ProfileOption } from "../src/index.js";

const persistence: ProfileOption = {
  id: "persistence",
  values: ["memory", "typeorm"],
  defaultValue: "memory",
};

function issueCodes(action: () => unknown): readonly string[] {
  try {
    action();
  } catch (error) {
    return (error as OptionResolutionError).issues.map((issue) => issue.code);
  }
  throw new Error("Expected option resolution to fail.");
}

describe("OptionResolver", () => {
  it("fills in the declared default for an option nobody selected", () => {
    const resolved = new OptionResolver().resolve([persistence], new Map());

    // Present rather than absent, so a producer reading a declared option never
    // has to invent a fallback of its own.
    expect(resolved.get("persistence")).toBe("memory");
    expect([...resolved.keys()]).toEqual(["persistence"]);
  });

  it("keeps the selected value over the default", () => {
    const resolved = new OptionResolver().resolve([persistence], new Map([["persistence", "typeorm"]]));

    expect(resolved.get("persistence")).toBe("typeorm");
  });

  it("resolves to an empty set when the profile declares no options", () => {
    expect([...new OptionResolver().resolve([], new Map())]).toEqual([]);
  });

  it("names the allowed values when rejecting a value", () => {
    expect(() => new OptionResolver().resolve([persistence], new Map([["persistence", "sqlite"]])))
      .toThrow(OptionResolutionError);

    const issues = issueCodes(() =>
      new OptionResolver().resolve([persistence], new Map([["persistence", "sqlite"]])));
    expect(issues).toEqual(["OPTION004"]);

    try {
      new OptionResolver().resolve([persistence], new Map([["persistence", "sqlite"]]));
    } catch (error) {
      // An operator who guessed wrong should not have to open the profile.
      expect((error as OptionResolutionError).issues[0]?.message).toContain("memory, typeorm");
    }
  });

  it("rejects an option the profile does not declare", () => {
    expect(issueCodes(() => new OptionResolver().resolve([persistence], new Map([["database", "postgres"]]))))
      .toEqual(["OPTION003"]);
  });

  it("rejects a duplicated option and a default outside its own values", () => {
    expect(issueCodes(() => new OptionResolver().resolve([persistence, persistence], new Map())))
      .toEqual(["OPTION001"]);

    expect(issueCodes(() => new OptionResolver().resolve(
      [{ id: "persistence", values: ["memory"], defaultValue: "typeorm" }],
      new Map(),
    ))).toEqual(["OPTION002"]);
  });

  it("reports every faulty assignment at once", () => {
    // Fixing one flag per run is a poor loop, and the same reasoning the
    // generated environment validator follows.
    const codes = issueCodes(() => new OptionResolver().resolve(
      [persistence],
      new Map([["persistence", "sqlite"], ["database", "postgres"]]),
    ));

    expect(codes).toEqual(["OPTION004", "OPTION003"]);
  });
});
