import type { GenerationRequest } from "@corporate-code-generator/core";

export const PERSISTENCE_OPTION_ID = "persistence";

export type PersistenceOption = "memory" | "typeorm";

/**
 * Reads the resolved `persistence` option.
 *
 * It throws rather than defaulting: the profile declares the option and
 * `OptionResolver` fills in its default, so an absent value means the request
 * was not built through that path. Defaulting here would let one producer emit
 * TypeORM artifacts while another emitted the in-memory wiring for the same run.
 */
export function persistenceOf(request: GenerationRequest): PersistenceOption {
  const value = request.options.get(PERSISTENCE_OPTION_ID);

  if (value === "memory" || value === "typeorm") {
    return value;
  }

  throw new Error(
    `NestJS generation requires a resolved '${PERSISTENCE_OPTION_ID}' option; received '${String(value)}'.`,
  );
}
