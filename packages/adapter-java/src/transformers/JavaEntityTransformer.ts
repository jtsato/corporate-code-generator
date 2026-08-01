import type {
  ApplicationModel,
  Entity,
} from "@corporate-code-generator/core";

import type { JavaEntityTemplateModel } from "../model/JavaEntityTemplateModel.js";
import { JavaTypeResolver } from "../types/JavaTypeResolver.js";
import { createJavaEntityTemplateModel } from "./createJavaEntityTemplateModel.js";

export class JavaEntityTransformer {
  public constructor(
    private readonly typeResolver:
      JavaTypeResolver = new JavaTypeResolver(),
    private readonly selfValidationEnabled = false,
  ) {}

  public transform(
    application: ApplicationModel,
    entity: Entity,
  ): JavaEntityTemplateModel {
    return createJavaEntityTemplateModel(
      entity,
      this.resolvePackageName(application),
      this.typeResolver,
      this.selfValidationEnabled,
    );
  }

  private resolvePackageName(
    application: ApplicationModel,
  ): string {
    if (application.namespace === undefined) {
      throw new Error(
        "Java generation requires an application namespace.",
      );
    }

    return `${application.namespace}.domain`;
  }
}
