import type { ApplicationModel } from "../model/ApplicationModel.js";
import type {
  ApplicationModelDocument,
  AttributeDocument,
  EntityDocument,
} from "../model/document/ApplicationModelDocument.js";
import type { Attribute } from "../model/Attribute.js";
import type { Entity } from "../model/Entity.js";

export class ModelParser {
  public parse(
    document: ApplicationModelDocument,
  ): ApplicationModel {
    return {
      schemaVersion: document.schemaVersion,
      name: document.application.name,
      ...(document.application.namespace !== undefined
        ? { namespace: document.application.namespace }
        : {}),
      entities: document.entities.map((entity) =>
        this.parseEntity(entity),
      ),
    };
  }

  private parseEntity(document: EntityDocument): Entity {
    return {
      name: document.name,
      attributes: document.attributes.map((attribute) =>
        this.parseAttribute(attribute),
      ),
      uniqueGroups: document.uniqueGroups?.map((group) => [...group]) ?? [],
      audited: document.audited ?? false,
    };
  }

  private parseAttribute(
    document: AttributeDocument,
  ): Attribute {
    return {
      name: document.name,
      type: document.type,
      required: document.required ?? false,
      identifier: document.identifier ?? false,
      unique: document.unique ?? false,
    };
  }
}
