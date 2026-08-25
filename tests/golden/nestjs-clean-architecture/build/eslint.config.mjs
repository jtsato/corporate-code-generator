import tsParser from '@typescript-eslint/parser';

/**
 * Layer boundaries for this generated project.
 *
 * Dependencies point inward. `core` knows nothing about the outer layers or about
 * any framework; `infra` and `web-api` each depend on `core` but never on each
 * other; only the composition root — `main.ts`, `app.module.ts` and `modules/` —
 * is allowed to see every layer, because binding them together is its job.
 *
 * These zones mirror the generator profile's module graph. Editing them here does
 * not change what the generator produces on the next run.
 *
 * Every layer gets exactly one config object. Flat config replaces rule options
 * rather than merging them, so a second object naming the same rule for the same
 * files would silently discard the first one's patterns.
 */
const layerZones = [
  {
    files: ['src/core/**/*.ts'],
    groups: [
      {
        group: ['**/infra', '**/infra/**', '**/web-api', '**/web-api/**', '**/modules/**', '**/app.module'],
        message: 'core must not depend on infra, web-api or the composition root. Dependencies point inward.',
      },
      {
        group: ['@nestjs/*', 'nestjs-i18n', 'class-validator', 'class-transformer', 'express', 'rxjs'],
        message: 'core must stay framework-free. Express the need as a core port and implement it in an outer layer.',
      },
    ],
  },
  {
    files: ['src/infra/**/*.ts'],
    groups: [
      {
        group: ['**/web-api', '**/web-api/**', '**/modules/**', '**/app.module'],
        message: 'infra must not depend on web-api or the composition root.',
      },
    ],
  },
  {
    files: ['src/web-api/**/*.ts'],
    groups: [
      {
        group: ['**/infra', '**/infra/**', '**/modules/**', '**/app.module'],
        message: 'web-api must not depend on infra or the composition root. Both are reached through core ports.',
      },
    ],
  },
];

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  ...layerZones.map((zone) => ({
    files: zone.files,
    languageOptions: { parser: tsParser, ecmaVersion: 2023, sourceType: 'module' },
    rules: {
      'no-restricted-imports': ['error', { patterns: zone.groups }],
    },
  })),
];
