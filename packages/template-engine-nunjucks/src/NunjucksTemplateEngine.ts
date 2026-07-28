import nunjucks from "nunjucks";

import type {
  TemplateEngine,
} from "@corporate-code-generator/core";

export class NunjucksTemplateEngine
  implements TemplateEngine {

  private readonly environment: nunjucks.Environment;

  public constructor(
    templateDirectories: readonly string[],
  ) {
    const loader = new nunjucks.FileSystemLoader(
      [...templateDirectories],
      {
        noCache: true,
      },
    );

    this.environment =
      new nunjucks.Environment(loader, {
        autoescape: false,
        throwOnUndefined: true,
      });
  }

  public async render(
    template: string,
    model: object,
  ): Promise<string> {
    return await new Promise<string>(
      (resolve, reject) => {
        this.environment.render(
          template,
          model,
          (error, result) => {
            if (error !== null) {
              reject(error);
              return;
            }

            if (result === null) {
              reject(
                new Error(
                  `Template '${template}' produced no result.`,
                ),
              );
              return;
            }

            resolve(result);
          },
        );
      },
    );
  }
}