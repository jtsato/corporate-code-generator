/**
 * A technology option a profile exposes, in the sense ADR-017 gave the term: an
 * implementation choice inside a capability, not a physical module and not a
 * capability of its own.
 *
 * The profile declares the option and its allowed values; the invocation selects
 * one. Declaring the default here rather than in a producer is what keeps an
 * unselected option from meaning different things in different producers.
 */
export interface ProfileOption {
  readonly id: string;
  readonly values: readonly string[];
  readonly defaultValue: string;
}
