/**
 * The workspace layout the multi-module profile renders into.
 *
 * The single-package and multi-module profiles share every source template. What
 * differs is where an artifact lands — the manifest's business — and how one
 * layer names another. In a folder layout that is a relative path whose depth
 * depends on the importing file; across workspace packages it is a package name,
 * the same from everywhere.
 *
 * The shared templates therefore ask for a *root* per layer and default it to the
 * relative path the single-package layout needs. Supplying these values is the
 * whole of what makes the same template render into a workspace.
 */
export interface NestJsPackageRoots {
  readonly corePackage: string;
  readonly infraPackage: string;
  readonly webApiPackage: string;
}

export interface NestJsWorkspacePackage {
  readonly name: string;
  readonly dependencies: readonly { readonly name: string; readonly version: string }[];
  readonly references: readonly string[];
}

export function packageRootsFor(applicationName: string): NestJsPackageRoots {
  return {
    corePackage: `@${applicationName}/core`,
    infraPackage: `@${applicationName}/infra-persistence`,
    webApiPackage: `@${applicationName}/web-api`,
  };
}

const WORKSPACE_VERSION = "0.1.0";

function workspaceDependency(applicationName: string, packageName: string): { readonly name: string; readonly version: string } {
  return { name: `@${applicationName}/${packageName}`, version: WORKSPACE_VERSION };
}

/**
 * Runtime dependencies per package, which are also the second enforcement of the
 * dependency direction: a package that does not declare another cannot resolve
 * it, whatever the lint says.
 *
 * The Core declares none at all. That is not an omission — it is the same claim
 * the boundary lint makes, expressed where npm can act on it.
 */
export function workspacePackagesFor(
  applicationName: string,
  persistence: "memory" | "typeorm",
): readonly NestJsWorkspacePackage[] {
  const ormDependencies = persistence === "typeorm"
    ? [
      { name: "@nestjs/typeorm", version: "^11.0.0" },
      { name: "typeorm", version: "^1.1.0" },
    ]
    : [];

  return [
    {
      name: "core",
      dependencies: [],
      references: [],
    },
    {
      name: "infra-persistence",
      dependencies: [
        workspaceDependency(applicationName, "core"),
        { name: "@nestjs/common", version: "^11.0.0" },
        ...ormDependencies,
      ],
      references: ["core"],
    },
    {
      name: "web-api",
      dependencies: [
        workspaceDependency(applicationName, "core"),
        { name: "@nestjs/common", version: "^11.0.0" },
        { name: "@nestjs/swagger", version: "^11.0.0" },
        { name: "class-transformer", version: "^0.5.1" },
        { name: "class-validator", version: "^0.14.1" },
        { name: "nestjs-i18n", version: "10.6.0" },
      ],
      references: ["core"],
    },
    {
      name: "bootstrap",
      dependencies: [
        workspaceDependency(applicationName, "core"),
        workspaceDependency(applicationName, "infra-persistence"),
        workspaceDependency(applicationName, "web-api"),
        { name: "@nestjs/common", version: "^11.0.0" },
        { name: "@nestjs/config", version: "^4.0.0" },
        { name: "@nestjs/core", version: "^11.0.0" },
        { name: "@nestjs/platform-express", version: "^11.0.0" },
        { name: "@nestjs/swagger", version: "^11.0.0" },
        { name: "nestjs-i18n", version: "10.6.0" },
        { name: "reflect-metadata", version: "^0.2.2" },
        { name: "rxjs", version: "^7.8.1" },
        ...ormDependencies,
        ...(persistence === "typeorm"
          ? [{ name: "pg", version: "^8.16.0" }, { name: "sql.js", version: "^1.13.0" }]
          : []),
      ],
      references: ["core", "infra-persistence", "web-api"],
    },
  ];
}
