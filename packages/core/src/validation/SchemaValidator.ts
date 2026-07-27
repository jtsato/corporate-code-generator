import Ajv2020Module from "ajv/dist/2020.js";
import type {
  ErrorObject,
  ValidateFunction,
} from "ajv";

import type { ApplicationModelDocument } from "../model/document/ApplicationModelDocument.js";
import { SchemaValidationError } from "./SchemaValidationError.js";

const Ajv2020 = Ajv2020Module.default;

export class SchemaValidator {
  private readonly validateModel: ValidateFunction<ApplicationModelDocument>;

  public constructor(schema: object) {
    const ajv = new Ajv2020({
      allErrors: true,
      strict: true,
    });

    this.validateModel =
      ajv.compile<ApplicationModelDocument>(schema);
  }

  public validate(
    document: unknown,
  ): asserts document is ApplicationModelDocument {
    if (this.validateModel(document)) {
      return;
    }

    const errors: readonly ErrorObject[] =
      this.validateModel.errors ?? [];

    throw new SchemaValidationError(errors);
  }
}
