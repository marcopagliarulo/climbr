import { fileURLToPath } from 'url'
import { dirname } from 'path'
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs as tseslintConfigs } from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { importX } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import n from 'eslint-plugin-n';

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
        warnOnUnsupportedTypeScriptVersion: false,
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
      'import-x/order': ['warn', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js'],
    extends: [tseslintConfigs.disableTypeChecked],
  },
);