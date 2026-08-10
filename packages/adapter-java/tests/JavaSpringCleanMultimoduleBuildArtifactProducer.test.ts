import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleBuildArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleBuildArtifactProducer", () => {
  it("produces the deterministic Maven reactor, CI workflow and repository files", () => {
    const producer = new JavaSpringCleanMultimoduleBuildArtifactProducer();
    const artifacts = producer.produce({
      application: {
        schemaVersion: "1.0",
        name: "wallet-service",
        namespace: "io.github.jtsato.walletservice",
        entities: [{
          name: "Wallet",
          attributes: [{ name: "id", type: "uuid", identifier: true, required: true }],
        }],
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
          artifactId: "wallet-service", version: "0.1.0-SNAPSHOT", name: "wallet-service",
          modules: ["core", "entrypoints/rest", "infra/database", "configuration"], javaVersion: "25", archUnitVersion: "1.4.1", springdocOpenapiVersion: "3.0.3",
          querydslVersion: "5.1.0", jakartaPersistenceVersion: "3.2.0", jakartaAnnotationVersion: "3.0.0", expresslyVersion: "5.0.0", jacocoVersion: "0.8.15",
          managedDependencies: [
            { groupId: "${project.groupId}", artifactId: "wallet-service-core", version: "${project.version}" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-entrypoints-rest", version: "${project.version}" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-infra-database", version: "${project.version}" },
            { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui", version: "${springdoc-openapi.version}" },
            { groupId: "com.querydsl", artifactId: "querydsl-jpa", version: "${querydsl.version}", classifier: "jakarta" },
            { groupId: "com.tngtech.archunit", artifactId: "archunit-junit5", version: "${archunit.version}" },
            { groupId: "org.glassfish.expressly", artifactId: "expressly", version: "${expressly.version}" },
          ],
          sharedDependencies: [
            { groupId: "org.junit.jupiter", artifactId: "junit-jupiter", scope: "test" },
          ],
        }, outputVariables: {},
      },
      {
        templateId: "core-pom",
        model: {
          modelVersion: "4.0.0", parentGroupId: "io.github.jtsato", parentArtifactId: "wallet-service",
          parentVersion: "0.1.0-SNAPSHOT", parentRelativePath: "../pom.xml", artifactId: "wallet-service-core",
          packaging: "jar", dependencies: [
            { groupId: "jakarta.validation", artifactId: "jakarta.validation-api" },
            { groupId: "org.hibernate.validator", artifactId: "hibernate-validator", scope: "runtime" },
            { groupId: "org.glassfish.expressly", artifactId: "expressly", scope: "runtime" },
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
            { groupId: "${project.groupId}", artifactId: "wallet-service-core" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-web" },
            { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-webmvc-test", scope: "test" },
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
            { groupId: "${project.groupId}", artifactId: "wallet-service-core" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-jpa" },
            { groupId: "com.querydsl", artifactId: "querydsl-jpa", classifier: "jakarta" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-jpa-test", scope: "test" },
            { groupId: "com.h2database", artifactId: "h2", scope: "test" },
          ],
          querydslAnnotationProcessing: true,
        }, outputVariables: {},
      },
      {
        templateId: "configuration-pom",
        model: {
          modelVersion: "4.0.0", parentGroupId: "io.github.jtsato", parentArtifactId: "wallet-service",
          parentVersion: "0.1.0-SNAPSHOT", parentRelativePath: "../pom.xml", artifactId: "wallet-service-configuration",
          packaging: "jar", hasSpringBootPlugin: true,
          dependencies: [
            { groupId: "${project.groupId}", artifactId: "wallet-service-core" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-entrypoints-rest" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-infra-database" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-validation" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
            { groupId: "com.h2database", artifactId: "h2", scope: "runtime" },
            { groupId: "com.tngtech.archunit", artifactId: "archunit-junit5", scope: "test" },
          ],
          finalName: "wallet-service-starter",
        }, outputVariables: {},
      },
      {
        templateId: "build-github-actions-java-ci",
        model: {
          javaVersion: "25",
          checkoutActionRef: "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1",
          setupJavaActionRef: "actions/setup-java@c1e323688fd81a25caa38c78aa6df2d33d3e20d9 # v4.8.0",
          sonarProjectKey: "wallet-service",
        }, outputVariables: {},
      },
      {
        templateId: "build-gitignore",
        model: {}, outputVariables: {},
      },
      {
        templateId: "build-readme",
        model: {
          applicationName: "wallet-service", groupId: "io.github.jtsato", artifactId: "wallet-service",
          version: "0.1.0-SNAPSHOT", javaVersion: "25", springBootVersion: "4.1.0",
          modules: ["core", "entrypoints/rest", "infra/database", "configuration"],
          resources: [{ entityName: "Wallet", collectionPath: "/wallets" }],
        }, outputVariables: {},
      },
    ]);
  });
});
