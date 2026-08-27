import type { TemplatePack } from "./TemplatePack.js";

export interface ResolvedTemplatePack {
  /** The pack's own directory. */
  readonly directory: string;
  /**
   * Every directory a template file may be looked up in, nearest first: the
   * pack's own, then each pack it extends. A derived pack overrides an inherited
   * template file by placing one at the same relative path.
   */
  readonly directories: readonly string[];
  readonly templatePack: TemplatePack;
}
