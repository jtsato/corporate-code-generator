import type { ApplicationModel } from "../model/ApplicationModel.js";
import type { Module } from "../profiles/Module.js";
import type { Profile } from "../profiles/Profile.js";

export interface GenerationRequest {
  readonly application: ApplicationModel;
  readonly profile: Profile;
  readonly modules: readonly Module[];
}
