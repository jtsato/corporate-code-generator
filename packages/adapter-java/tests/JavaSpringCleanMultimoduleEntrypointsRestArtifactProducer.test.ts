import { describe, expect, it } from "vitest";
import { JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer } from "../src/index.js";

describe("JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer", () => {
  it("produces a delegating controller then a response with a domain factory", () => {
    const producer = new JavaSpringCleanMultimoduleEntrypointsRestArtifactProducer();
    const artifacts = producer.produce({
      application: { schemaVersion: "1.0", name: "wallet-service", namespace: "io.github.jtsato.walletservice", entities: [
        { name: "Wallet", attributes: [{ name: "id", type: "uuid", identifier: true }, { name: "balance", type: "decimal", identifier: false }] },
      ] },
      profile: { id: "java-spring-clean-multimodule", version: "0.1.0", technology: { language: "java", languageVersion: "25" }, architecture: { style: "clean-architecture" }, templatePack: { id: "java-spring-clean-multimodule", version: "0.1.0" }, modules: [] },
      modules: [{ id: "entrypoints-rest", requires: [] }],
    });
    expect(producer.profileId).toBe("java-spring-clean-multimodule");
    expect(producer.moduleId).toBe("entrypoints-rest");
    expect(artifacts.map((artifact) => artifact.templateId)).toEqual(["entrypoints-rest-controller", "entrypoints-rest-response", "entrypoints-rest-filter-operator", "entrypoints-rest-filter-field-definition", "entrypoints-rest-filter-definition", "entrypoints-rest-filter-parser", "entrypoints-rest-filter-parser-test", "entrypoints-rest-domain-filter-definition", "entrypoints-rest-domain-filter-definition-test", "entrypoints-rest-common-sort-field-definition", "entrypoints-rest-common-sort-definition", "entrypoints-rest-common-sort-parser", "entrypoints-rest-common-sort-parser-test", "entrypoints-rest-domain-sort-definition", "entrypoints-rest-domain-sort-definition-test", "entrypoints-rest-response-status", "entrypoints-rest-page-response"]);
    expect(artifacts.slice(0, 2)).toMatchObject([
      {
        outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletController" },
        model: {
          packageName: "io.github.jtsato.walletservice.entrypoint.rest.domains.wallet",
          requestMapping: "/wallets",
          useCaseType: "FindWalletsByFilterPageUseCase",
          useCaseFieldName: "findWalletsByFilterPageUseCase",
          useCaseExecuteMethodName: "execute",
          byIdUseCaseType: "FindWalletByIdUseCase",
          byIdUseCaseFieldName: "findWalletByIdUseCase",
          identifierType: "UUID",
          identifierParameterName: "id",
          findByIdMethodName: "findById",
          responseFactoryMethodName: "from",
          filterParameterName: "filter",
          filterParameterType: "List<String>",
          filterExpressionType: "FilterExpression",
          filterParserType: "RestFilterParser",
          filterParserMethodName: "parse",
          filterDefinitionType: "WalletRestFilterDefinition",
          filterDefinitionFactoryMethodName: "create",
          sortParameterName: "sort",
          sortParameterType: "List<String>",
          sortParameterDescription: "Sort expression as <field>:<direction>. Repeat to apply multiple orders in order. Fields: id, balance. Directions: asc, desc.",
          sortParameterExample: "balance:desc",
          sortOrdersType: "List",
          sortOrderType: "SortOrder",
          sortParserType: "RestSortParser",
          sortParserMethodName: "parse",
          sortDefinitionType: "WalletRestSortDefinition",
          sortDefinitionFactoryMethodName: "create",
          imports: [
          "io.github.jtsato.walletservice.core.common.filter.FilterExpression",
          "io.github.jtsato.walletservice.core.common.paging.PageRequest",
          "io.github.jtsato.walletservice.core.common.paging.PageResult",
          "io.github.jtsato.walletservice.core.common.paging.SortOrder",
          "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
          "io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletByIdUseCase",
          "io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCase",
          "io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterParser",
          "io.github.jtsato.walletservice.entrypoint.rest.common.ResponseStatus",
          "io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortParser",
          "io.github.jtsato.walletservice.entrypoint.rest.common.WalletPageResponse",
          "io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter.WalletRestFilterDefinition",
          "io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.sort.WalletRestSortDefinition",
          "io.swagger.v3.oas.annotations.enums.ParameterIn",
          "io.swagger.v3.oas.annotations.media.ArraySchema",
          "io.swagger.v3.oas.annotations.media.Content",
          "io.swagger.v3.oas.annotations.media.Schema",
          "io.swagger.v3.oas.annotations.Operation",
          "io.swagger.v3.oas.annotations.Parameter",
          "io.swagger.v3.oas.annotations.responses.ApiResponse",
          "io.swagger.v3.oas.annotations.responses.ApiResponses",
          "io.swagger.v3.oas.annotations.tags.Tag",
            "java.util.List",
            "java.util.UUID",
            "org.springframework.web.bind.annotation.GetMapping",
            "org.springframework.web.bind.annotation.PathVariable",
            "org.springframework.web.bind.annotation.RequestMapping",
            "org.springframework.web.bind.annotation.RequestParam",
            "org.springframework.web.bind.annotation.RestController",
          ],
        },
      },
      {
        outputVariables: { packagePath: "io/github/jtsato/walletservice", domainName: "wallet", className: "WalletResponse" },
        model: {
          components: [{ name: "id", type: "UUID" }, { name: "balance", type: "BigDecimal" }],
          factoryMethodName: "from",
          factoryParameterType: "Wallet",
          factoryParameterName: "wallet",
          factoryArguments: ["wallet.getId()", "wallet.getBalance()"],
          imports: [
            "io.github.jtsato.walletservice.core.domains.wallet.model.Wallet",
            "java.math.BigDecimal",
            "java.util.UUID",
          ],
        },
      },
    ]);
    expect(artifacts.slice(2, -2)).toMatchObject([
      { templateId: "entrypoints-rest-filter-operator", model: { packageName: "io.github.jtsato.walletservice.entrypoint.rest.common.filter", coreFilterPackage: "io.github.jtsato.walletservice.core.common.filter" } },
      { templateId: "entrypoints-rest-filter-field-definition" }, { templateId: "entrypoints-rest-filter-definition" }, { templateId: "entrypoints-rest-filter-parser" }, { templateId: "entrypoints-rest-filter-parser-test" },
      { templateId: "entrypoints-rest-domain-filter-definition", model: { packageName: "io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter" } }, { templateId: "entrypoints-rest-domain-filter-definition-test" },
      { templateId: "entrypoints-rest-common-sort-field-definition" }, { templateId: "entrypoints-rest-common-sort-definition" }, { templateId: "entrypoints-rest-common-sort-parser" }, { templateId: "entrypoints-rest-common-sort-parser-test" },
      { templateId: "entrypoints-rest-domain-sort-definition", model: { packageName: "io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.sort", fields: [{ publicName: "id", domainName: "id" }, { publicName: "balance", domainName: "balance" }] } }, { templateId: "entrypoints-rest-domain-sort-definition-test" },
    ]);
  });
});
