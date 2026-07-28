import type { TemplatePack } from "./TemplatePack.js";

export interface ResolvedTemplatePack {
  readonly directory: string;
  readonly templatePack: TemplatePack;
}
