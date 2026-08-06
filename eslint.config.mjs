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
import babelParser from '@babel/eslint-parser';
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

/**
 * The unsafe-`any` lint family, switched off.
 *
 * Both the addon internals and the test suite sit on ember-data API surfaces
 * that ship no usable types, so `any` is load-bearing at those boundaries.
 * See the individual blocks below for what each one is up against. Tighten
 * incrementally as ember-data's types stabilize.
 */
const unsafeAnyRulesOff = {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/unbound-method': 'off',
};

export default defineConfig([
  globalIgnores([
    'dist/',
    'dist-*/',
    'declarations/',
    'node_modules/',
    'coverage/',
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
  {
    /**
     * The addon integrates with ember-data by reaching into private API
     * (`store._instanceCache`, the cache manager, snapshot internals, ...)
     * that has no published types.
     */
    files: ['src/**/*.ts'],
    rules: {
      ...unsafeAnyRulesOff,
      // Several public classes are built with `EmberObject.extend()`, whose
      // type surface is declared as an interface beside the runtime value.
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
    },
  },
  {
    ...qunit.configs.recommended,
    files: ['tests/**/*-test.{js,gjs,ts,gts}'],
    plugins: {
      qunit,
    },
    rules: {
      /**
       * The suite drives ember-data through its legacy string-keyed API
       * (`store.push`, `peekRecord`, `pushPayload`, ...), which resolves to
       * `unknown` without a per-call-site model type argument, and asserts
       * against private cache internals. The shared `store` / `owner` /
       * record handles are therefore untyped.
       */
      ...unsafeAnyRulesOff,
      'ember/no-runloop': 'off',
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
  /**
   * Blueprint files: index.js is CJS (consumed by ember-cli at runtime in
   * the host app), template files under blueprints/<name>/files/ are ESM
   * fragments processed by the blueprint engine.
   */
  {
    files: ['blueprints/*/index.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
  },
  globalIgnores(['blueprints/*/files/']),
]);
