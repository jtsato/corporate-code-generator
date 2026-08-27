import parser from '@typescript-eslint/parser';

/**
 * Layer boundaries, enforced across workspace packages.
 *
 * In the single-package layout these are relative-path zones; here a boundary
 * violation is an import of another package by name, which is both easier to
 * write and easier to forbid. One config object per zone, because ESLint's flat
 * config replaces rule options rather than merging them: two objects naming
 * `no-restricted-imports` for the same files would silently discard the first.
 */
const zones = [
  {
    files: ['packages/core/**/*.ts'],
    patterns: [
      '@wallet-service/infra-persistence',
      '@wallet-service/infra-persistence/*',
      '@wallet-service/web-api',
      '@wallet-service/web-api/*',
      '@wallet-service/bootstrap',
      '@wallet-service/bootstrap/*',
      '@nestjs/*',
      'class-validator',
      'class-transformer',
      'nestjs-i18n',
      'typeorm',
      '@nestjs/typeorm',
    ],
  },
  {
    files: ['packages/infra-persistence/**/*.ts'],
    patterns: [
      '@wallet-service/web-api',
      '@wallet-service/web-api/*',
      '@wallet-service/bootstrap',
      '@wallet-service/bootstrap/*',
    ],
  },
  {
    files: ['packages/web-api/**/*.ts'],
    patterns: [
      '@wallet-service/infra-persistence',
      '@wallet-service/infra-persistence/*',
      '@wallet-service/bootstrap',
      '@wallet-service/bootstrap/*',
    ],
  },
];

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  },
  ...zones.map((zone) => ({
    files: zone.files,
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: zone.patterns,
              message: 'Dependencies point inward. Only the composition root sees every package.',
            },
          ],
        },
      ],
    },
  })),
];
