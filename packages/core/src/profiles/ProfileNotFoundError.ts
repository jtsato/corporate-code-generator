export class ProfileNotFoundError extends Error {
  public readonly code = "PROFILE001";

  public constructor(
    public readonly profileId: string,
  ) {
    super(`Profile '${profileId}' was not found.`);

    this.name = "ProfileNotFoundError";
  }
}
