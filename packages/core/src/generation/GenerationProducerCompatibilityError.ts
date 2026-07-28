export class GenerationProducerCompatibilityError extends Error {
  public readonly code = "GEN001";

  public constructor(
    public readonly producerProfileId: string,
    public readonly producerModuleId: string,
    public readonly requestProfileId: string,
    public readonly requestModuleIds: readonly string[],
  ) {
    super(
      `Generation producer '${producerProfileId}/${producerModuleId}' ` +
      "is incompatible with the generation request.",
    );

    this.name = "GenerationProducerCompatibilityError";
  }
}
