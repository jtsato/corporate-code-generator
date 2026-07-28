import { access } from "node:fs/promises";
import { join } from "node:path";

import {
  ProfileIdentifierMismatchError,
} from "./ProfileIdentifierMismatchError.js";
import {
  ProfileLoader,
} from "./ProfileLoader.js";
import {
  ProfileNotFoundError,
} from "./ProfileNotFoundError.js";
import type { Profile } from "./Profile.js";

export class ProfileResolver {
  public constructor(
    private readonly profilesDirectory: string,
    private readonly profileLoader: ProfileLoader = new ProfileLoader(),
  ) {}

  public async resolve(profileId: string): Promise<Profile> {
    const profilePath = join(
      this.profilesDirectory,
      profileId,
      "profile.yaml",
    );

    try {
      await access(profilePath);
    } catch {
      throw new ProfileNotFoundError(profileId);
    }

    const profile = await this.profileLoader.load(profilePath);

    if (profile.id !== profileId) {
      throw new ProfileIdentifierMismatchError(profileId, profile.id);
    }

    return profile;
  }
}
