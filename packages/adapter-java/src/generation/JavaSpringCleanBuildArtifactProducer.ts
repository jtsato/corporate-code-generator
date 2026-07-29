import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import type { MavenPomTemplateModel } from "../model/MavenPomTemplateModel.js";
import { deriveMavenGroupId } from "../maven/MavenCoordinates.js";
import { springBootVersion } from "../spring/SpringBootVersion.js";

export class JavaSpringCleanBuildArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "build";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const model: MavenPomTemplateModel = {
      modelVersion: "4.0.0",
      groupId: deriveMavenGroupId(request.application.namespace),
      artifactId: request.application.name,
      version: `${request.profile.version}-SNAPSHOT`,
      javaVersion: request.profile.technology.languageVersion,
      mavenCompilerPluginVersion: "3.14.0",
      springBootVersion,
      dependencies: [
        { groupId: "org.springframework.boot", artifactId: "spring-boot-starter" },
        ...(request.modules.some((module) => module.id === "api-rest")
          ? [{ groupId: "org.springframework.boot", artifactId: "spring-boot-starter-web" }]
          : []),
      ],
    };

    return [{
      templateId: "maven-pom",
      model,
      outputVariables: {},
    }];
  }
}
