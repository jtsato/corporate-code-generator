import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { deriveMavenGroupId } from "../maven/MavenCoordinates.js";
import type { MavenMultimoduleModulePomTemplateModel } from "../model/MavenMultimoduleModulePomTemplateModel.js";
import type { MavenMultimoduleParentPomTemplateModel } from "../model/MavenMultimoduleParentPomTemplateModel.js";
import { springBootVersion } from "../spring/SpringBootVersion.js";

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
      modules: ["core", "entrypoints/rest", "infra/database", "configuration"],
      javaVersion: request.profile.technology.languageVersion,
    };
    const core = this.modulePom(groupId, artifactId, version, "../pom.xml", `${artifactId}-core`, []);
    const entrypointsRest = this.modulePom(groupId, artifactId, version, "../../pom.xml", `${artifactId}-entrypoints-rest`, [
      { groupId: "${project.groupId}", artifactId: `${artifactId}-core`, version: "${project.version}" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-web" },
    ]);
    const infraDatabase = this.modulePom(groupId, artifactId, version, "../../pom.xml", `${artifactId}-infra-database`, [
      { groupId: "${project.groupId}", artifactId: `${artifactId}-core`, version: "${project.version}" },
    ]);
    const configuration = this.modulePom(groupId, artifactId, version, "../pom.xml", `${artifactId}-configuration`, [
      { groupId: "${project.groupId}", artifactId: `${artifactId}-core`, version: "${project.version}" },
      { groupId: "${project.groupId}", artifactId: `${artifactId}-entrypoints-rest`, version: "${project.version}" },
      { groupId: "${project.groupId}", artifactId: `${artifactId}-infra-database`, version: "${project.version}" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter" },
    ], true);

    return [
      { templateId: "parent-pom", model: parent, outputVariables: {} },
      { templateId: "core-pom", model: core, outputVariables: {} },
      { templateId: "entrypoints-rest-pom", model: entrypointsRest, outputVariables: {} },
      { templateId: "infra-database-pom", model: infraDatabase, outputVariables: {} },
      { templateId: "configuration-pom", model: configuration, outputVariables: {} },
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
    };
  }
}
