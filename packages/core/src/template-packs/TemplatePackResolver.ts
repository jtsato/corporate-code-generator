import { access } from "node:fs/promises";
import { join } from "node:path";

import { TemplatePackLoader } from "./TemplatePackLoader.js";
import type { ResolvedTemplatePack } from "./ResolvedTemplatePack.js";
import {
  TemplatePackResolutionError,
} from "./TemplatePackResolutionError.js";

export class TemplatePackResolver {
  public constructor(
    private readonly templatePacksDirectory: string,
    private readonly templatePackLoader: TemplatePackLoader = new TemplatePackLoader(),
  ) {}

  public async resolve(
    reference: { readonly id: string; readonly version: string },
  ): Promise<ResolvedTemplatePack> {
    const { id, version } = reference;
    const manifestPath = join(this.templatePacksDirectory, id, "manifest.yaml");

    try {
      await access(manifestPath);
    } catch {
      throw new TemplatePackResolutionError(
        "TEMPLATE001",
        `Template pack '${id}' was not found.`,
      );
    }

    const pack = await this.templatePackLoader.load(manifestPath);

    if (pack.id !== id) {
      throw new TemplatePackResolutionError(
        "TEMPLATE003",
        `Template pack id '${pack.id}' does not match requested id '${id}'.`,
      );
    }

    if (pack.version !== version) {
      throw new TemplatePackResolutionError(
        "TEMPLATE004",
        `Template pack version '${pack.version}' does not match requested version '${version}'.`,
      );
    }

    return {
      directory: join(this.templatePacksDirectory, id),
      templatePack: pack,
    };
  }
}
