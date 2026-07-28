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
      templatePack: {
        id: "java-spring-clean",
        version: "0.1.0",
      },
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
});

function fixturePath(fileName: string): string {
  return fileURLToPath(new URL(
    `./fixtures/profiles/${fileName}`,
    import.meta.url,
  ));
}
