import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleBuildArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleBuildArtifactProducer", () => {
  it("produces the five deterministic Maven reactor invocations", () => {
    const producer = new JavaSpringCleanMultimoduleBuildArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [],
      },
      profile: {
        id: "java-spring-clean-multimodule",
        version: "0.1.0",
        technology: { language: "java", languageVersion: "25", framework: "spring-boot" },
        architecture: { style: "clean-architecture" },
        templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" },
        modules: [{ id: "build", requires: [] }],
      },
      modules: [{ id: "build", requires: [] }],
    });

    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("build");
    expect(artifacts).toEqual([
      {
        templateId: "parent-pom",
        model: {
          modelVersion: "4.0.0", springBootVersion: "4.1.0", groupId: "io.github.jtsato",
          artifactId: "wallet-service", version: "0.1.0-SNAPSHOT",
          modules: ["core", "entrypoints/rest", "infra/database", "configuration"], javaVersion: "25", archUnitVersion: "1.4.1", springdocOpenapiVersion: "3.0.3",
        }, outputVariables: {},
      },
      {
        templateId: "core-pom",
        model: {
          modelVersion: "4.0.0", parentGroupId: "io.github.jtsato", parentArtifactId: "wallet-service",
          parentVersion: "0.1.0-SNAPSHOT", parentRelativePath: "../pom.xml", artifactId: "wallet-service-core",
          packaging: "jar", dependencies: [
            { groupId: "jakarta.validation", artifactId: "jakarta.validation-api" },
            { groupId: "org.hibernate.validator", artifactId: "hibernate-validator", scope: "test" },
            { groupId: "org.junit.jupiter", artifactId: "junit-jupiter", scope: "test" },
          ], hasSpringBootPlugin: false,
        }, outputVariables: {},
      },
      {
        templateId: "entrypoints-rest-pom",
        model: {
          modelVersion: "4.0.0", parentGroupId: "io.github.jtsato", parentArtifactId: "wallet-service",
          parentVersion: "0.1.0-SNAPSHOT", parentRelativePath: "../../pom.xml", artifactId: "wallet-service-entrypoints-rest",
          packaging: "jar", hasSpringBootPlugin: false,
          dependencies: [
            { groupId: "${project.groupId}", artifactId: "wallet-service-core", version: "${project.version}" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-web" },
            { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui", version: "${springdoc-openapi.version}" },
          ],
        }, outputVariables: {},
      },
      {
        templateId: "infra-database-pom",
        model: {
          modelVersion: "4.0.0", parentGroupId: "io.github.jtsato", parentArtifactId: "wallet-service",
          parentVersion: "0.1.0-SNAPSHOT", parentRelativePath: "../../pom.xml", artifactId: "wallet-service-infra-database",
          packaging: "jar", hasSpringBootPlugin: false,
          dependencies: [
            { groupId: "${project.groupId}", artifactId: "wallet-service-core", version: "${project.version}" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-jpa" },
          ],
        }, outputVariables: {},
      },
      {
        templateId: "configuration-pom",
        model: {
          modelVersion: "4.0.0", parentGroupId: "io.github.jtsato", parentArtifactId: "wallet-service",
          parentVersion: "0.1.0-SNAPSHOT", parentRelativePath: "../pom.xml", artifactId: "wallet-service-configuration",
          packaging: "jar", hasSpringBootPlugin: true,
          dependencies: [
            { groupId: "${project.groupId}", artifactId: "wallet-service-core", version: "${project.version}" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-entrypoints-rest", version: "${project.version}" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-infra-database", version: "${project.version}" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-validation" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
            { groupId: "com.h2database", artifactId: "h2", scope: "test" },
            { groupId: "com.tngtech.archunit", artifactId: "archunit-junit5", version: "${archunit.version}", scope: "test" },
          ],
        }, outputVariables: {},
      },
    ]);
  });
});
