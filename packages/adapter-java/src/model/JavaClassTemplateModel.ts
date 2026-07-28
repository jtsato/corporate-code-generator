import type {
  JavaFieldModel,
} from "./JavaFieldModel.js";

export interface JavaClassTemplateModel {
  readonly packageName: string;
  readonly imports: readonly string[];
  readonly className: string;
  readonly modifiers: readonly string[];
  readonly fields: readonly JavaFieldModel[];
}