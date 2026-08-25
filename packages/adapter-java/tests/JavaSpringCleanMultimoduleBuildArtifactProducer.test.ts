import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleBuildArtifactProducer } from "../src/index.js";

// Both run-script artifacts render from the same model, so the expectation is
// declared once rather than duplicated per platform.
const developerScriptModel = {
  applicationName: "wallet-service",
  defaultTaskName: "verify",
  tasks: [
    { name: "app", description: "Run the application locally", mavenArguments: "spring-boot:run -pl configuration -am" },
    { name: "test", description: "Run the unit and slice tests", mavenArguments: "test" },
    { name: "verify", description: "Full build with coverage", mavenArguments: "clean verify" },
    { name: "mutation", description: "Mutation testing (PIT) on core", mavenArguments: "-P mutation -pl core verify" },
    { name: "integration", description: "Database integration tests (needs Docker)", mavenArguments: "-P integration-test -pl infra/database -am verify" },
  ],
};

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
          querydslVersion: "7.0", jakartaPersistenceVersion: "3.2.0", jakartaAnnotationVersion: "3.0.0", expresslyVersion: "5.0.0", jacocoVersion: "0.8.15",
          coverageLineMinimum: "0.80", pitestVersion: "1.25.9", pitestJunit5PluginVersion: "1.2.3",
          managedDependencies: [
            { groupId: "${project.groupId}", artifactId: "wallet-service-core", version: "${project.version}" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-entrypoints-rest", version: "${project.version}" },
            { groupId: "${project.groupId}", artifactId: "wallet-service-infra-database", version: "${project.version}" },
            { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui", version: "${springdoc-openapi.version}" },
            { groupId: "io.github.openfeign.querydsl", artifactId: "querydsl-jpa", version: "${openfeign-querydsl.version}" },
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
          mutationTesting: {
            profileId: "mutation",
            targetClasses: ["io.github.jtsato.walletservice.core.*UseCaseInteractor"],
            targetTests: ["io.github.jtsato.walletservice.core.*"],
            outputFormats: ["HTML", "XML"],
            timestampedReports: false,
          },
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
            { groupId: "io.github.openfeign.querydsl", artifactId: "querydsl-jpa" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-jpa-test", scope: "test" },
            { groupId: "com.h2database", artifactId: "h2", scope: "test" },
            { groupId: "org.testcontainers", artifactId: "testcontainers-junit-jupiter", scope: "test" },
            { groupId: "org.testcontainers", artifactId: "testcontainers-postgresql", scope: "test" },
            { groupId: "org.postgresql", artifactId: "postgresql", scope: "test" },
          ],
          querydslAnnotationProcessing: true,
          integrationTesting: { profileId: "integration-test" },
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
            { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-actuator" },
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
          mutationCommand: "mvn -B -P mutation -pl core verify",
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
          containerImageReference: "wallet-service:0.1.0-SNAPSHOT",
          containerServerPort: 8080,
          containerHealthPath: "/actuator/health",
          containerUserId: 10001,
          containerGroupId: 10001,
          mutationCommand: "mvn -P mutation -pl core verify",
          mutationReportPath: "core/target/pit-reports",
        }, outputVariables: {},
      },
      {
        templateId: "build-dockerfile",
        model: {
          builderImage: "maven:3.9-eclipse-temurin-25-alpine",
          runtimeImage: "eclipse-temurin:25-jre-alpine",
          buildWorkingDirectory: "/build",
          runtimeWorkingDirectory: "/app",
          modulePomCopies: [
            { source: "core/pom.xml", destination: "core/" },
            { source: "entrypoints/rest/pom.xml", destination: "entrypoints/rest/" },
            { source: "infra/database/pom.xml", destination: "infra/database/" },
            { source: "configuration/pom.xml", destination: "configuration/" },
          ],
          resolvePluginsCommand: "mvn -B dependency:resolve-plugins",
          packageCommand: "mvn -B -DskipTests -pl configuration -am package",
          builtJarPath: "/build/configuration/target/wallet-service-starter.jar",
          runtimeJarPath: "/app/application.jar",
          javaToolOptions: "-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC",
          serverPort: 8080,
          runtimeUserName: "spring",
          runtimeUserId: 10001,
          runtimeGroupName: "spring",
          runtimeGroupId: 10001,
          healthcheckInterval: "30s",
          healthcheckTimeout: "5s",
          healthcheckStartPeriod: "30s",
          healthcheckRetries: 3,
          healthcheckUrl: "http://localhost:8080/actuator/health",
        }, outputVariables: {},
      },
      {
        templateId: "build-dockerignore",
        model: {}, outputVariables: {},
      },
      {
        templateId: "build-docker-compose",
        model: {
          serviceName: "app",
          buildContext: ".",
          dockerfile: "Dockerfile",
          imageName: "wallet-service",
          imageTag: "0.1.0-SNAPSHOT",
          hostPort: 8080,
          containerPort: 8080,
          restartPolicy: "unless-stopped",
        }, outputVariables: {},
      },
      {
        templateId: "build-run-script-posix",
        model: developerScriptModel, outputVariables: {},
      },
      {
        templateId: "build-run-script-windows",
        model: developerScriptModel, outputVariables: {},
      },
      {
        templateId: "build-smoke-requests",
        model: {
          applicationName: "wallet-service",
          baseUrlVariableName: "baseUrl",
          baseUrl: "http://localhost:8080",
          healthPath: "/actuator/health",
          openApiPath: "/v3/api-docs",
          resources: [{
            entityName: "Wallet",
            collectionPath: "/wallets",
            identifierValue: "11111111-1111-1111-1111-111111111112",
            createFields: [
              { name: "id", jsonLiteral: '"11111111-1111-1111-1111-111111111112"' },
            ],
            replaceFields: [
              { name: "id", jsonLiteral: '"11111111-1111-1111-1111-111111111113"' },
            ],
            // This fixture's entity has only an identifier, and PATCH omits it,
            // so there is nothing left to send.
            patchFields: [],
          }],
        }, outputVariables: {},
      },
    ]);
  });
});
