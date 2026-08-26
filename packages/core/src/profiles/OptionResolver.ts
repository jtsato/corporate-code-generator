import {
  OptionResolutionError,
  type OptionResolutionIssue,
} from "./OptionResolutionError.js";
import type { ProfileOption } from "./ProfileOption.js";

/**
 * Turns the options a profile declares plus the assignments an invocation makes
 * into the complete set of values generation will run with.
 *
 * Every declared option is present in the result, holding either the selected
 * value or the declared default, so a producer that reads an option it knows the
 * profile declares never has to invent a fallback. A fallback in a producer is
 * how two producers end up disagreeing about what "unset" means.
 */
export class OptionResolver {
  public resolve(
    declaredOptions: readonly ProfileOption[],
    assignments: ReadonlyMap<string, string>,
  ): ReadonlyMap<string, string> {
    const optionsById = new Map<string, ProfileOption>();
    const issues: OptionResolutionIssue[] = [];

    for (const option of declaredOptions) {
      if (optionsById.has(option.id)) {
        issues.push({
          code: "OPTION001",
          message: `Duplicate option '${option.id}'.`,
          optionId: option.id,
        });
        continue;
      }

      if (!option.values.includes(option.defaultValue)) {
        issues.push({
          code: "OPTION002",
          message:
            `Option '${option.id}' defaults to '${option.defaultValue}', ` +
            `which is not one of: ${option.values.join(", ")}.`,
          optionId: option.id,
        });
        continue;
      }

      optionsById.set(option.id, option);
    }

    for (const [optionId, value] of assignments) {
      const option = optionsById.get(optionId);

      if (option === undefined) {
        issues.push({
          code: "OPTION003",
          message: `Requested option '${optionId}' is not declared by this profile.`,
          optionId,
        });
        continue;
      }

      if (!option.values.includes(value)) {
        issues.push({
          code: "OPTION004",
          message:
            `Option '${optionId}' does not accept '${value}'. ` +
            `Allowed values: ${option.values.join(", ")}.`,
          optionId,
        });
      }
    }

    if (issues.length > 0) {
      throw new OptionResolutionError(issues);
    }

    return new Map(
      [...optionsById.values()].map((option) => [
        option.id,
        assignments.get(option.id) ?? option.defaultValue,
      ]),
    );
  }
}
