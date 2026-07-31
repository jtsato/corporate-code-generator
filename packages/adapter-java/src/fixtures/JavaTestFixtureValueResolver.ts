import type { PrimitiveType } from "@corporate-code-generator/core";

export interface JavaTestFixtureValue {
  readonly javaExpression: string;
  readonly jsonLiteral: string;
}

export class JavaTestFixtureValueResolver {
  public resolve(type: PrimitiveType, occurrenceIndex = 0): JavaTestFixtureValue {
    if (!Number.isInteger(occurrenceIndex) || occurrenceIndex < 0) {
      throw new Error("Java test fixture occurrence index must be a non-negative integer.");
    }

    switch (type) {
      case "string": {
        const value = occurrenceIndex === 0 ? "sample" : `sample-${occurrenceIndex + 1}`;
        return { javaExpression: JSON.stringify(value), jsonLiteral: JSON.stringify(value) };
      }
      case "boolean": {
        const value = occurrenceIndex % 2 === 0;
        return { javaExpression: String(value), jsonLiteral: String(value) };
      }
      case "int32": {
        const value = 42 + occurrenceIndex;
        return { javaExpression: String(value), jsonLiteral: String(value) };
      }
      case "int64": {
        const value = 42 + occurrenceIndex;
        return { javaExpression: `${value}L`, jsonLiteral: String(value) };
      }
      case "decimal": {
        const value = `${123 + occurrenceIndex}.45`;
        return {
          javaExpression: `new BigDecimal("${value}")`,
          jsonLiteral: value,
        };
      }
      case "uuid": {
        const suffix = String(111_111_111_111 + occurrenceIndex).padStart(12, "0");
        const value = `11111111-1111-1111-1111-${suffix}`;
        return {
          javaExpression: `UUID.fromString("${value}")`,
          jsonLiteral: JSON.stringify(value),
        };
      }
      case "date": {
        const value = toIsoDate(occurrenceIndex);
        return {
          javaExpression: `LocalDate.parse("${value}")`,
          jsonLiteral: JSON.stringify(value),
        };
      }
      case "datetime": {
        const value = toIsoDateTime(occurrenceIndex);
        return {
          javaExpression: `OffsetDateTime.parse("${value}")`,
          jsonLiteral: JSON.stringify(value),
        };
      }
    }
  }
}

function toIsoDate(occurrenceIndex: number): string {
  return new Date(Date.UTC(2026, 0, 15 + occurrenceIndex))
    .toISOString()
    .slice(0, 10);
}

function toIsoDateTime(occurrenceIndex: number): string {
  return new Date(Date.UTC(2026, 0, 15, 10, 30 + occurrenceIndex))
    .toISOString()
    .replace(".000Z", "Z");
}
