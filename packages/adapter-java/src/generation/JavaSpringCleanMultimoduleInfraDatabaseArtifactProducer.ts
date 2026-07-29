import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaGatewayProviderTemplateModel } from "../model/JavaGatewayProviderTemplateModel.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";

export class JavaSpringCleanMultimoduleInfraDatabaseArtifactProducer
  implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "infra-database";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) {
      throw new Error("Infrastructure generation requires an application namespace.");
    }

    return request.application.entities.map((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const entityType = entity.name;
      const gatewayType = `${entityType}Gateway`;
      const imports = new JavaImportCollector();
      imports.add(`${namespace}.core.domains.${domainName}.gateway.${gatewayType}`);
      imports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      imports.add("java.util.List");
      const model: JavaGatewayProviderTemplateModel = {
        packageName: `${namespace}.infra.domains.${domainName}`,
        imports: imports.values(),
        className: `${gatewayType}Provider`,
        gatewayType,
        entityType,
        findAllMethodName: "findAll",
      };

      return {
        templateId: "infra-database-gateway-provider",
        model,
        outputVariables: {
          packagePath: namespace.replaceAll(".", "/"),
          domainName,
          className: model.className,
        },
      };
    });
  }
}
