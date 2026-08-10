import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { deriveMavenGroupId } from "../maven/MavenCoordinates.js";
import type { GithubActionsJavaCiTemplateModel } from "../model/GithubActionsJavaCiTemplateModel.js";
import type { JavaProjectReadmeTemplateModel } from "../model/JavaProjectReadmeTemplateModel.js";
import type { MavenMultimoduleModulePomTemplateModel } from "../model/MavenMultimoduleModulePomTemplateModel.js";
import type { MavenMultimoduleParentPomTemplateModel } from "../model/MavenMultimoduleParentPomTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { springBootVersion } from "../spring/SpringBootVersion.js";

const archUnitVersion = "1.4.1";
const springdocOpenapiVersion = "3.0.3";
const querydslVersion = "5.1.0";
const jakartaPersistenceVersion = "3.2.0";
const jakartaAnnotationVersion = "3.0.0";
const expresslyVersion = "5.0.0";
const jacocoVersion = "0.8.15";
const checkoutActionRef = "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1";
const setupJavaActionRef = "actions/setup-java@c1e323688fd81a25caa38c78aa6df2d33d3e20d9 # v4.8.0";

export class JavaSpringCleanMultimoduleBuildArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "build";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const groupId = deriveMavenGroupId(request.application.namespace);
    const artifactId = request.application.name;
    const version = `${request.profile.version}-SNAPSHOT`;
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
    ]);
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
    ]);
    const configuration = this.modulePom(groupId, artifactId, version, "../pom.xml", `${artifactId}-configuration`, [
      { groupId: "${project.groupId}", artifactId: `${artifactId}-core` },
      { groupId: "${project.groupId}", artifactId: `${artifactId}-entrypoints-rest` },
      { groupId: "${project.groupId}", artifactId: `${artifactId}-infra-database` },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-validation" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-test", scope: "test" },
      { groupId: "com.h2database", artifactId: "h2", scope: "runtime" },
      { groupId: "com.tngtech.archunit", artifactId: "archunit-junit5", scope: "test" },
    ], true, `${artifactId}-starter`);

    const githubActionsJavaCi: GithubActionsJavaCiTemplateModel = {
      javaVersion: request.profile.technology.languageVersion,
      checkoutActionRef,
      setupJavaActionRef,
      sonarProjectKey: artifactId,
    };

    const readme: JavaProjectReadmeTemplateModel = {
      applicationName: artifactId,
      groupId,
      artifactId,
      version,
      javaVersion: request.profile.technology.languageVersion,
      springBootVersion,
      modules: parent.modules,
      resources: request.application.entities.map((entity) => ({
        entityName: toJavaTypeName(entity.name),
        collectionPath: toRestCollectionPath(entity.name),
      })),
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
    };
  }
}
