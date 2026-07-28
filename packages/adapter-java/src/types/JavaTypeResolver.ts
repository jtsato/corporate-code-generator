import type {
  PrimitiveType,
} from "@corporate-code-generator/core";

import type {
  JavaType,
} from "./JavaType.js";

export class JavaTypeResolver {
  public resolve(
    type: PrimitiveType,
  ): JavaType {
    switch (type) {
      case "string":
        return {
          name: "String",
        };

      case "boolean":
        return {
          name: "Boolean",
        };

      case "int32":
        return {
          name: "Integer",
        };

      case "int64":
        return {
          name: "Long",
        };

      case "decimal":
        return {
          name: "BigDecimal",
          import: "java.math.BigDecimal",
        };

      case "uuid":
        return {
          name: "UUID",
          import: "java.util.UUID",
        };

      case "date":
        return {
          name: "LocalDate",
          import: "java.time.LocalDate",
        };

      case "datetime":
        return {
          name: "OffsetDateTime",
          import: "java.time.OffsetDateTime",
        };
    }
  }
}