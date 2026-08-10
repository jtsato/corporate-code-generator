import type { PrimitiveType } from "@corporate-code-generator/core";

export interface TypeScriptType {
  readonly name: string;
  readonly validationDecorator: string;
  readonly swaggerType: string;
}

export class TypeScriptTypeResolver {
  public resolve(type: PrimitiveType): TypeScriptType {
    switch (type) {
      case "string":
        return { name: "string", validationDecorator: "IsString", swaggerType: "String" };

      case "boolean":
        return { name: "boolean", validationDecorator: "IsBoolean", swaggerType: "Boolean" };

      case "int32":
      case "int64":
        return { name: "number", validationDecorator: "IsInt", swaggerType: "Number" };

      case "decimal":
        return { name: "number", validationDecorator: "IsNumber", swaggerType: "Number" };

      case "uuid":
        return { name: "string", validationDecorator: "IsUUID", swaggerType: "String" };

      case "date":
      case "datetime":
        return { name: "Date", validationDecorator: "IsDate", swaggerType: "Date" };
    }
  }
}
