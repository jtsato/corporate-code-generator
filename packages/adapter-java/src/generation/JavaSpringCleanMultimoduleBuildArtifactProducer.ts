import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { deriveMavenGroupId } from "../maven/MavenCoordinates.js";
import type { DockerComposeTemplateModel } from "../model/DockerComposeTemplateModel.js";
import type {
  DockerfileModulePomCopy,
  DockerfileTemplateModel,
} from "../model/DockerfileTemplateModel.js";
import type { GithubActionsJavaCiTemplateModel } from "../model/GithubActionsJavaCiTemplateModel.js";
import type { JavaProjectReadmeTemplateModel } from "../model/JavaProjectReadmeTemplateModel.js";
import type {
  MavenIntegrationTestingTemplateModel,
  MavenMultimoduleModulePomTemplateModel,
  MavenMutationTestingTemplateModel,
} from "../model/MavenMultimoduleModulePomTemplateModel.js";
import { integrationTestProfileId } from "../maven/IntegrationTestingContract.js";
import type { MavenMultimoduleParentPomTemplateModel } from "../model/MavenMultimoduleParentPomTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { springBootVersion } from "../spring/SpringBootVersion.js";
import {
  springActuatorHealthPath,
  springApplicationPort,
  springOpenApiDocumentPath,
} from "../spring/SpringRuntimeContract.js";
import type { JavaProjectDeveloperScriptTemplateModel } from "../model/JavaProjectDeveloperScriptTemplateModel.js";
import { createJavaProjectSmokeRequestsModel } from "../transformers/createJavaProjectSmokeRequestsModel.js";

const archUnitVersion = "1.4.1";
const springdocOpenapiVersion = "3.0.3";
const querydslVersion = "5.1.0";
const jakartaPersistenceVersion = "3.2.0";
const jakartaAnnotationVersion = "3.0.0";
const expresslyVersion = "5.0.0";
const jacocoVersion = "0.8.15";
// PIT must be able to read the bytecode the generated project compiles to.
// 1.19.1 rejects Java 25 classes with "Unsupported class file major version 69";
// 1.25.9 is the first line that parses them.
// Every module measured between 0.872 and 0.917 line coverage, so 0.80 passes
// with margin today. The margin is deliberate: this rule applies to every
// generated project, not only the wallet example, and a model whose generated
// code is shaped differently must not fail a gate calibrated to one sample.
const coverageLineMinimum = "0.80";
const pitestVersion = "1.25.9";
const pitestJunit5PluginVersion = "1.2.3";
// Mutation testing is opt-in through a Maven profile rather than a generator
// option: the configuration is always emitted, but nothing activates it unless
// the profile is named, so `mvn clean verify` never pays for it.
const mutationProfileId = "mutation";
const mutationModuleId = "core";
const mutationMavenArguments = `-P ${mutationProfileId} -pl ${mutationModuleId} verify`;
const mutationCommand = `mvn ${mutationMavenArguments}`;
const mutationCiCommand = `mvn -B ${mutationMavenArguments}`;
const mutationReportPath = `${mutationModuleId}/target/pit-reports`;
const checkoutActionRef = "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1";
const setupJavaActionRef = "actions/setup-java@c1e323688fd81a25caa38c78aa6df2d33d3e20d9 # v4.8.0";
const dockerBuilderMavenVersion = "3.9";
const dockerBuildWorkingDirectory = "/build";
const dockerRuntimeWorkingDirectory = "/app";
const dockerRuntimeJarPath = "/app/application.jar";
const dockerJavaToolOptions = "-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC";
const dockerRuntimeUserName = "spring";
const dockerRuntimeUserId = 10001;
const dockerRuntimeGroupName = "spring";
const dockerRuntimeGroupId = 10001;
const dockerHealthcheckInterval = "30s";
const dockerHealthcheckTimeout = "5s";
const dockerHealthcheckStartPeriod = "30s";
const dockerHealthcheckRetries = 3;
const dockerComposeServiceName = "app";
const dockerComposeRestartPolicy = "unless-stopped";
const dockerfileName = "Dockerfile";
const executableModuleId = "configuration";

export class JavaSpringCleanMultimoduleBuildArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "build";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) {
      throw new Error("Maven project generation requires an application namespace.");
    }
    const groupId = deriveMavenGroupId(namespace);
    const artifactId = request.application.name;
    const version = `${request.profile.version}-SNAPSHOT`;
    const javaVersion = request.profile.technology.languageVersion;
    const executableFinalName = `${artifactId}-starter`;
    const parent: MavenMultimoduleParentPomTemplateModel = {
      modelVersion: "4.0.0",
      springBootVersion,
      groupId,
      artifactId,
      version,
      name: artifactId,
      modules: ["core", "entrypoints/rest", "infra/database", "configuration"],
      javaVersion: request.profile.technology.languageVersion,
      archUnitVersion,
      springdocOpenapiVersion,
      querydslVersion,
      jakartaPersistenceVersion,
      jakartaAnnotationVersion,
      expresslyVersion,
      jacocoVersion,
      coverageLineMinimum,
      pitestVersion,
      pitestJunit5PluginVersion,
      managedDependencies: [
        { groupId: "${project.groupId}", artifactId: `${artifactId}-core`, version: "${project.version}" },
        { groupId: "${project.groupId}", artifactId: `${artifactId}-entrypoints-rest`, version: "${project.version}" },
        { groupId: "${project.groupId}", artifactId: `${artifactId}-infra-database`, version: "${project.version}" },
        { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui", version: "${springdoc-openapi.version}" },
        { groupId: "com.querydsl", artifactId: "querydsl-jpa", version: "${querydsl.version}", classifier: "jakarta" },
        { groupId: "com.tngtech.archunit", artifactId: "archunit-junit5", version: "${archunit.version}" },
        { groupId: "org.glassfish.expressly", artifactId: "expressly", version: "${expressly.version}" },
      ],
      sharedDependencies: [
        { groupId: "org.junit.jupiter", artifactId: "junit-jupiter", scope: "test" },
      ],
    };
    const core = this.modulePom(groupId, artifactId, version, "../pom.xml", `${artifactId}-core`, [
      { groupId: "jakarta.validation", artifactId: "jakarta.validation-api" },
      { groupId: "org.hibernate.validator", artifactId: "hibernate-validator", scope: "runtime" },
      { groupId: "org.glassfish.expressly", artifactId: "expressly", scope: "runtime" },
    ], false, undefined, {
      profileId: mutationProfileId,
      // Decision D4 keeps the `Interactor` suffix, so the PIT target pattern
      // must follow it rather than the reference project's `UseCaseImpl`.
      targetClasses: [`${namespace}.core.*UseCaseInteractor`],
      targetTests: [`${namespace}.core.*`],
      outputFormats: ["HTML", "XML"],
      // Fixed report directory: timestamped subdirectories would make the
      // report path unpredictable for CI and for the generated README.
      timestampedReports: false,
    });
    const entrypointsRest = this.modulePom(groupId, artifactId, version, "../../pom.xml", `${artifactId}-entrypoints-rest`, [
      { groupId: "${project.groupId}", artifactId: `${artifactId}-core` },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-web" },
      { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-webmvc-test", scope: "test" },
    ]);
    const infraDatabase = this.modulePom(groupId, artifactId, version, "../../pom.xml", `${artifactId}-infra-database`, [
      { groupId: "${project.groupId}", artifactId: `${artifactId}-core` },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-jpa" },
      { groupId: "com.querydsl", artifactId: "querydsl-jpa", classifier: "jakarta" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-jpa-test", scope: "test" },
      { groupId: "com.h2database", artifactId: "h2", scope: "test" },
      // Versions come from the Testcontainers BOM that spring-boot-dependencies
      // already imports, so ADR-059's "do not restate Boot-managed versions"
      // rule applies and none of these carry a version.
      { groupId: "org.testcontainers", artifactId: "testcontainers-junit-jupiter", scope: "test" },
      { groupId: "org.testcontainers", artifactId: "testcontainers-postgresql", scope: "test" },
      { groupId: "org.postgresql", artifactId: "postgresql", scope: "test" },
    ], false, undefined, undefined, {
      profileId: integrationTestProfileId,
    });
    const configuration = this.modulePom(groupId, artifactId, version, "../pom.xml", `${artifactId}-configuration`, [
      { groupId: "${project.groupId}", artifactId: `${artifactId}-core` },
      { groupId: "${project.groupId}", artifactId: `${artifactId}-entrypoints-rest` },
      { groupId: "${project.groupId}", artifactId: `${artifactId}-infra-database` },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-validation" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-actuator" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
      { groupId: "com.h2database", artifactId: "h2", scope: "runtime" },
      { groupId: "com.tngtech.archunit", artifactId: "archunit-junit5", scope: "test" },
    ], true, executableFinalName);

    const githubActionsJavaCi: GithubActionsJavaCiTemplateModel = {
      javaVersion,
      checkoutActionRef,
      setupJavaActionRef,
      sonarProjectKey: artifactId,
      mutationCommand: mutationCiCommand,
    };

    const modulePomCopies: readonly DockerfileModulePomCopy[] = parent.modules.map((module) => ({
      source: `${module}/pom.xml`,
      destination: `${module}/`,
    }));

    const dockerfile: DockerfileTemplateModel = {
      builderImage: `maven:${dockerBuilderMavenVersion}-eclipse-temurin-${javaVersion}-alpine`,
      runtimeImage: `eclipse-temurin:${javaVersion}-jre-alpine`,
      buildWorkingDirectory: dockerBuildWorkingDirectory,
      runtimeWorkingDirectory: dockerRuntimeWorkingDirectory,
      modulePomCopies,
      resolvePluginsCommand: "mvn -B dependency:resolve-plugins",
      packageCommand: `mvn -B -DskipTests -pl ${executableModuleId} -am package`,
      builtJarPath:
        `${dockerBuildWorkingDirectory}/${executableModuleId}/target/${executableFinalName}.jar`,
      runtimeJarPath: dockerRuntimeJarPath,
      javaToolOptions: dockerJavaToolOptions,
      serverPort: springApplicationPort,
      runtimeUserName: dockerRuntimeUserName,
      runtimeUserId: dockerRuntimeUserId,
      runtimeGroupName: dockerRuntimeGroupName,
      runtimeGroupId: dockerRuntimeGroupId,
      healthcheckInterval: dockerHealthcheckInterval,
      healthcheckTimeout: dockerHealthcheckTimeout,
      healthcheckStartPeriod: dockerHealthcheckStartPeriod,
      healthcheckRetries: dockerHealthcheckRetries,
      healthcheckUrl: `http://localhost:${springApplicationPort}${springActuatorHealthPath}`,
    };

    const dockerCompose: DockerComposeTemplateModel = {
      serviceName: dockerComposeServiceName,
      buildContext: ".",
      dockerfile: dockerfileName,
      imageName: artifactId,
      imageTag: version,
      hostPort: springApplicationPort,
      containerPort: springApplicationPort,
      restartPolicy: dockerComposeRestartPolicy,
    };

    const developerScript: JavaProjectDeveloperScriptTemplateModel = {
      applicationName: artifactId,
      defaultTaskName: "verify",
      tasks: [
        { name: "app", description: "Run the application locally", mavenArguments: `spring-boot:run -pl ${executableModuleId} -am` },
        { name: "test", description: "Run the unit and slice tests", mavenArguments: "test" },
        { name: "verify", description: "Full build with coverage", mavenArguments: "clean verify" },
        { name: "mutation", description: "Mutation testing (PIT) on core", mavenArguments: mutationMavenArguments },
        { name: "integration", description: "Database integration tests (needs Docker)", mavenArguments: `-P ${integrationTestProfileId} -pl infra/database -am verify` },
      ],
    };

    const smokeRequests = createJavaProjectSmokeRequestsModel(
      request.application,
      `http://localhost:${springApplicationPort}`,
      springActuatorHealthPath,
      springOpenApiDocumentPath,
    );

    const readme: JavaProjectReadmeTemplateModel = {
      applicationName: artifactId,
      groupId,
      artifactId,
      version,
      javaVersion,
      springBootVersion,
      modules: parent.modules,
      resources: request.application.entities.map((entity) => ({
        entityName: toJavaTypeName(entity.name),
        collectionPath: toRestCollectionPath(entity.name),
      })),
      containerImageReference: `${dockerCompose.imageName}:${dockerCompose.imageTag}`,
      containerServerPort: springApplicationPort,
      containerHealthPath: springActuatorHealthPath,
      containerUserId: dockerRuntimeUserId,
      containerGroupId: dockerRuntimeGroupId,
      mutationCommand,
      mutationReportPath,
    };

    return [
      { templateId: "parent-pom", model: parent, outputVariables: {} },
      { templateId: "core-pom", model: core, outputVariables: {} },
      { templateId: "entrypoints-rest-pom", model: entrypointsRest, outputVariables: {} },
      { templateId: "infra-database-pom", model: infraDatabase, outputVariables: {} },
      { templateId: "configuration-pom", model: configuration, outputVariables: {} },
      { templateId: "build-github-actions-java-ci", model: githubActionsJavaCi, outputVariables: {} },
      { templateId: "build-gitignore", model: {}, outputVariables: {} },
      { templateId: "build-readme", model: readme, outputVariables: {} },
      { templateId: "build-dockerfile", model: dockerfile, outputVariables: {} },
      { templateId: "build-dockerignore", model: {}, outputVariables: {} },
      { templateId: "build-docker-compose", model: dockerCompose, outputVariables: {} },
      { templateId: "build-run-script-posix", model: developerScript, outputVariables: {} },
      { templateId: "build-run-script-windows", model: developerScript, outputVariables: {} },
      { templateId: "build-smoke-requests", model: smokeRequests, outputVariables: {} },
    ];
  }

  private modulePom(
    parentGroupId: string,
    parentArtifactId: string,
    parentVersion: string,
    parentRelativePath: string,
    artifactId: string,
    dependencies: MavenMultimoduleModulePomTemplateModel["dependencies"],
    hasSpringBootPlugin = false,
    finalName?: string,
    mutationTesting?: MavenMutationTestingTemplateModel,
    integrationTesting?: MavenIntegrationTestingTemplateModel,
  ): MavenMultimoduleModulePomTemplateModel {
    return {
      modelVersion: "4.0.0",
      parentGroupId,
      parentArtifactId,
      parentVersion,
      parentRelativePath,
      artifactId,
      packaging: "jar",
      dependencies,
      hasSpringBootPlugin,
      ...(artifactId.endsWith("-infra-database") ? { querydslAnnotationProcessing: true } : {}),
      ...(finalName === undefined ? {} : { finalName }),
      ...(mutationTesting === undefined ? {} : { mutationTesting }),
      ...(integrationTesting === undefined ? {} : { integrationTesting }),
    };
  }
}
