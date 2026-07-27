import type { ApplicationModel } from "../model/ApplicationModel.js";
import type { Entity } from "../model/Entity.js";

import {
  SemanticValidationError,
  type SemanticValidationIssue,
} from "./SemanticValidationError.js";

export class SemanticValidator {
  public validate(model: ApplicationModel): void {
    const issues: SemanticValidationIssue[] = [];

    this.validateDuplicateEntities(model, issues);

    for (const entity of model.entities) {
      this.validateDuplicateAttributes(entity, issues);
    }

    if (issues.length > 0) {
      throw new SemanticValidationError(issues);
    }
  }

  private validateDuplicateEntities(
    model: ApplicationModel,
    issues: SemanticValidationIssue[],
  ): void {
    const names = new Set<string>();

    model.entities.forEach((entity, index) => {
      if (names.has(entity.name)) {
        issues.push({
          code: "MODEL002",
          message: `Duplicate entity '${entity.name}'.`,
          path: `entities[${index}].name`,
        });

        return;
      }

      names.add(entity.name);
    });
  }

  private validateDuplicateAttributes(
    entity: Entity,
    issues: SemanticValidationIssue[],
  ): void {
    const names = new Set<string>();

    entity.attributes.forEach((attribute, index) => {
      if (names.has(attribute.name)) {
        issues.push({
          code: "MODEL003",
          message:
            `Duplicate attribute '${attribute.name}' in entity '${entity.name}'.`,
          path: `entities.${entity.name}.attributes[${index}].name`,
        });

        return;
      }

      names.add(attribute.name);
    });
  }
}