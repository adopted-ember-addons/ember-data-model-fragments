/* eslint-env node */
module.exports = {
  scenarios: [
    {
      name: 'ember-2-14',
      bower: {
        devDependencies: {
          'ember': '~2.14.0'
        },
        resolutions: {
          'ember': '~2.14.0'
        }
      },
      npm: {
        devDependencies: {
          'ember-source': null,
          'ember-data': '~2.14.1'
        }
      }
    },
    {
      name: 'ember-release',
      bower: {
        devDependencies: {
          'ember': 'components/ember#release'
        },
        resolutions: {
          'ember': 'release'
        }
      },
      npm: {
        devDependencies: {
          'ember-source': null,
          'ember-data': 'emberjs/data#release'
        }
      }
    },
    {
      name: 'ember-beta',
      bower: {
        devDependencies: {
          'ember': 'components/ember#beta'
        },
        resolutions: {
          'ember': 'beta'
        }
      },
      npm: {
        devDependencies: {
          'ember-source': null,
          'ember-data': 'emberjs/data#beta'
        }
      }
    },
    {
      name: 'ember-canary',
      bower: {
        dependencies: {
          'ember': 'components/ember#canary'
        },
        resolutions: {
          'ember': 'canary'
        }
      },
      npm: {
        devDependencies: {
          'ember-source': null,
          'ember-data': 'emberjs/data#master'
        }
      }
    },
    {
      name: 'ember-default',
      npm: {
        devDependencies: {}
      }
    }
  ]
};
