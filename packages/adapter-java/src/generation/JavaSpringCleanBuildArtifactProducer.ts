import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import type { MavenPomTemplateModel } from "../model/MavenPomTemplateModel.js";
import { springBootVersion } from "../spring/SpringBootVersion.js";

export class JavaSpringCleanBuildArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "build";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) {
      throw new Error("Maven project generation requires an application namespace.");
    }

    const namespaceSegments = namespace.split(".");
    if (namespaceSegments.length < 2 || namespaceSegments.some((segment) => segment.length === 0)) {
      throw new Error(
        `Cannot derive Maven groupId from namespace '${namespace}': namespace must contain at least two non-empty segments.`,
      );
    }

    const model: MavenPomTemplateModel = {
      modelVersion: "4.0.0",
      groupId: namespaceSegments.slice(0, -1).join("."),
      artifactId: request.application.name,
      version: `${request.profile.version}-SNAPSHOT`,
      javaVersion: request.profile.technology.languageVersion,
      mavenCompilerPluginVersion: "3.14.0",
      springBootVersion,
    };

    return [{
      templateId: "maven-pom",
      model,
      outputVariables: {},
    }];
  }
}
