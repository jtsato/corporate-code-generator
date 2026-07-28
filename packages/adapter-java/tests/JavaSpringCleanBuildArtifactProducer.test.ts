import { describe, expect, it } from "vitest";
import { JavaSpringCleanBuildArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanBuildArtifactProducer", () => {
  it("produces a deterministic Maven POM invocation", () => {
    const producer = new JavaSpringCleanBuildArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [],
      },
      profile: {
        id: "java-spring-clean",
        version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean", version: "0.1.0" },
        modules: [{ id: "build", requires: [] }],
      },
      modules: [{ id: "build", requires: [] }],
    });

    expect(producer.profileId).toBe("java-spring-clean");
    expect(producer.moduleId).toBe("build");
    expect(artifacts).toEqual([{
      templateId: "maven-pom",
      model: {
        modelVersion: "4.0.0",
        groupId: "io.github.jtsato",
        artifactId: "wallet-service",
        version: "0.1.0-SNAPSHOT",
        javaVersion: "25",
        mavenCompilerPluginVersion: "3.14.0",
        springBootVersion: "4.1.0",
      },
      outputVariables: {},
    }]);
  });

  it("fails clearly when groupId cannot be derived", () => {
    expect(() => new JavaSpringCleanBuildArtifactProducer().produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "walletservice", entities: [] },
      profile: {
        id: "java-spring-clean", version: "0.1.0",
        technology: { language: "java", languageVersion: "25" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean", version: "0.1.0" }, modules: [],
      },
      modules: [],
    })).toThrow("namespace must contain at least two non-empty segments");
  });
});
