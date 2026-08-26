import type { PrimitiveType } from "@corporate-code-generator/core";

export interface TypeOrmColumn {
  /** Rendered entries of the decorator's options object, in declaration order. */
  readonly options: readonly string[];
  readonly usesNumericTransformer: boolean;
}

/**
 * Maps a model primitive onto TypeORM column options that behave the same on
 * PostgreSQL and on the SQLite the generated tests run against.
 *
 * The portable set is smaller than it looks. `timestamp` is rejected by the
 * SQLite driver and `datetime` by the PostgreSQL one, so no single spelling of a
 * date column works on both; the only portable choice is to declare no `type` at
 * all and let each driver normalize the reflected TypeScript type — which is why
 * `emitDecoratorMetadata` is not optional for the generated project.
 *
 * Where inference is wrong, the type is named explicitly. `bigint` and `numeric`
 * come back from `pg` as strings and from SQLite as numbers, so both carry a
 * transformer that makes the property a `number` on either engine. Without it a
 * balance would compare and serialize differently depending on the database,
 * which is exactly the divergence the SQLite test strategy could otherwise hide.
 */
export class TypeOrmColumnResolver {
  public resolve(type: PrimitiveType, required: boolean): TypeOrmColumn {
    const options: string[] = [];
    let usesNumericTransformer = false;

    switch (type) {
      case "string":
      case "uuid":
      case "boolean":
      case "date":
      case "datetime":
        break;

      case "int32":
        options.push("type: 'integer'");
        break;

      case "int64":
        options.push("type: 'bigint'");
        usesNumericTransformer = true;
        break;

      case "decimal":
        // No precision or scale: an unconstrained `numeric` never truncates on
        // write. Reading one back into a TypeScript `number` still narrows to
        // float64, which the model's own type mapping already accepts.
        options.push("type: 'numeric'");
        usesNumericTransformer = true;
        break;
    }

    if (!required) {
      options.push("nullable: true");
    }

    if (usesNumericTransformer) {
      options.push("transformer: numericTransformer");
    }

    return { options, usesNumericTransformer };
  }
}
