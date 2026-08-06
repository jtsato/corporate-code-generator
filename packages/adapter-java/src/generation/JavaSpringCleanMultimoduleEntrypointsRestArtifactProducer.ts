import type {
  GenerationArtifactProducer,
  GenerationRequest,
  TemplateInvocation,
} from "@corporate-code-generator/core";
import { JavaImportCollector } from "../model/JavaImportCollector.js";
import type { JavaDelegatingRestControllerTemplateModel } from "../model/JavaDelegatingRestControllerTemplateModel.js";
import type { JavaCreateRestRequestTemplateModel } from "../model/JavaCreateRestRequestTemplateModel.js";
import type { JavaFactoryRestResponseTemplateModel } from "../model/JavaFactoryRestResponseTemplateModel.js";
import { toJavaFieldName } from "../naming/JavaFieldName.js";
import { toJavaPackageSegment } from "../naming/JavaPackageSegment.js";
import { toJavaPluralTypeName } from "../naming/JavaPluralTypeName.js";
import { toJavaTypeName } from "../naming/JavaTypeName.js";
import { toRestCollectionPath } from "../naming/RestCollectionPath.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";

/**
 * Mirrors the field/operator combinations hard-coded by the
 * `entrypoints-rest-domain-filter-definition` template (`RestFilterDefinition.of(...)` always
 * exposes exactly `id` and `balance`), so the OpenAPI description matches what the generated
 * `RestFilterParser` actually accepts.
 */
const restFilterParameterDescription =
  "Filter expression as <field>:<operator>[:<value>]. Repeat to combine with AND. " +
  "Fields: id (eq, ne, in, isnull, notnull); balance (eq, ne, gt, gte, lt, lte, in, isnull, notnull).";

export class JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer implements GenerationArtifactProducer {
  public readonly profileId = "java-spring-clean-multimodule";
  public readonly moduleId = "entrypoints-rest";

  public constructor(private readonly typeResolver: JavaTypeResolver = new JavaTypeResolver()) {}

