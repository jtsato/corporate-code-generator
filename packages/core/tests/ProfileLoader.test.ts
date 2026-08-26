import { fileURLToPath } from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ProfileLoader,
  ProfileValidationError,
} from "../src/index.js";

describe("ProfileLoader", () => {
  it("should load a valid declarative profile", async () => {
    const loader = new ProfileLoader();
    const profile = await loader.load(fixturePath("valid-profile.yaml"));

    expect(profile).toEqual({
      id: "test-profile",
      version: "1.0.0",
      technology: {
        language: "java",
        languageVersion: "25",
        framework: "spring-boot",
      },
      architecture: {
        style: "clean-architecture",
      },
      templatePack: {
        id: "java-spring-clean",
        version: "0.1.0",
      },
      modules: [
        {
          id: "domain",
          requires: [],
        },
      ],
      // A profile that declares no options loads as declaring none, rather than
      // failing: every profile written before the option mechanism existed is
      // still valid.
      options: [],
    });
  });

  it("should reject an invalid profile manifest", async () => {
    const loader = new ProfileLoader();

    await expect(loader.load(fixturePath("invalid-profile.yaml")))
      .rejects.toBeInstanceOf(ProfileValidationError);

    try {
      await loader.load(fixturePath("invalid-profile.yaml"));
      expect.fail("Expected profile validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ProfileValidationError);
      expect((error as ProfileValidationError).code).toBe("PROFILE002");
      expect((error as ProfileValidationError).issues).toEqual([
        {
          path: "technology.languageVersion",
          message: "must be a non-empty string.",
        },
        {
          path: "modules[0].requires[0]",
          message: "must be a non-empty string.",
        },
      ]);
    }
  });

  it("should reject malformed option declarations", async () => {
    // `options` may be absent, but a present one is validated like everything
    // else: a profile that declares an option nobody could satisfy is a defect
    // in the profile, not a run-time surprise for whoever generates from it.
    try {
      await new ProfileLoader().load(fixturePath("invalid-options-profile.yaml"));
      expect.fail("Expected profile validation to fail.");
    } catch (error) {
      expect((error as ProfileValidationError).issues).toEqual([
        { path: "options[0].values", message: "must not be empty." },
        { path: "options[1].id", message: "must be a non-empty string." },
      ]);
    }
  });
});

function fixturePath(fileName: string): string {
  return fileURLToPath(new URL(
    `./fixtures/profiles/${fileName}`,
    import.meta.url,
  ));
}
