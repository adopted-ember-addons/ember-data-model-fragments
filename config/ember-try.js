/*jshint node:true*/
module.exports = {
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
      name: 'ember-2-3',
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
      name: 'ember-2-4',
      bower: {
        devDependencies: {
          'ember': '2.4.5'
        },
        resolutions: {
          'ember': '2.4.5'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': '2.4.3'
        },
        resolutions: {
          'ember-data': '2.4.3'
        }
      }
    },

    {
      name: 'ember-2-5',
      bower: {
        devDependencies: {
          'ember': '2.5.1'
        },
        resolutions: {
          'ember': '2.5.1'
        }
      },
      npm: {
        devDependencies: {
          'ember-data': '2.5.3'
        },
        resolutions: {
          'ember-data': '2.5.3'
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
    },

    {
      name: 'ember-canary',
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
