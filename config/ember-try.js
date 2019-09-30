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
      scenarios: [
      {
        name: 'ember-3.13.0',
        npm: {
          devDependencies: {
            'ember-source': '3.13.0',
            'ember-data': '3.13.0'
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
