import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FilePlanValidationError,
  GenerationProducerCompatibilityError,
  MissingSchemaVersionError,
  ModuleResolutionError,
  ProfileIdentifierMismatchError,
  ProfileNotFoundError,
  ProfileValidationError,
  SchemaValidationError,
  SemanticValidationError,
  TemplateDefinitionModuleMismatchError,
  TemplatePackResolutionError,
  TemplatePackValidationError,
  UnsupportedSchemaVersionError,
} from "../src/index.js";

describe("core error contracts", () => {
  it("should describe a missing schema version", () => {
    const error = new MissingSchemaVersionError();

    expect(error.code).toBe("MODEL005");
    expect(error.name).toBe("MissingSchemaVersionError");
    expect(error.message).toBe(
      "Application model does not declare a valid schemaVersion.",
    );
  });

  it("should describe an unsupported schema version", () => {
    const error = new UnsupportedSchemaVersionError("99.0.0");

    expect(error.code).toBe("MODEL004");
    expect(error.name).toBe("UnsupportedSchemaVersionError");
    expect(error.schemaVersion).toBe("99.0.0");
    expect(error.message).toBe(
      "Unsupported application model schema version '99.0.0'.",
    );
  });

  it("should describe a structural model validation failure", () => {
    const error = new SchemaValidationError([]);

    expect(error.code).toBe("MODEL001");
    expect(error.name).toBe("SchemaValidationError");
    expect(error.message).toBe(
      "Application model failed structural validation.",
    );
  });

  it("should describe a semantic model validation failure", () => {
    const issues = [
      { code: "SEM001", message: "duplicate entity", path: "entities[1]" },
    ];
    const error = new SemanticValidationError(issues);

    expect(error.name).toBe("SemanticValidationError");
    expect(error.issues).toEqual(issues);
    expect(error.message).toBe(
      "Application model failed semantic validation.",
    );
  });

  it("should describe a file plan validation failure", () => {
    const issues = [
      { code: "PLAN001", message: "duplicate target", operationIndex: 1 },
    ];
    const error = new FilePlanValidationError(issues);

    expect(error.name).toBe("FilePlanValidationError");
    expect(error.issues).toEqual(issues);
    expect(error.message).toBe("File plan validation failed.");
  });

  it("should describe a missing profile", () => {
    const error = new ProfileNotFoundError("corp-java-spring");

    expect(error.code).toBe("PROFILE001");
    expect(error.name).toBe("ProfileNotFoundError");
    expect(error.profileId).toBe("corp-java-spring");
    expect(error.message).toBe("Profile 'corp-java-spring' was not found.");
  });

  it("should describe a profile identifier mismatch", () => {
    const error = new ProfileIdentifierMismatchError("requested", "manifest");

    expect(error.code).toBe("PROFILE003");
    expect(error.name).toBe("ProfileIdentifierMismatchError");
    expect(error.requestedProfileId).toBe("requested");
    expect(error.manifestProfileId).toBe("manifest");
    expect(error.message).toBe(
      "Requested profile 'requested' does not match manifest profile 'manifest'.",
    );
  });

  it("should describe a profile validation failure", () => {
    const issues = [{ path: "/modules", message: "must be an array" }];
    const error = new ProfileValidationError(issues);

    expect(error.code).toBe("PROFILE002");
    expect(error.name).toBe("ProfileValidationError");
    expect(error.issues).toEqual(issues);
    expect(error.message).toBe(
      "Profile manifest failed structural validation.",
    );
  });

  it("should describe a module resolution failure", () => {
    const issues = [
      { code: "MODULE001", message: "unknown module", moduleId: "domain" },
    ];
    const error = new ModuleResolutionError(issues);

    expect(error.name).toBe("ModuleResolutionError");
    expect(error.issues).toEqual(issues);
    expect(error.message).toBe("Module resolution failed.");
  });

  it("should describe a template pack resolution failure", () => {
    const error = new TemplatePackResolutionError(
      "TEMPLATE003",
      "Template pack version is not supported.",
    );

    expect(error.code).toBe("TEMPLATE003");
    expect(error.name).toBe("TemplatePackResolutionError");
    expect(error.message).toBe("Template pack version is not supported.");
  });

  it("should describe a template pack validation failure with the default code", () => {
    const issues = [{ path: "/templates", message: "must be an array" }];
    const error = new TemplatePackValidationError(issues);

    expect(error.code).toBe("TEMPLATE002");
    expect(error.name).toBe("TemplatePackValidationError");
    expect(error.issues).toEqual(issues);
    expect(error.message).toBe(
      "Template pack manifest failed structural validation.",
    );
  });

  it("should describe a template pack validation failure with an explicit code", () => {
    const error = new TemplatePackValidationError([], "TEMPLATE005");

    expect(error.code).toBe("TEMPLATE005");
  });

  it("should describe a template definition module mismatch", () => {
    const error = new TemplateDefinitionModuleMismatchError(
      "domain-entity",
      "domain",
      "api-rest",
    );

    expect(error.code).toBe("TEMPLATE007");
    expect(error.name).toBe("TemplateDefinitionModuleMismatchError");
    expect(error.templateId).toBe("domain-entity");
    expect(error.definitionModuleId).toBe("domain");
    expect(error.producerModuleId).toBe("api-rest");
    expect(error.message).toBe(
      "Template definition 'domain-entity' belongs to module 'domain', not 'api-rest'.",
    );
  });

  it("should describe a generation producer compatibility failure", () => {
    const error = new GenerationProducerCompatibilityError(
      "corp-java-spring",
      "domain",
      "corp-nestjs",
      ["domain", "api-rest"],
    );

    expect(error.code).toBe("GEN001");
    expect(error.name).toBe("GenerationProducerCompatibilityError");
    expect(error.producerProfileId).toBe("corp-java-spring");
    expect(error.producerModuleId).toBe("domain");
    expect(error.requestProfileId).toBe("corp-nestjs");
    expect(error.requestModuleIds).toEqual(["domain", "api-rest"]);
    expect(error.message).toBe(
      "Generation producer 'corp-java-spring/domain' is incompatible with the generation request.",
    );
  });
});
