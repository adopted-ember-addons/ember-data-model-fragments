/*jshint node:true*/
module.exports = function() {
  return {
  scenarios: [
    {
      name: 'default',
      bower: {
        devDependencies: { }
      },
      npm: {
        devDependencies: { }
      }
    },

    {
      name: 'ember-2-11',
      bower: {
        devDependencies: {
          'ember': '~2.11.0-beta.4',
        },
        resolutions: {
          'ember': '~2.11.0-beta.4',
        }
      },
      npm: {
        devDependencies: {
          'ember-data': '~2.11.0'
        },
        resolutions: {
          'ember-data': '~2.11.0'
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
          'ember-data': 'emberjs/data#release'
        },
        resolutions: {
          'ember-data': 'release'
        }
      }
    },

    {
      name: 'ember-beta',
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
    }
  ]};
};
