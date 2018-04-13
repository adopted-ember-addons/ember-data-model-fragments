module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
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
        'index.js',
        'testem.js',
        'ember-cli-build.js',
        'config/**/*.js',
        'lib/**/*.js',
        'tests/dummy/config/**/*.js'
      ],
      excludedFiles: [
        'app/**',
        'addon/**'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
      env: {
        browser: false,
        node: true
      },
      plugins: ['node'],
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        // add your custom rules and overrides for node files here
        'camelcase': 'off'
      })
    }
  ]
};
