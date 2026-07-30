import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaBootstrapTemplateModel } from "../model/JavaBootstrapTemplateModel.js";
import type { JavaDomainConfigurationTemplateModel } from "../model/JavaDomainConfigurationTemplateModel.js";
import type { JavaSpringBootApplicationTestTemplateModel } from "../model/JavaSpringBootApplicationTestTemplateModel.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";

export class JavaSpringCleanMultimoduleConfigurationArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "configuration";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("Java bootstrap generation requires an application namespace.");
    const className = `${toJavaTypeName(request.application.name)}Application`;
    const model: JavaBootstrapTemplateModel = { packageName: namespace, className };
    const outputVariables = { packagePath: namespace.replaceAll(".", "/") };

    const applicationTest: JavaSpringBootApplicationTestTemplateModel = {
      packageName: namespace,
      imports: ["org.junit.jupiter.api.Test", "org.springframework.boot.test.context.SpringBootTest"],
      className: `${className}Tests`,
      testMethodName: "contextLoads",
    };

    return [
      {
        templateId: "configuration-application",
        model,
        outputVariables: { ...outputVariables, className },
      },
      ...request.application.entities.map((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const gatewayType = `${entityType}Gateway`;
        const useCaseType = `Find${toJavaPluralTypeName(entityType)}UseCase`;
        const imports = new JavaImportCollector();
        imports.add(`${namespace}.core.domains.${domainName}.gateway.${gatewayType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}`);
        imports.add(`${namespace}.core.domains.${domainName}.usecase.find.${useCaseType}Interactor`);
        imports.add(`${namespace}.infra.domains.${domainName}.${gatewayType}Provider`);
        imports.add(`${namespace}.infra.domains.${domainName}.repository.${entityType}Repository`);
        imports.add("org.springframework.context.annotation.Bean");
        imports.add("org.springframework.context.annotation.Configuration");
        const domainModel: JavaDomainConfigurationTemplateModel = {
          packageName: `${namespace}.configuration.domains.${domainName}`,
          imports: imports.values(),
          className: `${entityType}Configuration`,
          gatewayBeanMethodName: `${domainName}Gateway`,
          gatewayType,
          gatewayImplementationType: `${gatewayType}Provider`,
          repositoryType: `${entityType}Repository`,
          repositoryParameterName: `${domainName}Repository`,
          useCaseBeanMethodName: `find${toJavaPluralTypeName(entityType)}UseCase`,
          useCaseType,
          useCaseImplementationType: `${useCaseType}Interactor`,
          gatewayParameterName: `${domainName}Gateway`,
        };

        return {
          templateId: "configuration-domain-wiring",
          model: domainModel,
          outputVariables: {
            ...outputVariables,
            domainName,
            className: domainModel.className,
          },
        };
      }),
      {
        templateId: "configuration-application-test",
        model: applicationTest,
        outputVariables: { ...outputVariables, className: applicationTest.className },
      },
    ];
  }
}
