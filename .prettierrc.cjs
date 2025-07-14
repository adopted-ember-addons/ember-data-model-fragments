'use strict';

// ---------------------------
// Import Sorting Groups
// ---------------------------

// Matches common testing frameworks and helpers
const testing = [
  '^ember-cli-htmlbars($|\\/)',
  '^qunit',
  '^ember-qunit',
  '^@ember/test-helpers',
  '^ember-exam',
  '^ember-cli-mirage',
  '^sinon',
  '^ember-sinon-qunit',
  '^(@[^\\/]+\\/)?[^\\/]+\\/test-support($|\\/)',
].join('|');

// Matches Ember core packages
const emberCore = [
  '^ember$',
  '^@ember\\/',
  '^ember-data($|\\/)',
  '^@ember-data\\/',
  '^@warp-drive\\/',
  '^@glimmer\\/',
  '^require$',
].join('|');

// Matches Ember addons and scoped Ember packages
const emberAddons = ['^@?ember-', '^@[^\\/]+\\/ember($|\\/|-)'].join('|');

// Matches third-party modules
const thirdParty = '<THIRD_PARTY_MODULES>';

const importOrder = [testing, emberCore, emberAddons, thirdParty].filter(
  Boolean
);

const importOrderParserPlugins = ['typescript', 'decorators-legacy'];
const importOrderSeparation = true;
const importOrderSortSpecifiers = true;

module.exports = {
  plugins: [
    'prettier-plugin-ember-template-tag',
    '@trivago/prettier-plugin-sort-imports',
  ],
  templateSingleQuote: false,
  trailingComma: 'es5',
  importOrder,
  importOrderParserPlugins,
  importOrderSeparation,
  importOrderSortSpecifiers,
  overrides: [
    {
      files: '*.{js,ts,cjs,mjs,gjs,gts}',
      options: {
        singleQuote: true,
      },
    },
  ],
};
