import type { ApplicationModel } from "../model/ApplicationModel.js";
import type { Module } from "../profiles/Module.js";
import type { Profile } from "../profiles/Profile.js";

export interface GenerationRequest {
  readonly application: ApplicationModel;
  readonly profile: Profile;
  readonly modules: readonly Module[];
  /**
   * Every option the profile declares, resolved to a selected value or its
   * declared default. Producers read from here rather than defaulting on their
   * own; see `OptionResolver`.
   */
  readonly options: ReadonlyMap<string, string>;
}
