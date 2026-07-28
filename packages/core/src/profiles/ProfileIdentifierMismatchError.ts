export class ProfileIdentifierMismatchError extends Error {
  public readonly code = "PROFILE003";

  public constructor(
    public readonly requestedProfileId: string,
    public readonly manifestProfileId: string,
  ) {
    super(
      `Requested profile '${requestedProfileId}' does not match ` +
      `manifest profile '${manifestProfileId}'.`,
    );

    this.name = "ProfileIdentifierMismatchError";
  }
}
