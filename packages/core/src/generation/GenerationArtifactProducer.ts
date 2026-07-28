import type { GenerationRequest } from "./GenerationRequest.js";
import type { TemplateInvocation } from "./TemplateInvocation.js";

export interface GenerationArtifactProducer {
  readonly profileId: string;
  readonly moduleId: string;

  produce(
    request: GenerationRequest,
  ): readonly TemplateInvocation[];
}
