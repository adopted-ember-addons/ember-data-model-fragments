module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
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
  }
};
