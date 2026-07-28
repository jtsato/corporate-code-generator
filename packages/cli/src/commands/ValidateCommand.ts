import {
  MissingSchemaVersionError,
  ModelLoader,
  ModelParser,
  ModelSchemaRegistry,
  SchemaValidationError,
  SchemaValidator,
  SchemaVersionDetector,
  SemanticValidationError,
  SemanticValidator,
  UnsupportedSchemaVersionError,
} from "@corporate-code-generator/core";

export interface ValidateCommandResult {
  readonly exitCode: number;
}

export class ValidateCommand {
  public async execute(
    modelPath: string,
  ): Promise<ValidateCommandResult> {
    try {
      const loader: ModelLoader =
        new ModelLoader();

      const parser: ModelParser =
        new ModelParser();

      const semanticValidator: SemanticValidator =
        new SemanticValidator();

      const schemaVersionDetector: SchemaVersionDetector =
        new SchemaVersionDetector();

      const schemaRegistry: ModelSchemaRegistry =
        new ModelSchemaRegistry();

      const document =
        await loader.load(modelPath);

      const schemaVersion =
        schemaVersionDetector.detect(document);

      if (schemaVersion === undefined) {
        throw new MissingSchemaVersionError();
      }

      const schema =
        await schemaRegistry.get(schemaVersion);

      const schemaValidator: SchemaValidator =
        new SchemaValidator(schema);

      schemaValidator.validate(document);

      const model =
        parser.parse(document);

      semanticValidator.validate(model);

      console.log("Model is valid.");
      console.log(`Application: ${model.name}`);
      console.log(
        `Schema version: ${model.schemaVersion}`,
      );
      console.log(
        `Entities: ${model.entities.length}`,
      );

      return {
        exitCode: 0,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(
    error: unknown,
  ): ValidateCommandResult {
    if (error instanceof SchemaValidationError) {
      console.error(
        `Error ${error.code}: ${error.message}`,
      );

      for (
        const validationError
        of error.validationErrors
      ) {
        console.error(
          `  ${validationError.instancePath || "/"}: ` +
          `${validationError.message}`,
        );
      }

      return {
        exitCode: 1,
      };
    }

    if (error instanceof SemanticValidationError) {
      for (const issue of error.issues) {
        console.error(
          `Error ${issue.code}: ${issue.message}`,
        );

        console.error(
          `  Location: ${issue.path}`,
        );
      }

      return {
        exitCode: 1,
      };
    }

    if (
      error instanceof MissingSchemaVersionError ||
      error instanceof UnsupportedSchemaVersionError
    ) {
      console.error(
        `Error ${error.code}: ${error.message}`,
      );

      return {
        exitCode: 1,
      };
    }

    if (error instanceof Error) {
      console.error(
        `Error: ${error.message}`,
      );
    } else {
      console.error(
        "An unexpected error occurred.",
      );
    }

    return {
      exitCode: 1,
    };
  }
}