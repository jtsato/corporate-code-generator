import {
  describe,
  expect,
  it,
} from "vitest";

import {
  GenerationPlanner,
  GenerationProducerCompatibilityError,
  TemplateDefinitionModuleMismatchError,
  TemplateDefinitionNotFoundError,
  type GenerationArtifactProducer,
  type GenerationRequest,
  type TemplateEngine,
} from "../src/index.js";

describe("GenerationPlanner", () => {
  it("should render produced artifacts in order into create operations", async () => {
    const renderedTemplates: string[] = [];
    const engine: TemplateEngine = {
      async render(template, model): Promise<string> {
        renderedTemplates.push(template);
        return `${template}:${String(model["name"])} `;
      },
    };
    const producer: GenerationArtifactProducer = {
      profileId: "java-spring-clean",
      moduleId: "domain",
      produce: () => [
        {
          templateId: "wallet",
          model: { name: "Wallet" },
          outputVariables: { className: "Wallet" },
        },
        {
          templateId: "balance",
          model: { name: "Balance" },
          outputVariables: { className: "Balance" },
        },
      ],
    };

    const templatePack = {
      id: "java-spring-clean",
      version: "0.1.0",
      templates: [
        {
          id: "wallet",
          module: "domain",
          template: "wallet.njk",
          output: "src/{{ className }}.java",
        },
        {
          id: "balance",
          module: "domain",
          template: "balance.njk",
          output: "src/{{ className }}.java",
        },
      ],
    };

    const plan = await new GenerationPlanner(engine, producer, templatePack).plan(
      request(),
    );

    expect(renderedTemplates).toEqual([
      "wallet.njk",
      "balance.njk",
    ]);
    expect(plan.operations).toEqual([
      {
        kind: "CREATE",
        targetPath: "src/Wallet.java",
        content: "wallet.njk:Wallet ",
      },
      {
        kind: "CREATE",
        targetPath: "src/Balance.java",
        content: "balance.njk:Balance ",
      },
    ]);
  });

  it("should allow a compatible producer to create an empty plan", async () => {
    const engine: TemplateEngine = {
      async render(): Promise<string> {
        return "";
      },
    };
    const producer: GenerationArtifactProducer = {
      profileId: "java-spring-clean",
      moduleId: "domain",
      produce: () => [],
    };

    const plan = await new GenerationPlanner(engine, producer, emptyPack()).plan(
      request(),
    );

    expect(plan.operations).toEqual([]);
  });

  it("should reject a producer for a different profile", async () => {
    const planner = new GenerationPlanner(
      neverRenderEngine(),
      producer("other-profile", "domain"),
      emptyPack(),
    );

    await expect(planner.plan(request())).rejects
      .toBeInstanceOf(GenerationProducerCompatibilityError);
  });

  it("should reject a producer for a module absent from the request", async () => {
    const planner = new GenerationPlanner(
      neverRenderEngine(),
      producer("java-spring-clean", "application"),
      emptyPack(),
    );

    try {
      await planner.plan(request());
      expect.fail("Expected producer compatibility validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(GenerationProducerCompatibilityError);
      expect((error as GenerationProducerCompatibilityError).code)
        .toBe("GEN001");
    }
  });

  it("should reject an invocation whose definition does not exist", async () => {
    const planner = new GenerationPlanner(
      neverRenderEngine(),
      producer("java-spring-clean", "domain", "missing"),
      emptyPack(),
    );

    await expect(planner.plan(request())).rejects
      .toBeInstanceOf(TemplateDefinitionNotFoundError);
  });

  it("should reject a definition for another module", async () => {
    const planner = new GenerationPlanner(
      neverRenderEngine(),
      producer("java-spring-clean", "domain", "application-template"),
      {
        id: "java-spring-clean",
        version: "0.1.0",
        templates: [
          {
            id: "application-template",
            module: "application",
            template: "application.njk",
            output: "src/Application.java",
          },
        ],
      },
    );

    await expect(planner.plan(request())).rejects
      .toBeInstanceOf(TemplateDefinitionModuleMismatchError);
  });
});

function request(): GenerationRequest {
  return {
    application: {
      schemaVersion: "1.0",
      name: "wallet-service",
      entities: [],
    },
    profile: {
      id: "java-spring-clean",
      version: "0.1.0",
      technology: {
        language: "java",
        languageVersion: "25",
      },
      architecture: {
        style: "clean-architecture",
      },
      modules: [
        { id: "domain", requires: [] },
      ],
      templatePack: {
        id: "java-spring-clean",
        version: "0.1.0",
      },
    },
    modules: [
      { id: "domain", requires: [] },
    ],
  };
}

function producer(
  profileId: string,
  moduleId: string,
  templateId?: string,
): GenerationArtifactProducer {
  return {
    profileId,
    moduleId,
    produce: () => templateId === undefined ? [] : [
      {
        templateId,
        model: {},
        outputVariables: {},
      },
    ],
  };
}

function neverRenderEngine(): TemplateEngine {
  return {
    async render(): Promise<string> {
      throw new Error("Rendering should not be reached.");
    },
  };
}

function emptyPack() {
  return {
    id: "java-spring-clean",
    version: "0.1.0",
    templates: [],
  };
}
