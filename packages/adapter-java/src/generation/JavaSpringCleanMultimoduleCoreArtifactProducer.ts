import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { createJavaEntityTemplateModel } from "../transformers/createJavaEntityTemplateModel.js";

export class JavaSpringCleanMultimoduleCoreArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "core";

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) {
      throw new Error("Java generation requires an application namespace.");
    }

    const entityArtifacts = request.application.entities.flatMap((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const entityType = entity.name;
      const gatewayType = `${entityType}Gateway`;
      const useCaseType = `Find${toJavaPluralTypeName(entityType)}UseCase`;
      const interactorType = `${useCaseType}Interactor`;
      const byFilterUseCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterUseCase`;
      const byFilterInteractorType = `${byFilterUseCaseType}Interactor`;
      const pageUseCaseType = `Find${toJavaPluralTypeName(entityType)}PageUseCase`;
      const pageInteractorType = `${pageUseCaseType}Interactor`;
      const byFilterPageUseCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`;
      const byFilterPageInteractorType = `${byFilterPageUseCaseType}Interactor`;
      const domainPackage = `${namespace}.core.domains.${domainName}`;
      const filterPackage = `${namespace}.core.common.filter`;
      const pagingPackage = `${namespace}.core.common.paging`;
      const exceptionPackage = `${namespace}.core.common.exception`;
      const entityImports = new JavaImportCollector();
      entityImports.add(`${domainPackage}.model.${entityType}`);
      entityImports.add("java.util.List");
      const gatewayImports = new JavaImportCollector();
      gatewayImports.add(`${filterPackage}.FilterExpression`);
      gatewayImports.add(`${pagingPackage}.PageRequest`);
      gatewayImports.add(`${pagingPackage}.PageResult`);
      gatewayImports.add(`${domainPackage}.model.${entityType}`);
      gatewayImports.add("java.util.List");
      const pageUseCaseImports = new JavaImportCollector();
      pageUseCaseImports.add(`${pagingPackage}.PageRequest`);
      pageUseCaseImports.add(`${pagingPackage}.PageResult`);
      pageUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      const pageInteractorImports = new JavaImportCollector();
      pageInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      pageInteractorImports.add(`${exceptionPackage}.ValidationException`);
      pageInteractorImports.add(`${pagingPackage}.PageRequest`);
      pageInteractorImports.add(`${pagingPackage}.PageResult`);
      pageInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      pageInteractorImports.add(`${domainPackage}.model.${entityType}`);
      pageInteractorImports.add("java.util.List");
      const pageInteractorTestImports = new JavaImportCollector();
      pageInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      pageInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      pageInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      pageInteractorTestImports.add(`${pagingPackage}.PageResult`);
      pageInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      pageInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      pageInteractorTestImports.add("java.util.List");
      pageInteractorTestImports.add("org.junit.jupiter.api.Test");
      const byFilterPageUseCaseImports = new JavaImportCollector();
      byFilterPageUseCaseImports.add(`${filterPackage}.FilterExpression`);
      byFilterPageUseCaseImports.add(`${pagingPackage}.PageRequest`);
      byFilterPageUseCaseImports.add(`${pagingPackage}.PageResult`);
      byFilterPageUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      const byFilterPageInteractorImports = new JavaImportCollector();
      byFilterPageInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      byFilterPageInteractorImports.add(`${exceptionPackage}.ValidationException`);
      byFilterPageInteractorImports.add(`${filterPackage}.FilterExpression`);
      byFilterPageInteractorImports.add(`${pagingPackage}.PageRequest`);
      byFilterPageInteractorImports.add(`${pagingPackage}.PageResult`);
      byFilterPageInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterPageInteractorImports.add(`${domainPackage}.model.${entityType}`);
      byFilterPageInteractorImports.add("java.util.List");
      const byFilterPageInteractorTestImports = new JavaImportCollector();
      byFilterPageInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      byFilterPageInteractorTestImports.add(`${filterPackage}.FilterCondition`);
      byFilterPageInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      byFilterPageInteractorTestImports.add(`${filterPackage}.FilterGroup`);
      byFilterPageInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      byFilterPageInteractorTestImports.add(`${pagingPackage}.PageResult`);
      byFilterPageInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterPageInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      byFilterPageInteractorTestImports.add("java.util.ArrayList");
      byFilterPageInteractorTestImports.add("java.util.List");
      byFilterPageInteractorTestImports.add("org.junit.jupiter.api.Test");
      const byFilterUseCaseImports = new JavaImportCollector();
      byFilterUseCaseImports.add(`${filterPackage}.FilterExpression`);
      byFilterUseCaseImports.add(`${domainPackage}.model.${entityType}`);
      byFilterUseCaseImports.add("java.util.List");
      const byFilterInteractorImports = new JavaImportCollector();
      byFilterInteractorImports.add(`${exceptionPackage}.FieldViolation`);
      byFilterInteractorImports.add(`${exceptionPackage}.ValidationException`);
      byFilterInteractorImports.add(`${filterPackage}.FilterExpression`);
      byFilterInteractorImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterInteractorImports.add(`${domainPackage}.model.${entityType}`);
      byFilterInteractorImports.add("java.util.List");
      const byFilterInteractorTestImports = new JavaImportCollector();
      byFilterInteractorTestImports.add(`${exceptionPackage}.ValidationException`);
      byFilterInteractorTestImports.add(`${filterPackage}.FilterCondition`);
      byFilterInteractorTestImports.add(`${filterPackage}.FilterExpression`);
      byFilterInteractorTestImports.add(`${filterPackage}.FilterGroup`);
      byFilterInteractorTestImports.add(`${pagingPackage}.PageRequest`);
      byFilterInteractorTestImports.add(`${pagingPackage}.PageResult`);
      byFilterInteractorTestImports.add(`${domainPackage}.gateway.${gatewayType}`);
      byFilterInteractorTestImports.add(`${domainPackage}.model.${entityType}`);
      byFilterInteractorTestImports.add("java.util.ArrayList");
      byFilterInteractorTestImports.add("java.util.List");
      byFilterInteractorTestImports.add("org.junit.jupiter.api.Test");
      const outputVariables = {
        packagePath: namespace.replaceAll(".", "/"),
        domainName,
      };

      return [
        {
          templateId: "core-domain-entity",
          model: createJavaEntityTemplateModel(
            entity,
            `${domainPackage}.model`,
            undefined,
            true,
          ),
          outputVariables: { ...outputVariables, className: entityType },
        },
        {
          templateId: "core-gateway",
          model: {
            packageName: `${domainPackage}.gateway`,
            imports: gatewayImports.values(),
            interfaceName: gatewayType,
            entityType,
            findAllMethodName: "findAll",
            findByFilterMethodName: "findByFilter",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            findPageMethodName: "findPage",
            findByFilterPageMethodName: "findByFilterPage",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
          },
          outputVariables: { ...outputVariables, className: gatewayType },
        },
        {
          templateId: "core-find-usecase",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: entityImports.values(),
            interfaceName: useCaseType,
            entityType,
            executeMethodName: "execute",
          },
          outputVariables: { ...outputVariables, className: useCaseType },
        },
        {
          templateId: "core-find-usecase-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: [
              `${domainPackage}.gateway.${gatewayType}`,
              `${domainPackage}.model.${entityType}`,
              "java.util.List",
            ],
            className: interactorType,
            interfaceName: useCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
          },
          outputVariables: { ...outputVariables, className: interactorType },
        },
        {
          templateId: "core-find-usecase-by-filter",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterUseCaseImports.values(),
            interfaceName: byFilterUseCaseType,
            entityType,
            executeMethodName: "execute",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
          },
          outputVariables: { ...outputVariables, className: byFilterUseCaseType },
        },
        {
          templateId: "core-find-usecase-by-filter-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterInteractorImports.values(),
            className: byFilterInteractorType,
            interfaceName: byFilterUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindByFilterMethodName: "findByFilter",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            requiredMessageKey: "common.filter.expression.required",
            requiredDefaultMessage: "Filter expression is required.",
          },
          outputVariables: { ...outputVariables, className: byFilterInteractorType },
        },
        {
          templateId: "core-find-usecase-by-filter-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterInteractorTestImports.values(),
            className: `${byFilterInteractorType}Tests`,
            interactorType: byFilterInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            requiredMessageKey: "common.filter.expression.required",
            sampleFieldName: entity.attributes[0]!.name,
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
          },
          outputVariables: { ...outputVariables, className: `${byFilterInteractorType}Tests` },
        },
        {
          templateId: "core-find-usecase-by-filter-page",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageUseCaseImports.values(),
            interfaceName: byFilterPageUseCaseType,
            entityType,
            executeMethodName: "execute",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
          },
          outputVariables: { ...outputVariables, className: byFilterPageUseCaseType },
        },
        {
          templateId: "core-find-usecase-by-filter-page-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageInteractorImports.values(),
            className: byFilterPageInteractorType,
            interfaceName: byFilterPageUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredFilterMessageKey: "common.filter.expression.required",
            requiredFilterDefaultMessage: "Filter expression is required.",
            requiredPageMessageKey: "common.paging.page-request.required",
            requiredPageDefaultMessage: "Page request is required.",
          },
          outputVariables: { ...outputVariables, className: byFilterPageInteractorType },
        },
        {
          templateId: "core-find-usecase-by-filter-page-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: byFilterPageInteractorTestImports.values(),
            className: `${byFilterPageInteractorType}Tests`,
            interactorType: byFilterPageInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredFilterMessageKey: "common.filter.expression.required",
            requiredPageMessageKey: "common.paging.page-request.required",
            sampleFieldName: entity.attributes[0]!.name,
          },
          outputVariables: { ...outputVariables, className: `${byFilterPageInteractorType}Tests` },
        },
        {
          templateId: "core-find-usecase-page",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: pageUseCaseImports.values(),
            interfaceName: pageUseCaseType,
            entityType,
            executeMethodName: "execute",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
          },
          outputVariables: { ...outputVariables, className: pageUseCaseType },
        },
        {
          templateId: "core-find-usecase-page-interactor",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: pageInteractorImports.values(),
            className: pageInteractorType,
            interfaceName: pageUseCaseType,
            gatewayType,
            gatewayFieldName: `${domainName}Gateway`,
            entityType,
            executeMethodName: "execute",
            gatewayFindPageMethodName: "findPage",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredMessageKey: "common.paging.page-request.required",
            requiredDefaultMessage: "Page request is required.",
          },
          outputVariables: { ...outputVariables, className: pageInteractorType },
        },
        {
          templateId: "core-find-usecase-page-interactor-test",
          model: {
            packageName: `${domainPackage}.usecase.find`,
            imports: pageInteractorTestImports.values(),
            className: `${pageInteractorType}Tests`,
            interactorType: pageInteractorType,
            fakeGatewayType: `Fake${gatewayType}`,
            gatewayType,
            entityType,
            executeMethodName: "execute",
            gatewayFindAllMethodName: "findAll",
            gatewayFindByFilterMethodName: "findByFilter",
            gatewayFindPageMethodName: "findPage",
            gatewayFindByFilterPageMethodName: "findByFilterPage",
            filterExpressionType: "FilterExpression",
            filterExpressionParameterName: "filterExpression",
            pageRequestType: "PageRequest",
            pageRequestParameterName: "pageRequest",
            pageResultType: "PageResult",
            requiredMessageKey: "common.paging.page-request.required",
          },
          outputVariables: { ...outputVariables, className: `${pageInteractorType}Tests` },
        },
      ];
    });
    const packageName = `${namespace}.core.common.exception`;
    const pagingPackageName = `${namespace}.core.common.paging`;
    const filterPackageName = `${namespace}.core.common.filter`;
    const pagingVariables = { packagePath: namespace.replaceAll(".", "/") };
    return [...entityArtifacts,
      { templateId: "core-application-exception", model: { packageName, className: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ApplicationException" } },
      { templateId: "core-field-violation", model: { packageName, className: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "FieldViolation" } },
      { templateId: "core-validation-exception", model: { packageName, className: "ValidationException", parentClassName: "ApplicationException", fieldViolationClassName: "FieldViolation" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "ValidationException" } },
      { templateId: "core-not-found-exception", model: { packageName, className: "NotFoundException", parentClassName: "ApplicationException" }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "NotFoundException" } },
      { templateId: "core-self-validating", model: { packageName: `${namespace}.core.common.validation`, exceptionPackage: packageName }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), className: "SelfValidating" } },
      ...["SortDirection", "SortOrder", "PageRequest", "PageResult"].map((className) => ({ templateId: `core-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className }, outputVariables: { ...pagingVariables, className } })),
      ...request.application.entities.filter((entity) => entity.attributes.some((attribute) => attribute.required)).map((entity) => { const domainName = toJavaPackageSegment(entity.name); return { templateId: "core-domain-validation-test", model: { packageName: `${namespace}.core.domains.${domainName}.model`, exceptionPackage: packageName, className: `${entity.name}ValidationTests`, entityType: entity.name, nullArguments: entity.attributes, requiredFieldNames: entity.attributes.filter((attribute) => attribute.required).map((attribute) => attribute.name).sort((left, right) => left.localeCompare(right)) }, outputVariables: { packagePath: namespace.replaceAll(".", "/"), domainName, className: `${entity.name}ValidationTests` } }; }),
      ...["SortOrder", "PageRequest", "PageResult"].map((typeName) => ({ templateId: `core-${typeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: pagingPackageName, exceptionPackage: packageName, className: `${typeName}Tests`, typeName }, outputVariables: { ...pagingVariables, className: `${typeName}Tests` } })),
      ...["FilterOperator", "FilterCondition", "FilterGroupOperator", "FilterGroup", "FilterExpression"].map((className) => ({ templateId: `core-${className.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`, model: { packageName: filterPackageName, exceptionPackage: packageName, className }, outputVariables: { ...pagingVariables, className } })),
      ...["FilterCondition", "FilterGroup", "FilterExpression"].map((typeName) => ({ templateId: `core-${typeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-test`, model: { packageName: filterPackageName, exceptionPackage: packageName, className: `${typeName}Tests`, typeName }, outputVariables: { ...pagingVariables, className: `${typeName}Tests` } })),
    ];
  }
}
