import {
  describe,
  expect,
  it,
} from "vitest";

import { validateFilePlanTargetPath } from "../src/index.js";

describe("validateFilePlanTargetPath", () => {
  it("should accept a relative POSIX path", () => {
    expect(validateFilePlanTargetPath("src/main/java/Wallet.java"))
      .toBeUndefined();
  });

  it("should accept a path whose drive-letter pattern is not at the start", () => {
    expect(validateFilePlanTargetPath("src/a:b/Wallet.java")).toBeUndefined();
  });

  it("should reject a blank path", () => {
    expect(validateFilePlanTargetPath("   ")).toBe(
      "File operation target path must not be empty.",
    );
  });

  it("should reject a POSIX absolute path", () => {
    expect(validateFilePlanTargetPath("/src/Wallet.java")).toBe(
      "File operation target path must be relative.",
    );
  });

  it("should reject a Windows absolute path", () => {
    expect(validateFilePlanTargetPath("C:/src/Wallet.java")).toBe(
      "File operation target path must be relative.",
    );
  });

  it("should reject a path with Windows separators", () => {
    expect(validateFilePlanTargetPath("src\\Wallet.java")).toBe(
      "File operation target path must use POSIX separators.",
    );
  });

  it.each([
    "../Wallet.java",
    "src/../Wallet.java",
    "./Wallet.java",
  ])("should reject the traversal path %s", (targetPath) => {
    expect(validateFilePlanTargetPath(targetPath)).toBe(
      "File operation target path must not contain traversal segments.",
    );
  });
});
