'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary')
  ])
    .then((urls) => {
      const [releaseUrl, betaUrl, canaryUrl] = urls;

      return {
        useYarn: true,
        scenarios: [
          {
            name: 'ember-3.5.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.5',
                'ember-data': '~3.5'
              }
            }
          },
          {
            name: 'ember-3.6.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.6',
                'ember-data': '~3.6'
              }
            }
          },
          {
            name: 'ember-3.7.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.7',
                'ember-data': '~3.7'
              }
            }
          },
          {
            name: 'ember-3.8.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.8',
                'ember-data': '~3.8'
              }
            }
          },
          {
            name: 'ember-3.9.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.9',
                'ember-data': '~3.9'
              }
            }
          },
          {
            name: 'ember-3.10.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.10',
                'ember-data': '~3.10'
              }
            }
          },
          {
            name: 'ember-3.11.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.11',
                'ember-data': '~3.11'
              }
            }
          },
          {
            name: 'ember-3.12.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.12',
                'ember-data': '~3.12'
              }
            }
          },
          {
            name: 'ember-3.13.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.13',
                'ember-data': '~3.13'
              }
            }
          },
          {
            name: 'ember-3.14.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.14',
                'ember-data': '~3.14'
              }
            }
          },
          {
            name: 'ember-3.15.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.15',
                'ember-data': '~3.15'
              }
            }
          },
          {
            name: 'ember-3.16.0',
            npm: {
              devDependencies: {
                'ember-source': '~3.16',
                'ember-data': '~3.16'
              }
            }
          },
          {
            name: 'ember-release',
            npm: {
              devDependencies: {
                'ember-source': releaseUrl,
                'ember-data': 'latest'
              }
            }
          },
          {
            name: 'ember-beta',
            npm: {
              devDependencies: {
                'ember-source': betaUrl,
                'ember-data': 'beta'
              }
            }
          },
          {
            name: 'ember-canary',
            npm: {
              devDependencies: {
                'ember-source': canaryUrl,
                'ember-data': 'canary'
              }
            }
          },
          {
            name: 'ember-default',
            npm: {
              devDependencies: {}
            }
          }]
      };
    });
};
