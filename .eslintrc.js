'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: ['ember'],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:ember-suave/base',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
  },
  rules: {
    // Overrides
    'brace-style': 'off',
    'object-shorthand': ['error', 'methods'],

    // Taken from ember-suave/recommended
    'new-cap': [
      'error',
      {
        capIsNewExceptions: ['A'],
      },
    ],
    'no-var': 'error',
    'no-useless-rename': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',
  },
  overrides: [
    // node files
    {
      files: [
        './.eslintrc.js',
        './.prettierrc.js',
        './.template-lintrc.js',
        './ember-cli-build.js',
        './index.js',
        './testem.js',
        './blueprints/*/index.js',
        './config/**/*.js',
        './lib/**/*.js',
        './tests/dummy/config/**/*.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      extends: ['plugin:n/recommended'],
    },
    {
      // test files
      files: ['tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended'],
    },
  ],
};
