/* eslint-env node */
module.exports = {
  useYarn: true,
  scenarios: [
    {
      name: 'ember-lts-2.16',
      npm: {
        devDependencies: {
          'ember-source': '~2.16.0'
        }
      }
    },
    {
      name: 'ember-release',
      bower: {
        dependencies: {
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
        dependencies: {
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
