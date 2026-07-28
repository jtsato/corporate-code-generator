import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FilePlan,
  FilePlanValidationError,
} from "../src/index.js";

describe("FilePlan", () => {
  it("should create an ordered plan of create operations", () => {
    const plan = FilePlan.create([
      {
        kind: "CREATE",
        targetPath: "src/Wallet.java",
        content: "public class Wallet {}",
      },
      {
        kind: "CREATE",
        targetPath: "src/Balance.java",
        content: "public class Balance {}",
      },
    ]);

    expect(plan.operations).toEqual([
      {
        kind: "CREATE",
        targetPath: "src/Wallet.java",
        content: "public class Wallet {}",
      },
      {
        kind: "CREATE",
        targetPath: "src/Balance.java",
        content: "public class Balance {}",
      },
    ]);
  });

  it("should expose immutable file plan operations", () => {
    const plan = FilePlan.create([
      {
        kind: "CREATE",
        targetPath: "src/Wallet.java",
        content: "public class Wallet {}",
      },
    ]);

    expect(Object.isFrozen(plan.operations)).toBe(true);
  });

  it("should reject an empty target path", () => {
    expect(() => FilePlan.create([
      {
        kind: "CREATE",
        targetPath: "   ",
        content: "content",
      },
    ])).toThrow(FilePlanValidationError);

    try {
      FilePlan.create([
        {
          kind: "CREATE",
          targetPath: "   ",
          content: "content",
        },
      ]);
      expect.fail("Expected file plan validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(FilePlanValidationError);
      expect(
        (error as FilePlanValidationError).issues,
      ).toEqual([
        {
          code: "FILEPLAN001",
          message: "File operation target path must not be empty.",
          operationIndex: 0,
        },
      ]);
    }
  });

  it("should reject duplicate target paths", () => {
    expect(() => FilePlan.create([
      {
        kind: "CREATE",
        targetPath: "src/Wallet.java",
        content: "first",
      },
      {
        kind: "CREATE",
        targetPath: "src/Wallet.java",
        content: "second",
      },
    ])).toThrow(FilePlanValidationError);

    try {
      FilePlan.create([
        {
          kind: "CREATE",
          targetPath: "src/Wallet.java",
          content: "first",
        },
        {
          kind: "CREATE",
          targetPath: "src/Wallet.java",
          content: "second",
        },
      ]);
      expect.fail("Expected file plan validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(FilePlanValidationError);
      expect(
        (error as FilePlanValidationError).issues,
      ).toEqual([
        {
          code: "FILEPLAN002",
          message:
            "Multiple file operations target 'src/Wallet.java'.",
          operationIndex: 1,
        },
      ]);
    }
  });

  it.each(["/absolute.txt", "C:/absolute.txt", "nested\\file.txt", "../escape.txt", "nested/../escape.txt", "./file.txt"])(
    "should reject unsafe target path %s",
    (targetPath) => {
      expect(() => FilePlan.create([{ kind: "CREATE", targetPath, content: "x" }])).toThrowError(
        expect.objectContaining({ issues: [expect.objectContaining({ code: "FILEPLAN003" })] }),
      );
    },
  );
});