  public produce(request: GenerationRequest): readonly TemplateInvocation[] {
    const namespace = request.application.namespace;
    if (namespace === undefined) throw new Error("REST generation requires an application namespace.");
    const entityArtifacts = request.application.entities.flatMap((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const packageName = `${namespace}.entrypoint.rest.domains.${domainName}`;
      const entityType = toJavaTypeName(entity.name);
      const controllerName = `${entityType}Controller`;
      const responseName = `${entityType}Response`;
      const byFilterPageUseCaseType = `Find${toJavaPluralTypeName(entityType)}ByFilterPageUseCase`;
      const byIdUseCaseType = `Find${entityType}ByIdUseCase`;
      const createUseCaseType = `Create${entityType}UseCase`;
      const createRequestType = `Create${entityType}Request`;
      const identifiers = entity.attributes.filter((attribute) => attribute.identifier);
      if (identifiers.length !== 1) {
        throw new Error(`Cannot generate find-by-id controller for entity '${entity.name}' without exactly one identifier attribute.`);
      }
      const identifier = identifiers[0]!;
      const identifierType = this.typeResolver.resolve(identifier.type);
      const filterDefinitionType = `${entityType}RestFilterDefinition`;
      const sortDefinitionType = `${entityType}RestSortDefinition`;
      const sortParameterDescription = `Sort expression as <field>:<direction>. Repeat to apply multiple orders in order. Fields: ${entity.attributes.map((attribute) => attribute.name).join(", ")}. Directions: asc, desc.`;
      const controllerImports = new JavaImportCollector();
      controllerImports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byFilterPageUseCaseType}`);
      controllerImports.add(`${namespace}.core.domains.${domainName}.usecase.find.${byIdUseCaseType}`);
      controllerImports.add(`${namespace}.core.domains.${domainName}.usecase.create.${createUseCaseType}`);
      controllerImports.add(`${namespace}.entrypoint.rest.domains.${domainName}.request.${createRequestType}`);
      controllerImports.add(`${namespace}.core.common.paging.PageRequest`);
      controllerImports.add(`${namespace}.core.common.paging.PageResult`);
      controllerImports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      controllerImports.add(`${namespace}.core.common.filter.FilterExpression`);
      controllerImports.add(`${namespace}.entrypoint.rest.common.${entityType}PageResponse`);
      controllerImports.add(`${namespace}.entrypoint.rest.common.ResponseStatus`);
      controllerImports.add(`${namespace}.entrypoint.rest.common.filter.RestFilterParser`);
      controllerImports.add(`${namespace}.entrypoint.rest.domains.${domainName}.filter.${filterDefinitionType}`);
      controllerImports.add(`${namespace}.entrypoint.rest.common.sort.RestSortParser`);
      controllerImports.add(`${namespace}.entrypoint.rest.domains.${domainName}.sort.${sortDefinitionType}`);
      controllerImports.add(`${namespace}.core.common.paging.SortOrder`);
      controllerImports.add("java.net.URI");
      controllerImports.add("java.util.List");
      controllerImports.add(identifierType.import);
      controllerImports.add("org.springframework.http.ResponseEntity");
      controllerImports.add("org.springframework.web.bind.annotation.GetMapping");
      controllerImports.add("org.springframework.web.bind.annotation.PostMapping");
      controllerImports.add("org.springframework.web.bind.annotation.PathVariable");
      controllerImports.add("org.springframework.web.bind.annotation.RequestBody");
      controllerImports.add("org.springframework.web.bind.annotation.RequestMapping");
      controllerImports.add("org.springframework.web.bind.annotation.RequestParam");
      controllerImports.add("org.springframework.web.bind.annotation.RestController");
      controllerImports.add("io.swagger.v3.oas.annotations.Operation");
      controllerImports.add("io.swagger.v3.oas.annotations.Parameter");
      controllerImports.add("io.swagger.v3.oas.annotations.enums.ParameterIn");
      controllerImports.add("io.swagger.v3.oas.annotations.headers.Header");
      controllerImports.add("io.swagger.v3.oas.annotations.responses.ApiResponse");
      controllerImports.add("io.swagger.v3.oas.annotations.responses.ApiResponses");
      controllerImports.add("io.swagger.v3.oas.annotations.media.ArraySchema");
      controllerImports.add("io.swagger.v3.oas.annotations.media.Content");
      controllerImports.add("io.swagger.v3.oas.annotations.media.Schema");
      controllerImports.add("io.swagger.v3.oas.annotations.tags.Tag");
      const controller: JavaDelegatingRestControllerTemplateModel = {
        packageName,
        imports: controllerImports.values(),
        className: controllerName,
        requestMapping: toRestCollectionPath(entity.name),
        responseClassName: responseName,
        domainClassName: entityType,
        pageResponseClassName: `${entityType}PageResponse`,
        pageRequestClassName: "PageRequest",
        pageResultClassName: "PageResult",
        findAllMethodName: "findAll",
        useCaseType: byFilterPageUseCaseType,
        useCaseFieldName: toJavaFieldName(byFilterPageUseCaseType),
        useCaseExecuteMethodName: "execute",
        byIdUseCaseType,
        byIdUseCaseFieldName: toJavaFieldName(byIdUseCaseType),
        identifierType: identifierType.name,
        identifierParameterName: identifier.name,
        identifierAccessorName: `get${toJavaTypeName(identifier.name)}`,
        findByIdMethodName: "findById",
        findByIdOperationSummary: `Find ${entityType.toLowerCase()} by id`,
        findByIdOperationDescription: `Returns a ${entityType.toLowerCase()} by its identifier.`,
        responseFactoryMethodName: "from",
        tagName: toJavaPluralTypeName(entityType), tagDescription: `${entityType} operations`, operationSummary: `Find ${toJavaPluralTypeName(entityType).toLowerCase()}`, operationDescription: `Returns all ${toJavaPluralTypeName(entityType).toLowerCase()}.`,
        filterParameterName: "filter",
        filterParameterType: "List<String>",
        filterParameterDescription: restFilterParameterDescription,
        filterParameterExample: "balance:gt:100",
        filterExpressionType: "FilterExpression",
        filterExpressionVariableName: "expression",
        filterParserType: "RestFilterParser",
        filterParserMethodName: "parse",
        filterDefinitionType,
        filterDefinitionFactoryMethodName: "create",
        pageParameterName: "page",
        pageParameterDescription: "Zero-based page index. Defaults to 0.",
        sizeParameterName: "size",
        sizeParameterDescription: "Number of items per page. Defaults to 20.",
        sortParameterName: "sort",
        sortParameterType: "List<String>",
        sortParameterDescription,
        sortParameterExample: "balance:desc",
        sortOrdersType: "List",
        sortOrderType: "SortOrder",
        sortParserType: "RestSortParser",
        sortParserMethodName: "parse",
        sortDefinitionType: sortDefinitionType,
        sortDefinitionFactoryMethodName: "create",
        createUseCaseType,
        createUseCaseFieldName: toJavaFieldName(createUseCaseType),
        createUseCaseExecuteMethodName: "execute",
        createRequestType,
        createRequestPackageName: `${namespace}.entrypoint.rest.domains.${domainName}.request`,
        createMethodName: "create",
        createOperationSummary: `Create ${entityType.toLowerCase()}`,
        createOperationDescription: `Creates a ${entityType.toLowerCase()}.`,
        createResponseStatus: "201",
      };
      const responseImports = new JavaImportCollector();
      responseImports.add(`${namespace}.core.domains.${domainName}.model.${entityType}`);
      const components = entity.attributes.map((attribute) => {
        const type = this.typeResolver.resolve(attribute.type);
        responseImports.add(type.import);
        return { name: attribute.name, type: type.name, description: `${entityType} ${attribute.name}.` };
      });
      const response: JavaFactoryRestResponseTemplateModel = {
        packageName,
        imports: responseImports.values(),
        recordName: responseName,
        components,
        factoryMethodName: "from",
        factoryParameterType: entityType,
        factoryParameterName: toJavaFieldName(entityType),
        factoryArguments: entity.attributes.map((attribute) =>
          `${toJavaFieldName(entityType)}.get${attribute.name[0]?.toUpperCase() ?? ""}${attribute.name.slice(1)}()`,
        ),
      };
      const variables = { packagePath: namespace.replaceAll(".", "/"), domainName };
      return [
        { templateId: "entrypoints-rest-controller", model: controller, outputVariables: { ...variables, className: controllerName } },
        { templateId: "entrypoints-rest-response", model: response, outputVariables: { ...variables, className: responseName } },
        {
          templateId: "entrypoints-rest-domain-create-request",
          model: createRequestModel(entity.attributes, namespace, domainName, entityType, this.typeResolver),
          outputVariables: { ...variables, domainName, className: createRequestType },
        },
      ];
    });
    const packagePath = namespace.replaceAll(".", "/");
    const filterArtifacts: TemplateInvocation[] = [
      { templateId: "entrypoints-rest-filter-operator", model: { packageName: `${namespace}.entrypoint.rest.common.filter`, coreFilterPackage: `${namespace}.core.common.filter` }, outputVariables: { packagePath, className: "RestFilterOperator" } },
      { templateId: "entrypoints-rest-filter-field-definition", model: { packageName: `${namespace}.entrypoint.rest.common.filter`, exceptionPackage: `${namespace}.core.common.exception` }, outputVariables: { packagePath, className: "RestFilterFieldDefinition" } },
      { templateId: "entrypoints-rest-filter-definition", model: { packageName: `${namespace}.entrypoint.rest.common.filter`, exceptionPackage: `${namespace}.core.common.exception` }, outputVariables: { packagePath, className: "RestFilterDefinition" } },
      { templateId: "entrypoints-rest-filter-parser", model: { packageName: `${namespace}.entrypoint.rest.common.filter`, coreFilterPackage: `${namespace}.core.common.filter`, exceptionPackage: `${namespace}.core.common.exception` }, outputVariables: { packagePath, className: "RestFilterParser" } },
      { templateId: "entrypoints-rest-filter-parser-test", model: { packageName: `${namespace}.entrypoint.rest.common.filter`, exceptionPackage: `${namespace}.core.common.exception`, coreFilterPackage: `${namespace}.core.common.filter` }, outputVariables: { packagePath, className: "RestFilterParserTests" } },
    ];
    const entityFilterArtifacts = request.application.entities.flatMap((entity) => {
      const domainName = toJavaPackageSegment(entity.name);
      const entityType = toJavaTypeName(entity.name);
      const definitionName = `${entityType}RestFilterDefinition`;
      return [
        { templateId: "entrypoints-rest-domain-filter-definition", model: { packageName: `${namespace}.entrypoint.rest.domains.${domainName}.filter`, commonFilterPackage: `${namespace}.entrypoint.rest.common.filter`, className: definitionName, attributes: entity.attributes.map((attribute) => ({ name: attribute.name, type: attribute.type })) }, outputVariables: { packagePath, domainName, className: definitionName } },
        { templateId: "entrypoints-rest-domain-filter-definition-test", model: { packageName: `${namespace}.entrypoint.rest.domains.${domainName}.filter`, commonFilterPackage: `${namespace}.entrypoint.rest.common.filter`, exceptionPackage: `${namespace}.core.common.exception`, definitionName, className: `${definitionName}Tests` }, outputVariables: { packagePath, domainName, className: `${definitionName}Tests` } },
      ];
    });
    const sortArtifacts: TemplateInvocation[] = [
      { templateId: "entrypoints-rest-common-sort-field-definition", model: { packageName: `${namespace}.entrypoint.rest.common.sort`, exceptionPackage: `${namespace}.core.common.exception`, className: "RestSortFieldDefinition" }, outputVariables: { packagePath, className: "RestSortFieldDefinition" } },
      { templateId: "entrypoints-rest-common-sort-definition", model: { packageName: `${namespace}.entrypoint.rest.common.sort`, exceptionPackage: `${namespace}.core.common.exception`, className: "RestSortDefinition" }, outputVariables: { packagePath, className: "RestSortDefinition" } },
      { templateId: "entrypoints-rest-common-sort-parser", model: { packageName: `${namespace}.entrypoint.rest.common.sort`, exceptionPackage: `${namespace}.core.common.exception`, corePagingPackage: `${namespace}.core.common.paging`, className: "RestSortParser" }, outputVariables: { packagePath, className: "RestSortParser" } },
      { templateId: "entrypoints-rest-common-sort-parser-test", model: { packageName: `${namespace}.entrypoint.rest.common.sort`, exceptionPackage: `${namespace}.core.common.exception`, corePagingPackage: `${namespace}.core.common.paging`, className: "RestSortParserTests" }, outputVariables: { packagePath, className: "RestSortParserTests" } },
      ...request.application.entities.flatMap((entity) => {
        const domainName = toJavaPackageSegment(entity.name);
        const entityType = toJavaTypeName(entity.name);
        const definitionName = `${entityType}RestSortDefinition`;
        const fields = entity.attributes.map((attribute) => ({ publicName: attribute.name, domainName: attribute.name }));
        return [
          { templateId: "entrypoints-rest-domain-sort-definition", model: { packageName: `${namespace}.entrypoint.rest.domains.${domainName}.sort`, commonSortPackage: `${namespace}.entrypoint.rest.common.sort`, className: definitionName, fields }, outputVariables: { packagePath, domainName, className: definitionName } },
          { templateId: "entrypoints-rest-domain-sort-definition-test", model: { packageName: `${namespace}.entrypoint.rest.domains.${domainName}.sort`, commonSortPackage: `${namespace}.entrypoint.rest.common.sort`, exceptionPackage: `${namespace}.core.common.exception`, className: `${definitionName}Tests`, definitionName, fields }, outputVariables: { packagePath, domainName, className: `${definitionName}Tests` } },
        ];
      }),
    ];
    return [...entityArtifacts, ...filterArtifacts, ...entityFilterArtifacts, ...sortArtifacts,
      { templateId: "entrypoints-rest-response-status", model: { packageName: `${namespace}.entrypoint.rest.common`, className: "ResponseStatus" }, outputVariables: { packagePath, className: "ResponseStatus" } },
      ...request.application.entities.map((entity) => {
        const entityType = toJavaTypeName(entity.name);
        return {
          templateId: "entrypoints-rest-page-response",
          model: { packageName: `${namespace}.entrypoint.rest.common`, pageResultPackageName: `${namespace}.core.common.paging`, responsePackageName: `${namespace}.entrypoint.rest.domains.${toJavaPackageSegment(entity.name)}`, responseType: `${entityType}Response`, className: `${entityType}PageResponse` },
          outputVariables: { packagePath, className: `${entityType}PageResponse` },
        };
      }),
    ];
  }
}

function createRequestModel(
  attributes: readonly { readonly name: string; readonly type: Parameters<JavaTypeResolver["resolve"]>[0] }[],
  namespace: string,
  domainName: string,
  entityType: string,
  typeResolver: JavaTypeResolver,
): JavaCreateRestRequestTemplateModel {
  const commandType = `Create${entityType}Command`;
  const imports = new JavaImportCollector();
  imports.add(`${namespace}.core.domains.${domainName}.usecase.create.${commandType}`);
  const components = attributes.map((attribute) => {
    const type = typeResolver.resolve(attribute.type);
    imports.add(type.import);
    return { name: attribute.name, type: type.name };
  });
  return {
    packageName: `${namespace}.entrypoint.rest.domains.${domainName}.request`,
    imports: imports.values(),
    recordName: `Create${entityType}Request`,
    components,
    commandType,
    commandPackageName: `${namespace}.core.domains.${domainName}.usecase.create`,
    commandArguments: attributes.map((attribute) => attribute.name),
  };
}
