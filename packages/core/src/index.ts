export type { ApplicationModel } from "./model/ApplicationModel.js";
export type { Attribute } from "./model/Attribute.js";
export type { Entity } from "./model/Entity.js";

export {
  primitiveTypes,
} from "./model/PrimitiveType.js";

export type {
  PrimitiveType,
} from "./model/PrimitiveType.js";

export type {
  ApplicationModelDocument,
  ApplicationDocument,
  EntityDocument,
  AttributeDocument,
} from "./model/document/ApplicationModelDocument.js";

export { ModelLoader } from "./parser/ModelLoader.js";
export { ModelParser } from "./parser/ModelParser.js";

export { SchemaValidator } from "./validation/SchemaValidator.js";
export { SchemaValidationError } from "./validation/SchemaValidationError.js";

export { SemanticValidator } from "./validation/SemanticValidator.js";

export {
  SemanticValidationError,
} from "./validation/SemanticValidationError.js";

export type {
  SemanticValidationIssue,
} from "./validation/SemanticValidationError.js";

export {
  ModelSchemaRegistry,
} from "./schema/ModelSchemaRegistry.js";

export {
  SchemaVersionDetector,
} from "./schema/SchemaVersionDetector.js";

export {
  UnsupportedSchemaVersionError,
} from "./schema/UnsupportedSchemaVersionError.js";

export {
  MissingSchemaVersionError,
} from "./schema/MissingSchemaVersionError.js";

export type {
  TemplateEngine,
} from "./templates/TemplateEngine.js";

export { FilePlan } from "./file-plan/FilePlan.js";
export { validateFilePlanTargetPath } from "./file-plan/FilePlanTargetPath.js";

export type {
  CreateFileOperation,
  FileOperation,
} from "./file-plan/FileOperation.js";

export {
  FilePlanValidationError,
} from "./file-plan/FilePlanValidationError.js";

export type {
  FilePlanValidationIssue,
} from "./file-plan/FilePlanValidationError.js";

export type {
  Module,
} from "./profiles/Module.js";

export type {
  ProfileOption,
} from "./profiles/ProfileOption.js";

export type {
  Profile,
  ProfileArchitecture,
  ProfileTechnology,
  ProfileTemplatePackReference,
} from "./profiles/Profile.js";

export { ProfileLoader } from "./profiles/ProfileLoader.js";
export { ProfileResolver } from "./profiles/ProfileResolver.js";
export { ModuleResolver } from "./profiles/ModuleResolver.js";
export { OptionResolver } from "./profiles/OptionResolver.js";

export {
  ProfileNotFoundError,
} from "./profiles/ProfileNotFoundError.js";

export {
  ProfileValidationError,
} from "./profiles/ProfileValidationError.js";

export type {
  ProfileValidationIssue,
} from "./profiles/ProfileValidationError.js";

export {
  ProfileIdentifierMismatchError,
} from "./profiles/ProfileIdentifierMismatchError.js";

export {
  ModuleResolutionError,
} from "./profiles/ModuleResolutionError.js";

export type {
  ModuleResolutionIssue,
} from "./profiles/ModuleResolutionError.js";

export {
  OptionResolutionError,
} from "./profiles/OptionResolutionError.js";

export type {
  OptionResolutionIssue,
} from "./profiles/OptionResolutionError.js";

export type {
  GenerationRequest,
} from "./generation/GenerationRequest.js";

export type {
  TemplateDefinition,
  TemplatePack,
  TemplatePackReference,
} from "./template-packs/TemplatePack.js";
export type {
  ResolvedTemplatePack,
} from "./template-packs/ResolvedTemplatePack.js";

export { TemplatePackLoader } from "./template-packs/TemplatePackLoader.js";
export { TemplatePackResolver } from "./template-packs/TemplatePackResolver.js";
export { TemplatePackValidationError } from "./template-packs/TemplatePackValidationError.js";
export {
  findTemplateDefinition,
  TemplateDefinitionNotFoundError,
} from "./template-packs/TemplateDefinitionLookup.js";

export type { TemplateInvocation, OutputPathVariables } from "./generation/TemplateInvocation.js";
export {
  SimpleOutputPathResolver,
  OutputPathResolutionError,
} from "./generation/OutputPathResolver.js";
export type { OutputPathResolver } from "./generation/OutputPathResolver.js";
export {
  TemplateDefinitionModuleMismatchError,
} from "./generation/TemplateDefinitionModuleMismatchError.js";
export {
  TemplatePackResolutionError,
} from "./template-packs/TemplatePackResolutionError.js";

export type { GenerationArtifactProducer } from "./generation/GenerationArtifactProducer.js";

export { GenerationPlanner } from "./generation/GenerationPlanner.js";

export {
  GenerationProducerCompatibilityError,
} from "./generation/GenerationProducerCompatibilityError.js";
