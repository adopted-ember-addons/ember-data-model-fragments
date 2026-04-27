/**
 * Debugging:
 *   https://eslint.org/docs/latest/use/configure/debug
 *  ----------------------------------------------------
 *
 *   Print a file's calculated configuration
 *
 *     npx eslint --print-config path/to/file.js
 *
 *   Inspecting the config
 *
 *     npx eslint --inspect-config
 *
 */
import babelParser from '@babel/eslint-parser/experimental-worker';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import ember from 'eslint-plugin-ember/recommended';
import importPlugin from 'eslint-plugin-import';
import n from 'eslint-plugin-n';
import qunit from 'eslint-plugin-qunit';
import globals from 'globals';
import ts from 'typescript-eslint';

const esmParserOptions = {
  ecmaFeatures: { modules: true },
  ecmaVersion: 'latest',
};

const tsParserOptions = {
  projectService: true,
  tsconfigRootDir: import.meta.dirname,
};

export default defineConfig([
  globalIgnores([
    'dist/',
    'dist-*/',
    'declarations/',
    'node_modules/',
    'coverage/',
    'tmp/',
    '!**/.*',
  ]),
  js.configs.recommended,
  prettier,
  ember.configs.base,
  ember.configs.gjs,
  ember.configs.gts,
  /**
   * https://eslint.org/docs/latest/use/configure/configuration-files#configuring-linter-options
   */
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
    },
  },
  {
    files: ['**/*.{js,gjs}'],
    languageOptions: {
      parserOptions: esmParserOptions,
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.{ts,gts}'],
    languageOptions: {
      parser: ember.parser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.browser,
      },
    },
    extends: [
      ...ts.configs.recommendedTypeChecked,
      // https://github.com/ember-cli/ember-addon-blueprint/issues/119
      {
        ...ts.configs.eslintRecommended,
        files: undefined,
      },
      ember.configs.gts,
    ],
  },
  {
    files: ['src/**/*'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      // require relative imports use full extensions
      'import/extensions': ['error', 'always', { ignorePackages: true }],
    },
  },
  /**
   * src/ TS files: disable type-checked unsafe-* rules globally for the source
   * tree because ember-data internals are largely untyped, which makes nearly
   * every interaction "unsafe" by typescript-eslint's strict standards. These
   * can be re-enabled per-file as types are tightened.
   */
  {
    files: ['src/**/*.{ts,gts}', 'tests/**/*.{ts,gts}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-nocheck': false, 'ts-expect-error': 'allow-with-description' },
      ],
    },
  },
  {
    ...qunit.configs.recommended,
    files: ['tests/**/*-test.{js,gjs,ts,gts}'],
    plugins: {
      qunit,
    },
    rules: {
      'ember/no-runloop': 'off',
      // Tests intentionally evaluate getter expressions to verify side effects.
      '@typescript-eslint/no-unused-expressions': 'off',
      // Tests pass async callbacks to expectAssertion etc. that don't await.
      '@typescript-eslint/require-await': 'off',
    },
  },
  /**
   * CJS node files
   */
  {
    files: ['**/*.cjs'],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },
  /**
   * ESM node files
   */
  {
    files: ['**/*.mjs'],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: esmParserOptions,
      globals: {
        ...globals.node,
      },
    },
  },
]);
