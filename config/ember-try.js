'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary')
  ]).then((urls) => {
    return {
      useYarn: true,
      scenarios: [{
        name: 'ember-lts-2.16',
        npm: {
          devDependencies: {
            'ember-source': '~2.16.0'
          }
        }
      },
      {
        name: 'ember-lts-2.18',
        npm: {
          devDependencies: {
            'ember-source': '~2.18.0'
          }
        }
      },
      {
        name: 'ember-3.5.0',
        npm: {
          devDependencies: {
            'ember-source': '3.5.0',
            'ember-data': '3.5.0'
          }
        }
      },
      {
        name: 'ember-3.6.0',
        npm: {
          devDependencies: {
            'ember-source': '3.6.0',
            'ember-data': '3.6.0'
          }
        }
      },
      {
        name: 'ember-3.7.0',
        npm: {
          devDependencies: {
            'ember-source': '3.7.0',
            'ember-data': '3.7.0'
          }
        }
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': urls[0],
            'ember-data': 'emberjs/data#release'
          }
        }
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': urls[1],
            'ember-data': 'emberjs/data#beta'
          }
        }
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': urls[2],
            'ember': 'components/ember#canary'
          }
        }
      },
      {
        name: 'ember-default',
        npm: {
          devDependencies: {
            'ember-data': 'emberjs/data#master'
          }
        }
      }]
    };
  });
};
