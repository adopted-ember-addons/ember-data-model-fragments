module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  plugins: [
    'ember'
  ],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:ember-suave/base'
  ],
  env: {
    browser: true
  },
  rules: {
    // Overrides
    'brace-style': 'off',
    'object-shorthand': ['error', 'methods'],
    'operator-linebreak': ['error', 'after'],

    // Taken from ember-suave/recommended
    'new-cap': ['error', {
      'capIsNewExceptions': ['A']
    }],
    'no-var': 'error',
    'no-useless-rename': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error'
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'index.js',
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js'
      ],
      excludedFiles: [
        'addon/**',
        'addon-test-support/**',
        'app/**',
        'tests/dummy/app/**'
      ],
      parserOptions: {
        sourceType: 'script'
      },
      env: {
        browser: false,
        node: true
      },
      plugins: ['node'],
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        // add your custom rules and overrides for node files here
      })
    }
  ]
};
