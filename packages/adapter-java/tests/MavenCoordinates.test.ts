import { describe, expect, it } from "vitest";
import { deriveMavenGroupId } from "../src/index.js";
import {
  integrationTestProfileId,
  testcontainersDatabaseImage,
} from "../src/maven/IntegrationTestingContract.js";

describe("deriveMavenGroupId", () => {
  it("drops the last namespace segment", () => {
    expect(deriveMavenGroupId("com.acme.platform.wallet")).toBe(
      "com.acme.platform",
    );
  });

  it("accepts the minimum of two segments", () => {
    expect(deriveMavenGroupId("com.wallet")).toBe("com");
  });

  it("rejects a missing namespace", () => {
    expect(() => deriveMavenGroupId(undefined)).toThrow(
      "Maven project generation requires an application namespace.",
    );
  });

  it("rejects a single-segment namespace", () => {
    expect(() => deriveMavenGroupId("wallet")).toThrow(
      "Cannot derive Maven groupId from namespace 'wallet': namespace must contain at least two non-empty segments.",
    );
  });

  it("rejects a namespace with an empty segment", () => {
    expect(() => deriveMavenGroupId("com..wallet")).toThrow(
      "Cannot derive Maven groupId from namespace 'com..wallet': namespace must contain at least two non-empty segments.",
    );
  });
});

describe("integration testing contract", () => {
  it("pins the Maven profile and the container image shared by both producers", () => {
    expect(integrationTestProfileId).toBe("integration-test");
    expect(testcontainersDatabaseImage).toBe("postgres:18-alpine");
  });
});
