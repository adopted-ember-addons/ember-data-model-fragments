// ember-try scenarios for ember-data-model-fragments.
//
// Matrix is derived from the historical v1 ember-try config
// (tests/dummy/config/ember-try.js prior to v2 migration) and adapted to
// the v2 addon blueprint shape. We test against:
//   - ember-source LTS 5.8 / 5.12 (require @embroider/compat shim)
//   - ember-source LTS 6.4, latest, beta, alpha
//   - ember-data 4.12 / 4.13 / 5.3 / 5.8 (declared peer range is >= 4.12)

// When building this addon for older Ember versions we need to ship the
// classic ember-cli build entry alongside @embroider/compat.
const compatFiles = {
  'ember-cli-build.cjs': `const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');
module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  let app = new EmberApp(defaults);
  return compatBuild(app, buildOnce);
};`,
  'config/optional-features.json': JSON.stringify({
    'application-template-wrapper': false,
    'default-async-observers': true,
    'jquery-integration': false,
    'template-only-glimmer-components': true,
    'no-implicit-route-model': true,
  }),
};

const compatDeps = {
  '@embroider/compat': '^4.0.3',
  'ember-cli': '^5.12.0',
  'ember-auto-import': '^2.10.0',
  '@ember/optional-features': '^2.2.0',
};

// ember-data 4.12 needs the legacy peer on ember-inflector 4.x.
const emberData412Deps = {
  'ember-data': '~4.12.0',
  '@ember-data/json-api': '~4.12.0',
  '@ember-data/legacy-compat': '~4.12.0',
  '@ember-data/model': '~4.12.0',
  '@ember-data/serializer': '~4.12.0',
  '@ember-data/store': '~4.12.0',
  '@ember/test-waiters': '^3.1.0',
  'ember-inflector': '^4.0.3',
};

const emberData413Deps = {
  'ember-data': '~4.13.0-alpha.9',
  '@ember-data/json-api': '~4.13.0-alpha.9',
  '@ember-data/legacy-compat': '~4.13.0-alpha.9',
  '@ember-data/model': '~4.13.0-alpha.9',
  '@ember-data/serializer': '~4.13.0-alpha.9',
  '@ember-data/store': '~4.13.0-alpha.9',
  '@ember/test-waiters': '^3.1.0',
};

const emberData53Deps = {
  'ember-data': '~5.3.0',
  '@ember-data/json-api': '~5.3.0',
  '@ember-data/legacy-compat': '~5.3.0',
  '@ember-data/model': '~5.3.0',
  '@ember-data/serializer': '~5.3.0',
  '@ember-data/store': '~5.3.0',
  'ember-inflector': '^6.0.0',
};

const emberData58Deps = {
  'ember-data': '~5.8.0',
  '@ember-data/json-api': '~5.8.0',
  '@ember-data/legacy-compat': '~5.8.0',
  '@ember-data/model': '~5.8.0',
  '@ember-data/serializer': '~5.8.0',
  '@ember-data/store': '~5.8.0',
  '@warp-drive/build-config': '~5.8.0',
  'ember-inflector': '^6.0.0',
};

export default {
  scenarios: [
    {
      name: 'ember-lts-5.8',
      npm: {
        devDependencies: {
          'ember-source': '~5.8.0',
          ...emberData412Deps,
          ...compatDeps,
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-lts-5.12',
      npm: {
        devDependencies: {
          'ember-source': '~5.12.0',
          ...emberData412Deps,
          ...compatDeps,
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-lts-6.4',
      npm: {
        devDependencies: {
          'ember-source': 'npm:ember-source@~6.4.0',
        },
      },
    },
    {
      name: 'ember-latest',
      npm: {
        devDependencies: {
          'ember-source': 'npm:ember-source@latest',
        },
      },
    },
    {
      name: 'ember-beta',
      npm: {
        devDependencies: {
          'ember-source': 'npm:ember-source@beta',
        },
      },
    },
    {
      name: 'ember-alpha',
      npm: {
        devDependencies: {
          'ember-source': 'npm:ember-source@alpha',
        },
      },
    },
    {
      name: 'ember-data-4.12',
      npm: {
        devDependencies: {
          ...emberData412Deps,
          ...compatDeps,
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-data-4.13',
      npm: {
        devDependencies: {
          ...emberData413Deps,
          ...compatDeps,
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-data-5.3',
      npm: {
        devDependencies: emberData53Deps,
      },
    },
    {
      name: 'ember-data-5.8',
      npm: {
        devDependencies: emberData58Deps,
      },
    },
  ],
};
