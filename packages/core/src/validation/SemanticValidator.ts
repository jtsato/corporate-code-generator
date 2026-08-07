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
      this.validateUniqueGroups(entity, issues);
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

  private validateUniqueGroups(
    entity: Entity,
    issues: SemanticValidationIssue[],
  ): void {
    const attributeNames = new Set(
      entity.attributes.map((attribute) => attribute.name),
    );

    entity.uniqueGroups?.forEach((group, groupIndex) => {
      if (group.length < 2) {
        issues.push({
          code: "MODEL006",
          message:
            `Unique group in entity '${entity.name}' must contain at least two attributes.`,
          path: `entities.${entity.name}.uniqueGroups[${groupIndex}]`,
        });
      }

      const groupMembers = new Set<string>();

      group.forEach((attributeName, attributeIndex) => {
        if (groupMembers.has(attributeName)) {
          issues.push({
            code: "MODEL007",
            message:
              `Duplicate attribute '${attributeName}' in unique group for entity '${entity.name}'.`,
            path:
              `entities.${entity.name}.uniqueGroups[${groupIndex}][${attributeIndex}]`,
          });
        } else {
          groupMembers.add(attributeName);
        }

        if (!attributeNames.has(attributeName)) {
          issues.push({
            code: "MODEL008",
            message:
              `Unique group in entity '${entity.name}' references unknown attribute '${attributeName}'.`,
            path:
              `entities.${entity.name}.uniqueGroups[${groupIndex}][${attributeIndex}]`,
          });
        }
      });
    });

    const groups = new Map<string, number>();
    entity.uniqueGroups?.forEach((group, groupIndex) => {
      const canonicalGroup = [...new Set(group)].sort((left, right) => left.localeCompare(right, "en")).join("\u0000");
      const previousIndex = groups.get(canonicalGroup);
      if (previousIndex !== undefined) {
        issues.push({
          code: "MODEL009",
          message:
            `Duplicate unique group in entity '${entity.name}'; it is equivalent to group ${previousIndex}.`,
          path: `entities.${entity.name}.uniqueGroups[${groupIndex}]`,
        });
      } else {
        groups.set(canonicalGroup, groupIndex);
      }
    });
  }
}
