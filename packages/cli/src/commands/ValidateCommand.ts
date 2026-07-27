import {
  ModelLoader,
  ModelParser,
  SchemaValidationError,
  SchemaValidator,
  SemanticValidationError,
  SemanticValidator,
} from "@corporate-code-generator/core";

import { readFile } from "node:fs/promises";

export interface ValidateCommandResult {
  readonly exitCode: number;
}

export class ValidateCommand {
  public async execute(
    modelPath: string,
    schemaPath: string,
  ): Promise<ValidateCommandResult> {
    try {
      const schema = await this.loadSchema(schemaPath);

      const loader: ModelLoader = new ModelLoader();
      const schemaValidator: SchemaValidator =
        new SchemaValidator(schema);

      const parser: ModelParser = new ModelParser();

      const semanticValidator: SemanticValidator =
        new SemanticValidator();

      const document = await loader.load(modelPath);

      schemaValidator.validate(document);

      const model = parser.parse(document);

      semanticValidator.validate(model);

      console.log(`Model is valid.`);
      console.log(`Application: ${model.name}`);
      console.log(`Schema version: ${model.schemaVersion}`);
      console.log(`Entities: ${model.entities.length}`);

      return {
        exitCode: 0,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async loadSchema(path: string): Promise<object> {
    const content = await readFile(path, "utf8");

    return JSON.parse(content) as object;
  }

  private handleError(error: unknown): ValidateCommandResult {
    if (error instanceof SchemaValidationError) {
      console.error(
        `Error ${error.code}: ${error.message}`,
      );

      for (const validationError of error.validationErrors) {
        console.error(
          `  ${validationError.instancePath || "/"}: ${validationError.message}`,
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

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unexpected error occurred.");
    }

    return {
      exitCode: 1,
    };
  }
}