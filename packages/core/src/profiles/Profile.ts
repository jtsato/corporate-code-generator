import type { Module } from "./Module.js";

export interface ProfileTechnology {
  readonly language: string;
  readonly languageVersion: string;
  readonly framework?: string;
}

export interface ProfileArchitecture {
  readonly style: string;
}

export interface ProfileTemplatePackReference {
  readonly id: string;
  readonly version: string;
}

export interface Profile {
  readonly id: string;
  readonly version: string;
  readonly technology: ProfileTechnology;
  readonly architecture: ProfileArchitecture;
  readonly modules: readonly Module[];
  readonly templatePack: ProfileTemplatePackReference;
}
