'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  return {
    packageManager: 'pnpm',
    scenarios: [
      {
        name: 'ember-lts-5.8',
        npm: {
          devDependencies: {
            'ember-data': '~4.12.0',
            '@ember-data/json-api': '~4.12.0',
            '@ember-data/legacy-compat': '~4.12.0',
            '@ember-data/model': '~4.12.0',
            '@ember-data/serializer': '~4.12.0',
            '@ember-data/store': '~4.12.0',
            '@ember/test-waiters': '^3.1.0',
            // ember-data 4.12 has peer deps on ember-inflector 4.x
            'ember-inflector': '^4.0.3',
            'ember-source': '~5.8.0',
          },
        },
      },
      {
        name: 'ember-lts-5.12',
        npm: {
          devDependencies: {
            'ember-data': '~4.12.0',
            '@ember-data/json-api': '~4.12.0',
            '@ember-data/legacy-compat': '~4.12.0',
            '@ember-data/model': '~4.12.0',
            '@ember-data/serializer': '~4.12.0',
            '@ember-data/store': '~4.12.0',
            '@ember/test-waiters': '^3.1.0',
            // ember-data 4.12 has peer deps on ember-inflector 4.x
            'ember-inflector': '^4.0.3',
            'ember-source': '~5.12.0',
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta'),
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary'),
          },
        },
      },
      {
        name: 'ember-data-4.12',
        npm: {
          devDependencies: {
            'ember-data': '~4.12.0',
            '@ember-data/json-api': '~4.12.0',
            '@ember-data/legacy-compat': '~4.12.0',
            '@ember-data/model': '~4.12.0',
            '@ember-data/serializer': '~4.12.0',
            '@ember-data/store': '~4.12.0',
            '@ember/test-waiters': '^3.1.0',
            // ember-data 4.12 has peer deps on ember-inflector 4.x
            'ember-inflector': '^4.0.3',
          },
        },
      },
      {
        name: 'ember-data-4.13',
        npm: {
          devDependencies: {
            'ember-data': '~4.13.0-alpha.9',
            '@ember-data/json-api': '~4.13.0-alpha.9',
            '@ember-data/legacy-compat': '~4.13.0-alpha.9',
            '@ember-data/model': '~4.13.0-alpha.9',
            '@ember-data/serializer': '~4.13.0-alpha.9',
            '@ember-data/store': '~4.13.0-alpha.9',
            '@ember/test-waiters': '^3.1.0',
          },
        },
      },
      {
        name: 'ember-data-5.8',
        npm: {
          devDependencies: {
            'ember-data': '~5.8.0',
            '@ember-data/json-api': '~5.8.0',
            '@ember-data/legacy-compat': '~5.8.0',
            '@ember-data/model': '~5.8.0',
            '@ember-data/serializer': '~5.8.0',
            '@ember-data/store': '~5.8.0',
            '@warp-drive/build-config': '~5.8.0',
            'ember-inflector': '^6.0.0',
          },
        },
      },
      {
        name: 'ember-data-5.3',
        npm: {
          devDependencies: {
            'ember-data': '~5.3.0',
            '@ember-data/json-api': '~5.3.0',
            '@ember-data/legacy-compat': '~5.3.0',
            '@ember-data/model': '~5.3.0',
            '@ember-data/serializer': '~5.3.0',
            '@ember-data/store': '~5.3.0',
            'ember-inflector': '^6.0.0',
          },
        },
      },
      embroiderSafe(),
      embroiderOptimized(),
    ],
  };
};
