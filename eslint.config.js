import { fileURLToPath } from 'url'
import { dirname } from 'path'
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs as tseslintConfigs } from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { importX } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import n from 'eslint-plugin-n';
import jsdoc from 'eslint-plugin-jsdoc';

export default defineConfig(
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  eslint.configs.recommended,
  tseslintConfigs.recommendedTypeChecked,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  n.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: [
          './packages/core/tsconfig.json',
          './packages/demo/tsconfig.build.json',
        ],
        tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
        errorOnUnsupportedTypeScriptVersion: false,
        noWarnOnMultipleProjects: true,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: [
            './tsconfig.json',
            './packages/core/tsconfig.json',
            './packages/demo/tsconfig.json',
          ],
        }),
      ],
    },
    rules: {
      'n/no-missing-import': 'off',
      'n/no-missing-require': 'off',
      'import-x/no-unresolved': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js'],
    extends: [tseslintConfigs.disableTypeChecked],
  },
  {
    files: ['packages/core/src/**/*.ts'],
    plugins: { jsdoc },
    rules: {
      // Require JSDoc on exported functions, classes, and public methods (not constructors)
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: true,
        checkConstructors: false,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false,
        },
      }],

      // Require @param for every documented parameter
      'jsdoc/require-param': ['error', { enableFixer: false }],
      'jsdoc/require-param-description': 'error',

      // Require @returns when a function returns a non-trivial value
      'jsdoc/require-returns': ['error', { forceReturnsWithAsync: false }],
      'jsdoc/require-returns-description': 'error',

      // Don't duplicate TypeScript types inside JSDoc
      'jsdoc/no-types': 'error',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',

      // Keep descriptions consistent
      'jsdoc/require-description': ['error', {
        contexts: ['ClassDeclaration'],
      }],
    },
  },
  {
    // CLI utility is a thin wrapper — individual method docs add noise over the class-level doc
    files: ['packages/core/src/utils/cli.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': 'off',
    },
  },
);
