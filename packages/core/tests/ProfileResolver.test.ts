import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ProfileIdentifierMismatchError,
  ProfileNotFoundError,
  ProfileResolver,
} from "../src/index.js";

const profileRoot = dirname(dirname(fileURLToPath(new URL(
  "./fixtures/profile-root/mismatch/profile.yaml",
  import.meta.url,
))));

describe("ProfileResolver", () => {
  it("should report a profile that does not exist", async () => {
    const resolver = new ProfileResolver(profileRoot);

    await expect(resolver.resolve("missing"))
      .rejects.toBeInstanceOf(ProfileNotFoundError);
  });

  it("should reject a manifest whose identifier differs from the request", async () => {
    const resolver = new ProfileResolver(profileRoot);

    await expect(resolver.resolve("mismatch"))
      .rejects.toBeInstanceOf(ProfileIdentifierMismatchError);
  });
});
