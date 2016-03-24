/*jshint node:true*/
module.exports = {
  scenarios: [
    {
      name: 'default',
      bower: {
        dependencies: { }
      }
    },

    {
      name: 'ember-2-3',
      command: 'npm run install-and-ember-test',
      bower: {
        devDependencies: {
          'ember': '2.3.1'
        },
        resolutions: {
          'ember': '2.3.1'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': '2.3.3'
        },
        resolutions: {
          'ember-data': '2.3.3'
        }
      }
    },

    {
      name: 'ember-release',
      command: 'npm run install-and-ember-test',
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
          'ember-data': 'emberjs/data#release'
        },
        resolutions: {
          'ember-data': 'release'
        }
      }
    },

    {
      name: 'ember-beta',
      command: 'npm run install-and-ember-test',
      allowedToFail: true,
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
          'ember-data': 'emberjs/data#beta'
        },
        resolutions: {
          'ember-data': 'beta'
        }
      }
    },

    {
      name: 'ember-canary',
      command: 'npm run install-and-ember-test',
      allowedToFail: true,
      bower: {
        devDependencies: {
          'ember': 'components/ember#canary'
        },
        resolutions: {
          'ember': 'canary'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': 'emberjs/data#master'
        },
        resolutions: {
          'ember-data': 'master'
        }
      }
    }
  ]
};
