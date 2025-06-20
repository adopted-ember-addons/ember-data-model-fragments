export default scenarios();

function scenarios() {
  return {
    scenarios: [
      compatEmberScenario('ember-lts-5.8', '~5.4.0'),
      compatEmberScenario('ember-lts-5.12', '~5.12.0'),
      emberScenario('~6.4.0'),
      emberScenario('latest'),
      emberScenario('beta'),
      emberScenario('alpha'),
    ],
  };
}

function emberScenario(tag) {
  return {
    name: `ember-${tag}`,
    npm: {
      devDependencies: {
        'ember-source': `npm:ember-source@${tag}`,
      },
    },
  };
}

function emberCliBuildJS() {
  return `const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');
module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  let app = new EmberApp(defaults);
  return compatBuild(app, buildOnce);
};`;
}

function compatEmberScenario(name, emberVersion) {
  return {
    name,
    npm: {
      devDependencies: {
        'ember-source': emberVersion,
        '@embroider/compat': '^4.0.3',
        'ember-cli': '^5.12.0',
        'ember-auto-import': '^2.10.0',
        '@ember/optional-features': '^2.2.0',
      },
    },
    env: {
      ENABLE_COMPAT_BUILD: true,
    },
    files: {
      'ember-cli-build.js': emberCliBuildJS(),
      'config/optional-features.json': JSON.stringify({
        'application-template-wrapper': false,
        'default-async-observers': true,
        'jquery-integration': false,
        'template-only-glimmer-components': true,
        'no-implicit-route-model': true,
      }),
    },
  };
}
