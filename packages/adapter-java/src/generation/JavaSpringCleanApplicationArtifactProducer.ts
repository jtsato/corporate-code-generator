import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaApplicationServiceTemplateModel } from "../model/JavaApplicationServiceTemplateModel.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";

export class JavaSpringCleanApplicationArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean";
  public readonly moduleId = "application";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    return request.application.entities.map((entity) => {
      const namespace = request.application.namespace;
      if (namespace === undefined) {
        throw new Error("Java generation requires an application namespace.");
      }
      const entityType = toJavaTypeName(entity.name);
      const className = `${entityType}Service`;
      const imports = new JavaImportCollector();
      imports.add(`${namespace}.domain.${entityType}`);
      imports.add("java.util.List");
      imports.add("org.springframework.stereotype.Service");
      const model: JavaApplicationServiceTemplateModel = {
        packageName: `${namespace}.application`,
        imports: imports.values(),
        className,
        entityType,
        findAllMethodName: "findAll",
      };
      return {
        templateId: "application-service",
        model,
        outputVariables: {
          packagePath: namespace.replaceAll(".", "/"),
          className,
        },
      };
    });
  }
}
